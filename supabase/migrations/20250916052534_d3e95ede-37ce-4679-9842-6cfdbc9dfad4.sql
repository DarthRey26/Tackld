-- Create profiles table in Supabase to mirror MongoDB data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'contractor')),
  contractor_type TEXT,
  service_type TEXT,
  company_name TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone_number, 
    account_type,
    contractor_type,
    service_type,
    company_name,
    bio,
    years_experience
  )
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'fullName',
    new.email,
    new.raw_user_meta_data ->> 'phoneNumber',
    new.raw_user_meta_data ->> 'accountType',
    new.raw_user_meta_data ->> 'contractorType',
    new.raw_user_meta_data ->> 'serviceType',
    new.raw_user_meta_data ->> 'companyName',
    new.raw_user_meta_data ->> 'bio',
    COALESCE((new.raw_user_meta_data ->> 'yearsExperience')::INTEGER, 0)
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();