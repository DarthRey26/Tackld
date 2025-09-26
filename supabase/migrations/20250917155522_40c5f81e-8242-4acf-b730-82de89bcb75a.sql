-- Add missing contractor performance fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS jobs_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_forfeited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS earnings_total NUMERIC(10,2) DEFAULT 0.00;

-- Update existing profiles table to ensure all contractor fields have proper defaults
UPDATE public.profiles 
SET 
  jobs_completed = COALESCE(jobs_completed, 0),
  jobs_forfeited = COALESCE(jobs_forfeited, 0),
  success_rate = COALESCE(success_rate, 0.00),
  earnings_total = COALESCE(earnings_total, 0.00),
  rating = COALESCE(rating, 5.0),
  total_reviews = COALESCE(total_reviews, 0),
  total_jobs = COALESCE(total_jobs, 0)
WHERE account_type = 'contractor';

-- Create a function to update contractor success rate automatically
CREATE OR REPLACE FUNCTION public.update_contractor_success_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    success_rate = CASE 
      WHEN (jobs_completed + jobs_forfeited) > 0 
      THEN ROUND((jobs_completed::NUMERIC / (jobs_completed + jobs_forfeited)) * 100, 2)
      ELSE 0.00 
    END,
    updated_at = NOW()
  WHERE id = NEW.id AND account_type = 'contractor';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update success rate when jobs_completed or jobs_forfeited changes
DROP TRIGGER IF EXISTS update_success_rate_trigger ON public.profiles;
CREATE TRIGGER update_success_rate_trigger
  AFTER UPDATE OF jobs_completed, jobs_forfeited ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contractor_success_rate();

-- Create a test booking for contractors to see
INSERT INTO public.bookings (
  id,
  customer_id,
  customer_name,
  customer_email,
  customer_phone,
  service_type,
  booking_type,
  status,
  address,
  scheduled_date,
  scheduled_time,
  urgency,
  description,
  service_questions,
  uploaded_images,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Test Customer',
  'test@customer.com',
  '+65 9876 5432',
  'aircon',
  'saver',
  'finding_contractor',
  '{"line1": "123 Test Street", "line2": "#01-01", "postal_code": "123456", "city": "Singapore", "country": "Singapore"}',
  '2025-09-20',
  '14:00:00',
  'normal',
  'Aircon servicing needed for 2 units. System 1 in living room not cooling properly.',
  '{"units": "2", "type": "servicing", "issue": "not_cooling", "last_service": "6_months_ago"}',
  ARRAY['https://example.com/aircon1.jpg', 'https://example.com/aircon2.jpg'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;