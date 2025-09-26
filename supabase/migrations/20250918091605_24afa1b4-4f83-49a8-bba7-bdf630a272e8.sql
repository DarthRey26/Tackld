-- Update the accept_bid_atomic function to set current_stage to 'arriving' instead of 'contractor_assigned'
CREATE OR REPLACE FUNCTION public.accept_bid_atomic(bid_id_param uuid, customer_id_param uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Update booking with contractor assignment - set current_stage to 'arriving'
  UPDATE public.bookings 
  SET 
    contractor_id = bid_record.contractor_id,
    estimated_price = bid_record.amount,
    status = 'assigned',
    current_stage = 'arriving',
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
$function$