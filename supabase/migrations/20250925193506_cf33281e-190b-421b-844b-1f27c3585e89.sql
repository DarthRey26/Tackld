-- Create RLS policy for admin to manage contractor profiles (fixed syntax)
CREATE POLICY "Admins can create contractor profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  get_user_account_type() = 'admin' 
  AND account_type = 'contractor'
);

-- Create RLS policy for admin to update contractor profiles  
CREATE POLICY "Admins can update contractor profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  get_user_account_type() = 'admin' 
  AND account_type = 'contractor'
);

-- Create RLS policy for admin to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_account_type() = 'admin');

-- Add audit logging table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for admin audit log
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (get_user_account_type() = 'admin');

CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Function to create contractor account (admin only)
CREATE OR REPLACE FUNCTION public.create_contractor_account(
  contractor_email TEXT,
  contractor_name TEXT,
  contractor_phone TEXT,
  service_type TEXT,
  contractor_type TEXT,
  company_name TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  years_experience INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    years_experience,
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
    years_experience,
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
$$;