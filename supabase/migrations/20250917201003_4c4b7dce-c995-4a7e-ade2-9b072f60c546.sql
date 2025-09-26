-- Fix submit_bid_atomic to handle unique constraint violation better
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
  new_bid RECORD;
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
  END IF;

  -- Only insert if no existing bid was found
  IF existing_bid IS NULL THEN
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