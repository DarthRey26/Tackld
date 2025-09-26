-- AUDIT AND FIX DATABASE ISSUES

-- First, let's check and fix the submit_bid_atomic function
-- The issue mentioned is that "record new_bid is not assigned yet"
-- This suggests the variable declaration/assignment is incorrect

CREATE OR REPLACE FUNCTION public.submit_bid_atomic_fixed(
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
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  contractor_record RECORD;
  existing_bid RECORD;
  new_bid_id uuid;
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

  -- Check for existing bid (all statuses except expired)
  SELECT * INTO existing_bid
  FROM public.bids
  WHERE booking_id = booking_id_param 
    AND contractor_id = contractor_id_param
    AND status != 'expired';

  IF existing_bid IS NOT NULL THEN
    -- Return different messages based on existing bid status
    CASE existing_bid.status
      WHEN 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
      WHEN 'accepted' THEN
        RETURN json_build_object('success', false, 'error', 'Your bid has already been accepted for this booking');
      WHEN 'rejected' THEN
        RETURN json_build_object('success', false, 'error', 'You cannot resubmit a bid for this booking');
      ELSE
        RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
    END CASE;
  END IF;

  -- Handle expired bids by updating them
  SELECT * INTO existing_bid
  FROM public.bids
  WHERE booking_id = booking_id_param 
    AND contractor_id = contractor_id_param
    AND status = 'expired';

  IF existing_bid IS NOT NULL THEN
    -- Update expired bid
    UPDATE public.bids 
    SET 
      amount = amount_param,
      eta_minutes = eta_minutes_param,
      note = note_param,
      included_materials = materials_param,
      expires_at = NOW() + INTERVAL '30 minutes',
      status = 'pending',
      updated_at = NOW()
    WHERE id = existing_bid.id;
    
    new_bid_id := existing_bid.id;
  ELSE
    -- Insert new bid
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
    ) RETURNING id INTO new_bid_id;
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
      'bid_id', new_bid_id,
      'contractor_name', contractor_record.full_name,
      'bid_amount', amount_param
    )
  );

  -- Get the final bid data for return
  SELECT 
    id, amount, eta_minutes, expires_at, status
  INTO result
  FROM public.bids 
  WHERE id = new_bid_id;

  RETURN json_build_object(
    'success', true,
    'bid', json_build_object(
      'id', new_bid_id,
      'amount', amount_param,
      'eta_minutes', eta_minutes_param,
      'expires_at', NOW() + INTERVAL '30 minutes',
      'status', 'pending'
    )
  );

EXCEPTION 
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'You have already submitted a bid for this booking');
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit bid: %', SQLERRM;
END;
$$;

-- Drop the old function and rename the fixed one
DROP FUNCTION IF EXISTS public.submit_bid_atomic(uuid, uuid, numeric, integer, text, jsonb);
ALTER FUNCTION public.submit_bid_atomic_fixed(uuid, uuid, numeric, integer, text, jsonb) RENAME TO submit_bid_atomic;

-- Fix foreign key references in bid queries by ensuring consistent naming
-- Check if the foreign key constraint exists and fix if needed
DO $$
BEGIN
  -- First check current foreign key constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bids_contractor_id_fkey' 
    AND table_name = 'bids'
  ) THEN
    -- Add proper foreign key constraint
    ALTER TABLE public.bids 
    ADD CONSTRAINT bids_contractor_id_fkey 
    FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bids_booking_id_fkey' 
    AND table_name = 'bids'
  ) THEN
    -- Add proper foreign key constraint
    ALTER TABLE public.bids 
    ADD CONSTRAINT bids_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_booking_status ON public.bids(booking_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_contractor_status ON public.bids(contractor_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_expires_at ON public.bids(expires_at) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_service_status ON public.bookings(service_type, status) WHERE contractor_id IS NULL;

-- Optimize cleanup_expired_bids function for better performance
CREATE OR REPLACE FUNCTION public.cleanup_expired_bids()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Use more efficient update with proper indexing
  UPDATE public.bids 
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() 
    AND status = 'pending';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Also clean up very old expired bids (older than 7 days) to prevent bloat
  DELETE FROM public.bids 
  WHERE status = 'expired' 
    AND updated_at < NOW() - INTERVAL '7 days';
  
  RETURN json_build_object(
    'success', true, 
    'expired_bids_count', expired_count,
    'cleanup_time', NOW()
  );
END;
$$;

-- Fix race conditions in accept_bid_atomic
CREATE OR REPLACE FUNCTION public.accept_bid_atomic(bid_id_param uuid, customer_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bid_record RECORD;
  booking_record RECORD;
  result JSON;
BEGIN
  -- Use SELECT FOR UPDATE to prevent race conditions
  SELECT b.*, bk.customer_id, bk.id as booking_id, bk.status as booking_status
  INTO bid_record
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.id = bid_id_param AND b.status = 'pending'
  FOR UPDATE OF b, bk;

  -- Validate bid exists and customer ownership
  IF bid_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bid not found or already processed');
  END IF;

  IF bid_record.customer_id != customer_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Not your booking');
  END IF;

  IF bid_record.booking_status NOT IN ('pending_bids', 'finding_contractor') THEN
    RETURN json_build_object('success', false, 'error', 'Booking no longer accepting bids');
  END IF;

  -- Check if bid is expired
  IF bid_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'This bid has expired');
  END IF;

  -- Atomic updates within transaction
  -- Accept the selected bid
  UPDATE public.bids 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = bid_id_param;

  -- Reject all other bids for this booking atomically
  UPDATE public.bids 
  SET status = 'rejected', updated_at = NOW()
  WHERE booking_id = bid_record.booking_id 
    AND id != bid_id_param 
    AND status = 'pending';

  -- Update booking with contractor assignment
  UPDATE public.bookings 
  SET 
    contractor_id = bid_record.contractor_id,
    estimated_price = bid_record.amount,
    status = 'assigned',
    current_stage = 'contractor_assigned',
    progress = jsonb_set(
      COALESCE(progress, '{}'),
      '{last_updated}',
      to_jsonb(NOW()::text)
    ),
    updated_at = NOW()
  WHERE id = bid_record.booking_id;

  -- Create notifications atomically
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (bid_record.contractor_id, 'bid_accepted', 'Bid Accepted!', 'Your bid has been accepted for a job.', 
     json_build_object('booking_id', bid_record.booking_id, 'bid_id', bid_id_param)),
    (customer_id_param, 'contractor_assigned', 'Contractor Assigned', 'A contractor has been assigned to your booking.', 
     json_build_object('booking_id', bid_record.booking_id, 'contractor_id', bid_record.contractor_id));

  result := json_build_object(
    'success', true, 
    'booking_id', bid_record.booking_id,
    'contractor_id', bid_record.contractor_id,
    'amount', bid_record.amount
  );

  RETURN result;

EXCEPTION 
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to accept bid: %', SQLERRM;
END;
$$;