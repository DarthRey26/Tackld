-- Fix function search path security warnings

-- Update handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  
  -- Create wallet for contractors
  IF NEW.raw_user_meta_data ->> 'accountType' = 'contractor' THEN
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_contractor_stats function with proper search path
CREATE OR REPLACE FUNCTION public.update_contractor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contractor profile stats when booking is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles 
    SET 
      total_jobs = total_jobs + 1,
      total_jobs_completed = total_jobs_completed + 1,
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_contractor_rating function with proper search path
CREATE OR REPLACE FUNCTION public.update_contractor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new average rating for contractor
  SELECT 
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews 
  WHERE contractor_id = NEW.contractor_id;
  
  -- Update contractor profile
  UPDATE public.profiles 
  SET 
    rating = avg_rating,
    total_reviews = review_count,
    updated_at = NOW()
  WHERE id = NEW.contractor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;