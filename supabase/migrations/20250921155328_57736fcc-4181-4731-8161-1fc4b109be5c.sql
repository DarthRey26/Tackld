-- Fix the complete_payment_atomic RPC to update status correctly
CREATE OR REPLACE FUNCTION public.complete_payment_atomic(booking_id_param uuid, payment_method_param text DEFAULT 'simulated'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings 
  WHERE id = booking_id_param AND (status = 'completed' OR current_stage = 'awaiting_payment');

  IF booking_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found or not ready for payment');
  END IF;

  -- Update payment status atomically with proper stage sync
  UPDATE public.bookings 
  SET 
    payment_status = 'paid',
    payment_method = payment_method_param,
    current_stage = 'paid',
    status = 'paid',
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
$function$;