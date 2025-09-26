-- Drop the old function with years_experience to resolve overloading
DROP FUNCTION IF EXISTS public.create_contractor_account(text, text, text, text, text, text, text, integer);

-- Update the create_contractor_account function to support password creation
CREATE OR REPLACE FUNCTION public.create_contractor_account(
  contractor_email text, 
  contractor_name text, 
  contractor_phone text, 
  service_type text, 
  contractor_type text, 
  contractor_password text,
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
  new_user_id UUID;
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

  -- Create the auth user with admin privileges
  SELECT auth.admin_create_user(
    json_build_object(
      'email', contractor_email,
      'password', contractor_password,
      'email_confirm', true,
      'user_metadata', json_build_object(
        'fullName', contractor_name,
        'phoneNumber', contractor_phone,
        'accountType', 'contractor',
        'serviceType', service_type,
        'contractorType', contractor_type,
        'companyName', company_name,
        'bio', bio
      )
    )
  ) INTO new_user_id;

  -- The profile will be created automatically by the handle_new_user trigger
  -- But we'll update it to ensure verification status
  UPDATE public.profiles 
  SET 
    is_verified = true,
    is_available = true,
    updated_at = NOW()
  WHERE id = new_user_id;

  -- Log admin action
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'create_contractor_account_with_password',
    new_user_id,
    json_build_object(
      'email', contractor_email,
      'name', contractor_name,
      'service_type', service_type,
      'contractor_type', contractor_type
    )
  );

  RETURN json_build_object(
    'success', true,
    'contractor_id', new_user_id,
    'message', 'Contractor account created successfully with login credentials.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;