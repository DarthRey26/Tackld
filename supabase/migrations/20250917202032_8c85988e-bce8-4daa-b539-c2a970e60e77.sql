-- Fix submit_bid_atomic RPC to properly handle new_bid assignment
CREATE OR REPLACE FUNCTION public.submit_bid_atomic(
  booking_id_param uuid, 
  contractor_id_param uuid, 
  amount_param numeric, 
  eta_minutes_param integer, 
  note_param text DEFAULT NULL::text, 
  materials_param jsonb DEFAULT '[]'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  contractor_record RECORD;
  existing_bid RECORD;
  new_bid public.bids%ROWTYPE;  -- Properly declare as bids row type
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings
  WHERE id = booking_id_param 
    AND status IN ('pending_bids', 'finding_contractor')
    AND contractor_id IS NULL;

  IF booking_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or no longer accepting bids');
  END IF;

  -- Get contractor details
  SELECT * INTO contractor_record
  FROM public.profiles
  WHERE id = contractor_id_param 
    AND account_type = 'contractor'
    AND service_type = booking_record.service_type
    AND is_available = true;

  IF contractor_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contractor profile not found or not eligible');
  END IF;

  -- Check for existing bid more thoroughly (including all statuses)
  SELECT * INTO existing_bid
  FROM public.bids
  WHERE booking_id = booking_id_param 
    AND contractor_id = contractor_id_param;

  IF existing_bid IS NOT NULL THEN
    -- Return different messages based on existing bid status
    CASE existing_bid.status
      WHEN 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
      WHEN 'accepted' THEN
        RETURN json_build_object('success', false, 'error', 'Your bid has already been accepted for this booking');
      WHEN 'rejected' THEN
        RETURN json_build_object('success', false, 'error', 'You cannot resubmit a bid for this booking');
      WHEN 'expired' THEN
        -- Allow resubmission if previous bid expired
        UPDATE public.bids 
        SET 
          amount = amount_param,
          eta_minutes = eta_minutes_param,
          note = note_param,
          included_materials = materials_param,
          expires_at = NOW() + INTERVAL '30 minutes',
          status = 'pending',
          updated_at = NOW()
        WHERE id = existing_bid.id
        RETURNING * INTO new_bid;
      ELSE
        RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
    END CASE;
  ELSE
    -- Insert new bid if no existing bid was found
    BEGIN
      INSERT INTO public.bids (
        booking_id,
        contractor_id,
        amount,
        eta_minutes,
        note,
        included_materials,
        expires_at,
        status
      ) VALUES (
        booking_id_param,
        contractor_id_param,
        amount_param,
        eta_minutes_param,
        note_param,
        materials_param,
        NOW() + INTERVAL '30 minutes',
        'pending'
      ) RETURNING * INTO new_bid;
    EXCEPTION WHEN unique_violation THEN
      -- Handle race condition where bid was inserted between our check and insert
      RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
    END;
  END IF;

  -- Update contractor stats
  UPDATE public.profiles 
  SET 
    total_bids_submitted = total_bids_submitted + 1,
    updated_at = NOW()
  WHERE id = contractor_id_param;

  -- Create notification for customer
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    booking_record.customer_id,
    'new_bid',
    'New Bid Received',
    'A contractor has submitted a bid for your booking.',
    json_build_object(
      'booking_id', booking_id_param,
      'bid_id', new_bid.id,
      'contractor_name', contractor_record.full_name,
      'bid_amount', amount_param
    )
  );

  result := json_build_object(
    'success', true,
    'bid', json_build_object(
      'id', new_bid.id,
      'amount', new_bid.amount,
      'eta_minutes', new_bid.eta_minutes,
      'expires_at', new_bid.expires_at,
      'status', new_bid.status
    )
  );

  RETURN result;
END;
$function$;

-- Update get_enhanced_contractor_dashboard to exclude rejected/expired bids
CREATE OR REPLACE FUNCTION public.get_enhanced_contractor_dashboard(contractor_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contractor_bids JSON;
  available_jobs JSON;
  contractor_profile RECORD;
  result JSON;
BEGIN
  -- Get contractor profile
  SELECT service_type, account_type, contractor_type INTO contractor_profile
  FROM public.profiles 
  WHERE id = contractor_id_param AND account_type = 'contractor';

  IF contractor_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contractor profile not found');
  END IF;

  -- Clean up expired bids first using correct status
  PERFORM public.cleanup_expired_bids();

  -- Get contractor's bids with booking details - exclude rejected/expired
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'amount', b.amount,
      'status', b.status,
      'eta_minutes', b.eta_minutes,
      'note', b.note,
      'created_at', b.created_at,
      'expires_at', b.expires_at,
      'booking', json_build_object(
        'id', bk.id,
        'service_type', bk.service_type,
        'customer_name', bk.customer_name,
        'status', bk.status,
        'current_stage', bk.current_stage,
        'scheduled_date', bk.scheduled_date,
        'scheduled_time', bk.scheduled_time,
        'address', bk.address,
        'description', bk.description,
        'urgency', bk.urgency,
        'booking_type', bk.booking_type,
        'created_at', bk.created_at
      )
    ) ORDER BY b.created_at DESC
  ) INTO contractor_bids
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.contractor_id = contractor_id_param
    AND b.status IN ('pending', 'accepted'); -- Only show pending and accepted bids

  -- Get available jobs with bid status indicators
  SELECT json_agg(
    json_build_object(
      'id', bk.id,
      'service_type', bk.service_type,
      'customer_name', bk.customer_name,
      'status', bk.status,
      'current_stage', bk.current_stage,
      'scheduled_date', bk.scheduled_date,
      'scheduled_time', bk.scheduled_time,
      'address', bk.address,
      'description', bk.description,
      'urgency', bk.urgency,
      'booking_type', bk.booking_type,
      'price_range_min', bk.price_range_min,
      'price_range_max', bk.price_range_max,
      'created_at', bk.created_at,
      'has_bid', CASE WHEN bid_check.id IS NOT NULL THEN true ELSE false END,
      'bid_status', COALESCE(bid_check.status, 'none'),
      'bid_amount', bid_check.amount,
      'bid_expires_at', bid_check.expires_at,
      'total_bids', (
        SELECT COUNT(*) 
        FROM public.bids b2 
        WHERE b2.booking_id = bk.id 
          AND b2.status = 'pending' 
          AND b2.expires_at > NOW()
      )
    ) ORDER BY bk.created_at DESC
  ) INTO available_jobs
  FROM public.bookings bk
  LEFT JOIN public.bids bid_check ON bk.id = bid_check.booking_id 
    AND bid_check.contractor_id = contractor_id_param
    AND bid_check.status IN ('pending', 'accepted') -- Only check for active bids
  WHERE bk.service_type = contractor_profile.service_type 
    AND bk.status IN ('pending_bids', 'finding_contractor')
    AND bk.contractor_id IS NULL;

  result := json_build_object(
    'success', true,
    'contractor_bids', COALESCE(contractor_bids, '[]'::json),
    'available_jobs', COALESCE(available_jobs, '[]'::json),
    'contractor_profile', json_build_object(
      'service_type', contractor_profile.service_type,
      'contractor_type', contractor_profile.contractor_type
    )
  );

  RETURN result;
END;
$function$;