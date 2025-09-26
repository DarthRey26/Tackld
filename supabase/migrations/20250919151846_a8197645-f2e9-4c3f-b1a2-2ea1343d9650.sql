-- Fix function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;