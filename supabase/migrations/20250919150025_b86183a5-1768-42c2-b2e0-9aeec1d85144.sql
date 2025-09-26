-- Fix RLS policies to allow customers to view contractor profiles when viewing bids
-- This policy allows customers to view contractor profiles when they're viewing bids for their bookings

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Contractors can view other contractor profiles for bidding" ON public.profiles;

-- Create a new policy that allows:
-- 1. Users to view their own profile
-- 2. Contractors to view other contractor profiles 
-- 3. Customers to view contractor profiles when those contractors have bid on their bookings
CREATE POLICY "Enhanced contractor profile visibility for bidding" ON public.profiles
FOR SELECT USING (
  -- Users can view their own profile
  auth.uid() = id 
  OR 
  -- Contractors can view other contractor profiles
  (account_type = 'contractor' AND EXISTS(
    SELECT 1 FROM public.profiles viewer 
    WHERE viewer.id = auth.uid() AND viewer.account_type = 'contractor'
  ))
  OR
  -- Customers can view contractor profiles who have bid on their bookings
  (account_type = 'contractor' AND EXISTS(
    SELECT 1 FROM public.bids b
    JOIN public.bookings bk ON b.booking_id = bk.id
    WHERE b.contractor_id = profiles.id 
    AND bk.customer_id = auth.uid()
  ))
);