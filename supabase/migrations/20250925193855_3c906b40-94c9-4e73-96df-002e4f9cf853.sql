-- Update existing profile to admin if it exists
UPDATE public.profiles 
SET 
  account_type = 'admin',
  full_name = COALESCE(full_name, 'Reshav Admin'),
  email = COALESCE(email, 'reshav@tackld.com'),
  phone_number = COALESCE(phone_number, '+65 9999 9999'),
  is_verified = true,
  updated_at = now()
WHERE id = '7ec99b25-974f-45df-947c-3d99005f2d49';

-- Insert admin profile if it doesn't exist (alternative approach)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone_number,
  account_type,
  is_verified,
  created_at,
  updated_at
) 
SELECT 
  '7ec99b25-974f-45df-947c-3d99005f2d49'::uuid,
  'reshav@tackld.com',
  'Reshav Admin',
  '+65 9999 9999',
  'admin',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = '7ec99b25-974f-45df-947c-3d99005f2d49'
);