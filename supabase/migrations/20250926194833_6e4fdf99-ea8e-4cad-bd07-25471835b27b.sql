-- Fix the contractor earnings trigger to only count properly paid bookings
CREATE OR REPLACE FUNCTION public.update_contractor_earnings_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update earnings when payment_status changes to 'paid' (not just status)
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    UPDATE public.profiles 
    SET 
      earnings_total = COALESCE(earnings_total, 0) + COALESCE(NEW.final_price, NEW.estimated_price, 0),
      total_jobs_completed = COALESCE(total_jobs_completed, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  -- Handle payment_status reversal (from paid back to pending/failed)
  IF OLD.payment_status = 'paid' AND NEW.payment_status != 'paid' THEN
    UPDATE public.profiles 
    SET 
      earnings_total = GREATEST(COALESCE(earnings_total, 0) - COALESCE(NEW.final_price, NEW.estimated_price, 0), 0),
      total_jobs_completed = GREATEST(COALESCE(total_jobs_completed, 0) - 1, 0),
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recalculate all contractor earnings based on actual paid bookings
WITH correct_earnings AS (
  SELECT 
    p.id as contractor_id,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.final_price, b.estimated_price, 0) ELSE 0 END), 0) as actual_earnings,
    COUNT(CASE WHEN b.payment_status = 'paid' THEN 1 END) as actual_jobs_completed
  FROM profiles p
  LEFT JOIN bookings b ON p.id = b.contractor_id
  WHERE p.account_type = 'contractor'
  GROUP BY p.id
)
UPDATE profiles 
SET 
  earnings_total = ce.actual_earnings,
  total_jobs_completed = ce.actual_jobs_completed,
  updated_at = NOW()
FROM correct_earnings ce
WHERE profiles.id = ce.contractor_id AND profiles.account_type = 'contractor';