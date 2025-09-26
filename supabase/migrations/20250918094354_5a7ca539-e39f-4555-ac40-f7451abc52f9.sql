-- Add missing earnings_total column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN earnings_total numeric DEFAULT 0;

-- Update existing contractor profiles to have earnings_total initialized
UPDATE public.profiles 
SET earnings_total = 0 
WHERE account_type = 'contractor' AND earnings_total IS NULL;