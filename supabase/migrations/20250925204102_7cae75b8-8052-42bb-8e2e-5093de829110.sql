-- Update get_user_account_type function to check profiles table first
CREATE OR REPLACE FUNCTION public.get_user_account_type()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_account_type TEXT;
BEGIN
  -- First check the profiles table (authoritative source)
  SELECT account_type INTO user_account_type
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- If found in profiles, return that
  IF user_account_type IS NOT NULL THEN
    RETURN user_account_type;
  END IF;
  
  -- Fall back to JWT user_metadata if not in profiles
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'accountType'),
    (auth.jwt() -> 'user_metadata' ->> 'userType'),
    'customer'
  );
END;
$function$;