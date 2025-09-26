-- Add missing columns for contractor job progress flow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS before_photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS during_photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS after_photos text[] DEFAULT '{}';

-- Update bookings table to support extra parts as JSONB
ALTER TABLE public.bookings
ALTER COLUMN extra_parts TYPE jsonb USING extra_parts::jsonb;

-- Ensure status column has proper constraints for new flow
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  'pending_bids', 'finding_contractor', 'assigned', 'contractor_found',
  'arriving', 'job_started', 'in_progress', 'completed', 'awaiting_payment', 
  'paid', 'cancelled'
));

-- Add index for performance on photo queries
CREATE INDEX IF NOT EXISTS idx_bookings_photos ON public.bookings USING gin (before_photos, during_photos, after_photos);

-- Add trigger to update contractor earnings when booking reaches paid status
CREATE OR REPLACE FUNCTION public.update_contractor_earnings_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update contractor earnings when booking status changes to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.profiles 
    SET 
      earnings_total = COALESCE(earnings_total, 0) + COALESCE(NEW.final_price, NEW.estimated_price, 0),
      total_jobs_completed = COALESCE(total_jobs_completed, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic earnings update
DROP TRIGGER IF EXISTS trigger_update_contractor_earnings ON public.bookings;
CREATE TRIGGER trigger_update_contractor_earnings
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contractor_earnings_on_payment();