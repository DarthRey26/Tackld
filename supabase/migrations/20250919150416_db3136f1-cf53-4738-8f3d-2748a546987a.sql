-- Fix infinite recursion in profiles RLS policy
-- Create security definer function to get current user's account type

CREATE OR REPLACE FUNCTION public.get_current_user_account_type()
RETURNS TEXT AS $$
  SELECT account_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Enhanced contractor profile visibility for bidding" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Contractors can view other contractor profiles for bidding" ON public.profiles;

-- Recreate all necessary policies without recursion
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Contractors can view other contractor profiles" ON public.profiles
FOR SELECT USING (
  account_type = 'contractor' 
  AND public.get_current_user_account_type() = 'contractor'
);

CREATE POLICY "Customers can view contractor profiles who bid on their bookings" ON public.profiles
FOR SELECT USING (
  account_type = 'contractor' 
  AND public.get_current_user_account_type() = 'customer'
  AND EXISTS(
    SELECT 1 FROM public.bids b
    JOIN public.bookings bk ON b.booking_id = bk.id
    WHERE b.contractor_id = profiles.id 
    AND bk.customer_id = auth.uid()
  )
);