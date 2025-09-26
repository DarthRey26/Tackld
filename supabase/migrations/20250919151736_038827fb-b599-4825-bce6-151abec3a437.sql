-- Fix infinite recursion in profiles RLS policies
-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Contractors can view other contractor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view contractor profiles who bid on their booking" ON public.profiles;

-- Drop the problematic function and recreate it properly
DROP FUNCTION IF EXISTS public.get_current_user_account_type();

-- Create a simpler function that accesses JWT correctly
CREATE OR REPLACE FUNCTION public.get_user_account_type()
RETURNS TEXT AS $$
BEGIN
  -- Try to get account type from JWT user_metadata
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'accountType'),
    (auth.jwt() -> 'user_metadata' ->> 'userType'),
    'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, non-recursive RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Simple contractor visibility - contractors can see other contractors
CREATE POLICY "Contractors can view other contractors" 
ON public.profiles 
FOR SELECT 
USING (
  account_type = 'contractor' 
  AND public.get_user_account_type() = 'contractor'
);

-- Customers can view contractors (simplified - no complex subqueries)
CREATE POLICY "Customers can view contractors" 
ON public.profiles 
FOR SELECT 
USING (
  account_type = 'contractor' 
  AND public.get_user_account_type() = 'customer'
);