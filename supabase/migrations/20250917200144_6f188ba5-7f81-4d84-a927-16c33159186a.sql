-- Fix bids table schema issues

-- 1. Update status check constraint to include 'expired'
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE public.bids ADD CONSTRAINT bids_status_check 
    CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]));

-- 2. Clean up duplicate foreign key constraints
-- Drop the constraint that points to auth.users (we want to use profiles)
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_contractor_id_fkey;

-- Keep the constraint that points to profiles and ensure it exists
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS fk_bids_contractor_id;
ALTER TABLE public.bids ADD CONSTRAINT bids_contractor_id_fkey 
    FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Update any existing 'withdrawn' status to 'expired' for consistency
UPDATE public.bids SET status = 'expired' WHERE status = 'withdrawn';

-- Ensure proper RLS policies are in place for the updated constraints
-- Drop and recreate the bids policies to ensure they work with the new schema

-- 4. Update cleanup_expired_bids function to use correct status values
CREATE OR REPLACE FUNCTION public.cleanup_expired_bids()
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired bids to use 'expired' status (not 'withdrawn')
  UPDATE public.bids 
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() AND status = 'pending';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true, 
    'expired_bids_count', expired_count,
    'cleanup_time', NOW()
  );
END;
$$;

-- 5. Update get_enhanced_contractor_dashboard to use correct status values
CREATE OR REPLACE FUNCTION public.get_enhanced_contractor_dashboard(
  contractor_id_param UUID
) RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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

  -- Get contractor's bids with booking details using correct foreign key
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
    AND b.status IN ('pending', 'accepted', 'rejected'); -- Exclude expired bids

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
    AND bid_check.status IN ('pending', 'accepted', 'rejected') -- Exclude expired
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
$$;

-- 6. Update submit_bid_atomic to ensure it only uses valid statuses
CREATE OR REPLACE FUNCTION public.submit_bid_atomic(
  booking_id_param UUID,
  contractor_id_param UUID,
  amount_param NUMERIC,
  eta_minutes_param INTEGER,
  note_param TEXT DEFAULT NULL,
  materials_param JSONB DEFAULT '[]'::jsonb
) RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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

  -- Check for existing bid (exclude expired)
  SELECT * INTO existing_bid
  FROM public.bids
  WHERE booking_id = booking_id_param 
    AND contractor_id = contractor_id_param
    AND status IN ('pending', 'accepted', 'rejected'); -- Don't count expired as existing

  IF existing_bid IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
  END IF;

  -- Create the bid with correct status
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
    'pending' -- Use valid status
  ) RETURNING * INTO new_bid;

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
$$;