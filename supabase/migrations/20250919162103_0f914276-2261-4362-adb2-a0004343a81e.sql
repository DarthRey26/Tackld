-- Create appeals table for post-payment disputes
CREATE TABLE public.appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  extra_part_id UUID,
  appeal_type TEXT NOT NULL DEFAULT 'extra_parts',
  reason TEXT NOT NULL,
  evidence_photos TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  resolution_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for appeals
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can create appeals for their bookings" 
ON public.appeals 
FOR INSERT 
WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id AND customer_id = auth.uid()
  )
);

CREATE POLICY "Customers can view their own appeals" 
ON public.appeals 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own appeals" 
ON public.appeals 
FOR UPDATE 
USING (auth.uid() = customer_id);

-- Add escrow status to bookings table
ALTER TABLE public.bookings 
ADD COLUMN escrow_status TEXT DEFAULT 'none',
ADD COLUMN escrow_amount NUMERIC DEFAULT 0;

-- Add customer action field to extra_parts table
ALTER TABLE public.extra_parts 
ADD COLUMN customer_action TEXT DEFAULT 'pending',
ADD COLUMN customer_notes TEXT,
ADD COLUMN action_timestamp TIMESTAMP WITH TIME ZONE;

-- Create function to handle extra parts customer actions
CREATE OR REPLACE FUNCTION public.handle_extra_parts_customer_action(
  part_id_param UUID,
  customer_id_param UUID,
  action_param TEXT,
  notes_param TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  part_record RECORD;
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get extra part with booking info
  SELECT ep.*, b.customer_id, b.id as booking_id, b.final_price, b.estimated_price
  INTO part_record
  FROM extra_parts ep
  JOIN bookings b ON ep.booking_id = b.id
  WHERE ep.id = part_id_param;

  IF part_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Extra part not found');
  END IF;

  IF part_record.customer_id != customer_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Update extra part with customer action
  UPDATE extra_parts 
  SET 
    customer_action = action_param,
    customer_notes = notes_param,
    action_timestamp = NOW(),
    status = CASE 
      WHEN action_param = 'approved' THEN 'approved'
      WHEN action_param = 'rejected' THEN 'rejected'
      WHEN action_param = 'disregarded' THEN 'disregarded'
      WHEN action_param = 'pay_and_appeal' THEN 'approved'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = part_id_param;

  -- Handle different actions
  CASE action_param
    WHEN 'approved' THEN
      -- Update booking final price
      UPDATE bookings 
      SET final_price = COALESCE(final_price, estimated_price, 0) + part_record.total_price
      WHERE id = part_record.booking_id;
      
    WHEN 'pay_and_appeal' THEN
      -- Update booking final price and set escrow
      UPDATE bookings 
      SET 
        final_price = COALESCE(final_price, estimated_price, 0) + part_record.total_price,
        escrow_status = 'pending',
        escrow_amount = escrow_amount + part_record.total_price
      WHERE id = part_record.booking_id;
      
    WHEN 'disregarded' THEN
      -- Notify contractor
      INSERT INTO notifications (user_id, type, title, message, data)
      SELECT 
        contractor_id,
        'parts_disregarded',
        'Extra Parts Disregarded',
        'Customer has chosen to disregard additional parts request.',
        json_build_object('booking_id', part_record.booking_id, 'part_id', part_id_param)
      FROM bookings 
      WHERE id = part_record.booking_id;
      
    ELSE
      -- Default approved case
      NULL;
  END CASE;

  RETURN json_build_object(
    'success', true,
    'action', action_param,
    'part_id', part_id_param
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;