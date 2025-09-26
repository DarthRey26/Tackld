-- Update the handle_new_user function to remove wallet creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    phone_number, 
    account_type,
    contractor_type,
    service_type,
    company_name,
    bio,
    years_experience
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'fullName',
    NEW.raw_user_meta_data ->> 'phoneNumber',
    COALESCE(NEW.raw_user_meta_data ->> 'accountType', 'customer'),
    NEW.raw_user_meta_data ->> 'contractorType',
    NEW.raw_user_meta_data ->> 'serviceType',
    NEW.raw_user_meta_data ->> 'companyName',
    NEW.raw_user_meta_data ->> 'bio',
    COALESCE((NEW.raw_user_meta_data ->> 'yearsExperience')::INTEGER, 0)
  );
  
  RETURN NEW;
END;
$$;