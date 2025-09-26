-- Update the create_contractor_account function to remove years_experience parameter
CREATE OR REPLACE FUNCTION public.create_contractor_account(
  contractor_email text, 
  contractor_name text, 
  contractor_phone text, 
  service_type text, 
  contractor_type text, 
  company_name text DEFAULT NULL::text, 
  bio text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_account_type TEXT;
  new_contractor_id UUID;
  result JSON;
BEGIN
  -- Check if caller is admin
  SELECT get_user_account_type() INTO admin_account_type;
  
  IF admin_account_type != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Validate contractor_type (only allow 'saver' and 'tacklers_choice')
  IF contractor_type NOT IN ('saver', 'tacklers_choice') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid contractor type. Must be either "saver" or "tacklers_choice"');
  END IF;

  -- Generate a UUID for the contractor (they'll need to sign up with this email)
  new_contractor_id := gen_random_uuid();

  -- Create placeholder profile (will be updated when user actually signs up)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone_number,
    account_type,
    service_type,
    contractor_type,
    company_name,
    bio,
    is_verified,
    is_available
  ) VALUES (
    new_contractor_id,
    contractor_email,
    contractor_name,
    contractor_phone,
    'contractor',
    service_type,
    contractor_type,
    company_name,
    bio,
    false, -- Will be verified after signup
    true
  );

  -- Log admin action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'create_contractor_account',
    new_contractor_id,
    json_build_object(
      'email', contractor_email,
      'name', contractor_name,
      'service_type', service_type,
      'contractor_type', contractor_type
    )
  );

  RETURN json_build_object(
    'success', true,
    'contractor_id', new_contractor_id,
    'message', 'Contractor account created. Email invitation should be sent.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;