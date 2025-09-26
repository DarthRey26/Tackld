-- Fix infinite recursion by using JWT metadata instead of profiles table query
CREATE OR REPLACE FUNCTION public.get_current_user_account_type()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'accountType')::text,
    'customer'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;