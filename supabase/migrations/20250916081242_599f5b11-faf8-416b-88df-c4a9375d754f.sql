-- Remove wallet-related columns from profiles table since we'll use Stripe
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS wallet_balance,
DROP COLUMN IF EXISTS earnings_total;

-- Update rating default to 5.0 instead of 0
ALTER TABLE public.profiles 
ALTER COLUMN rating SET DEFAULT 5.0;

-- Update existing profiles with 0 rating to 5.0
UPDATE public.profiles 
SET rating = 5.0 
WHERE rating = 0 OR rating IS NULL;

-- Drop the wallets table entirely since we'll use Stripe for payments
DROP TABLE IF EXISTS public.wallets CASCADE;