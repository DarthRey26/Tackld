-- Update existing bookings with 'contractor_assigned' stage to 'arriving'
UPDATE public.bookings 
SET current_stage = 'arriving',
    updated_at = NOW()
WHERE current_stage = 'contractor_assigned' 
  AND contractor_id IS NOT NULL 
  AND status = 'assigned';