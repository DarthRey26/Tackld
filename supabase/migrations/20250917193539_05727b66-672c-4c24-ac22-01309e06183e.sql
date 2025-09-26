-- 1. Add normalized progress tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'pending_bids';

-- Update existing bookings to have current_stage from progress JSONB
UPDATE public.bookings 
SET current_stage = COALESCE(progress->>'current_stage', 'pending_bids')
WHERE current_stage IS NULL;

-- 2. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_bids_expires_at ON public.bids(expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_current_stage ON public.bookings(current_stage);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type_status ON public.bookings(service_type, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_timestamp ON public.booking_logs(booking_id, timestamp DESC);

-- 3. Create atomic bid acceptance function
CREATE OR REPLACE FUNCTION public.accept_bid_atomic(
  bid_id_param UUID,
  customer_id_param UUID
) RETURNS JSON AS $$
DECLARE
  bid_record RECORD;
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get bid details with booking info
  SELECT b.*, bk.customer_id, bk.id as booking_id, bk.status as booking_status
  INTO bid_record
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.id = bid_id_param AND b.status = 'pending';

  -- Validate bid exists and customer ownership
  IF bid_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bid not found or already processed');
  END IF;

  IF bid_record.customer_id != customer_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Not your booking');
  END IF;

  IF bid_record.booking_status != 'pending_bids' AND bid_record.booking_status != 'finding_contractor' THEN
    RETURN json_build_object('success', false, 'error', 'Booking no longer accepting bids');
  END IF;

  -- Check if bid is expired
  IF bid_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'This bid has expired');
  END IF;

  -- Atomic updates within transaction
  BEGIN
    -- Accept the selected bid
    UPDATE public.bids 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = bid_id_param;

    -- Reject all other bids for this booking
    UPDATE public.bids 
    SET status = 'rejected', updated_at = NOW()
    WHERE booking_id = bid_record.booking_id AND id != bid_id_param AND status = 'pending';

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

    -- Create notifications
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

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to accept bid: %', SQLERRM;
  END;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create atomic bid rejection function
CREATE OR REPLACE FUNCTION public.reject_bid_atomic(
  bid_id_param UUID,
  customer_id_param UUID,
  reason_param TEXT DEFAULT 'Customer choice'
) RETURNS JSON AS $$
DECLARE
  bid_record RECORD;
  result JSON;
BEGIN
  -- Get bid details with booking info
  SELECT b.*, bk.customer_id, bk.id as booking_id
  INTO bid_record
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.id = bid_id_param AND b.status = 'pending';

  -- Validate bid exists and customer ownership
  IF bid_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Bid not found or already processed');
  END IF;

  IF bid_record.customer_id != customer_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Not your booking');
  END IF;

  -- Update bid status
  UPDATE public.bids 
  SET 
    status = 'rejected',
    customer_response = jsonb_build_object('reason', reason_param, 'rejected_at', NOW()),
    updated_at = NOW()
  WHERE id = bid_id_param;

  -- Create notification for contractor
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    bid_record.contractor_id, 
    'bid_rejected', 
    'Bid Rejected', 
    'Your bid was not selected for this job.', 
    json_build_object('booking_id', bid_record.booking_id, 'reason', reason_param)
  );

  result := json_build_object('success', true, 'bid_id', bid_id_param);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create contractor dashboard function
CREATE OR REPLACE FUNCTION public.get_contractor_dashboard(
  contractor_id_param UUID
) RETURNS JSON AS $$
DECLARE
  contractor_bids JSON;
  available_jobs JSON;
  contractor_profile RECORD;
  result JSON;
BEGIN
  -- Get contractor profile
  SELECT service_type, account_type INTO contractor_profile
  FROM public.profiles 
  WHERE id = contractor_id_param AND account_type = 'contractor';

  IF contractor_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contractor profile not found');
  END IF;

  -- Get contractor's bids with booking details
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
        'created_at', bk.created_at
      )
    ) ORDER BY b.created_at DESC
  ) INTO contractor_bids
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.contractor_id = contractor_id_param;

  -- Get available jobs (excluding those contractor already bid on)
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
      'has_bid', CASE WHEN bid_check.contractor_id IS NOT NULL THEN true ELSE false END
    ) ORDER BY bk.created_at DESC
  ) INTO available_jobs
  FROM public.bookings bk
  LEFT JOIN public.bids bid_check ON bk.id = bid_check.booking_id AND bid_check.contractor_id = contractor_id_param
  WHERE bk.service_type = contractor_profile.service_type 
    AND bk.status IN ('pending_bids', 'finding_contractor')
    AND bk.contractor_id IS NULL;

  result := json_build_object(
    'success', true,
    'contractor_bids', COALESCE(contractor_bids, '[]'::json),
    'available_jobs', COALESCE(available_jobs, '[]'::json)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create payment completion function
CREATE OR REPLACE FUNCTION public.complete_payment_atomic(
  booking_id_param UUID,
  payment_method_param TEXT DEFAULT 'simulated'
) RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings 
  WHERE id = booking_id_param AND status = 'completed';

  IF booking_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or not completed');
  END IF;

  -- Update payment status atomically
  UPDATE public.bookings 
  SET 
    payment_status = 'paid',
    payment_method = payment_method_param,
    current_stage = 'payment_completed',
    progress = jsonb_set(
      COALESCE(progress, '{}'),
      '{payment_completed_at}',
      to_jsonb(NOW()::text)
    ),
    updated_at = NOW()
  WHERE id = booking_id_param;

  -- Create notifications
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES 
    (booking_record.customer_id, 'payment_completed', 'Payment Processed', 'Your payment has been processed successfully.', 
     json_build_object('booking_id', booking_id_param, 'amount', booking_record.final_price)),
    (booking_record.contractor_id, 'payment_received', 'Payment Received', 'Payment for your completed job has been processed.', 
     json_build_object('booking_id', booking_id_param, 'amount', booking_record.final_price));

  result := json_build_object(
    'success', true, 
    'booking_id', booking_id_param,
    'final_price', booking_record.final_price
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create expired bid cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_bids() 
RETURNS JSON AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired bids
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_bid_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_bid_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contractor_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_bids TO authenticated;

-- 9. Set up cron job for bid cleanup (runs every 5 minutes)
SELECT cron.schedule(
  'cleanup-expired-bids',
  '*/5 * * * *',
  $$SELECT public.cleanup_expired_bids();$$
);