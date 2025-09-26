-- Create or update admin profile for tackldadmin@gmail.com
-- This will be executed after the user manually creates the auth account

-- Function to promote a user to admin status
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Find the user by email
  SELECT id, email, account_type INTO user_record
  FROM public.profiles 
  WHERE email = user_email;

  IF user_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Update the user to admin
  UPDATE public.profiles 
  SET 
    account_type = 'admin',
    full_name = 'Tackld Admin',
    updated_at = NOW()
  WHERE email = user_email;

  -- Log the promotion
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (
    user_record.id,
    'promote_to_admin',
    user_record.id,
    json_build_object('email', user_email, 'promoted_at', NOW())
  );

  RETURN json_build_object(
    'success', true, 
    'message', 'User promoted to admin successfully',
    'user_id', user_record.id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Automatically promote tackldadmin@gmail.com to admin when they sign up
-- This will run after the handle_new_user trigger creates the initial profile
CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is the admin email we want to promote
  IF NEW.email = 'tackldadmin@gmail.com' THEN
    -- Update the just-created profile to admin status
    UPDATE public.profiles 
    SET 
      account_type = 'admin',
      full_name = 'Tackld Admin',
      updated_at = NOW()
    WHERE id = NEW.id;

    -- Log the auto-promotion
    INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
    VALUES (
      NEW.id,
      'auto_promote_to_admin',
      NEW.id,
      json_build_object('email', NEW.email, 'auto_promoted_at', NOW())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-promote admin after profile creation
DROP TRIGGER IF EXISTS auto_promote_admin_trigger ON public.profiles;
CREATE TRIGGER auto_promote_admin_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_admin();