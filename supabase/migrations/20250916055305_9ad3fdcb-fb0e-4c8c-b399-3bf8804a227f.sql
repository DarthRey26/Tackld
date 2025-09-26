-- Drop existing profiles table to recreate with complete structure
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create comprehensive profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'contractor', 'admin')) DEFAULT 'customer',
  
  -- Contractor specific fields
  contractor_type TEXT CHECK (contractor_type IN ('saver', 'tacklers_choice')),
  service_type TEXT CHECK (service_type IN ('aircon', 'plumbing', 'electrical', 'cleaning', 'painting')),
  company_name TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0 CHECK (years_experience >= 0),
  hourly_rate DECIMAL(10,2) CHECK (hourly_rate >= 0),
  service_area TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  
  -- Customer address info (for auto-filling)
  customer_address JSONB,
  
  -- Contractor stats
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  total_bids_submitted INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  total_jobs_forfeited INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  profile_photo_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL DEFAULT 'Singapore',
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Singapore',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  
  -- Singapore specific fields
  building_name TEXT,
  unit_number TEXT,
  floor_number TEXT,
  access_instructions TEXT,
  contact_person JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('aircon', 'plumbing', 'electrical', 'cleaning', 'painting')),
  default_price_min DECIMAL(10,2),
  default_price_max DECIMAL(10,2),
  estimated_duration_min INTEGER, -- in minutes
  estimated_duration_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  questions JSONB DEFAULT '[]'::jsonb,
  requirements TEXT[],
  tags TEXT[],
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer info
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Service info
  service_id UUID REFERENCES public.services(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('aircon', 'plumbing', 'electrical', 'cleaning', 'painting')),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('saver', 'tacklers_choice', 'open_tender')) DEFAULT 'saver',
  
  -- Address info
  address JSONB NOT NULL,
  
  -- Contractor assignment
  contractor_id UUID REFERENCES auth.users(id),
  
  -- Status and scheduling
  status TEXT NOT NULL CHECK (status IN ('pending_bids', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending_bids',
  scheduled_date DATE,
  scheduled_time TIME,
  urgency TEXT CHECK (urgency IN ('normal', 'urgent')) DEFAULT 'normal',
  asap BOOLEAN DEFAULT false,
  
  -- Pricing
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  
  -- Job details
  description TEXT,
  notes TEXT,
  service_questions JSONB DEFAULT '{}'::jsonb,
  uploaded_images TEXT[],
  
  -- Progress tracking
  progress JSONB DEFAULT '{"current_stage": "finding_contractor", "stage_completion": 0, "last_updated": null}'::jsonb,
  
  -- Job photos
  photos JSONB DEFAULT '{"before": [], "during": [], "after": []}'::jsonb,
  
  -- Additional parts/materials
  additional_parts JSONB DEFAULT '[]'::jsonb,
  
  -- Reschedule requests
  reschedule_request JSONB,
  
  -- Timing
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('wallet', 'stripe', 'cash')),
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'contractor', 'system')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bid details
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  eta_minutes INTEGER NOT NULL CHECK (eta_minutes >= 15),
  note TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
  
  -- Scheduling
  proposed_start_time TIMESTAMP WITH TIME ZONE,
  proposed_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Materials included
  included_materials JSONB DEFAULT '[]'::jsonb,
  
  -- Terms
  terms JSONB DEFAULT '{"warranty_days": 30, "payment_terms": "upon_completion"}'::jsonb,
  
  -- Customer response
  customer_response JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate bids
  UNIQUE(booking_id, contractor_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Review details
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Service quality metrics
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  -- Response from contractor
  contractor_response TEXT,
  contractor_response_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate reviews
  UNIQUE(booking_id, customer_id)
);

-- Create wallets table  
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for realtime updates
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Contractors can view other contractor profiles for bidding" ON public.profiles FOR SELECT USING (
  account_type = 'contractor' OR auth.uid() = id
);

-- RLS Policies for addresses
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for services (public read)
CREATE POLICY "Services are publicly viewable" ON public.services FOR SELECT USING (is_active = true);

-- RLS Policies for bookings
CREATE POLICY "Customers can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Contractors can view bookings assigned to them" ON public.bookings FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Contractors can view available bookings in their service area" ON public.bookings FOR SELECT USING (
  status = 'pending_bids' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND account_type = 'contractor' 
    AND service_type = bookings.service_type
  )
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers and assigned contractors can update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = customer_id OR auth.uid() = contractor_id
);

-- RLS Policies for bids
CREATE POLICY "Contractors can view their own bids" ON public.bids FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Customers can view bids for their bookings" ON public.bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = bids.booking_id AND customer_id = auth.uid())
);
CREATE POLICY "Contractors can create bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "Contractors can update their own bids" ON public.bids FOR UPDATE USING (auth.uid() = contractor_id);

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews" ON public.reviews FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = contractor_id
);
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX idx_profiles_service_type ON public.profiles(service_type, contractor_type);
CREATE INDEX idx_profiles_available ON public.profiles(is_available);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_addresses_default ON public.addresses(user_id, is_default);

CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_contractor ON public.bookings(contractor_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_service_type ON public.bookings(service_type, booking_type, status);
CREATE INDEX idx_bookings_scheduled ON public.bookings(scheduled_date, scheduled_time);

CREATE INDEX idx_bids_booking ON public.bids(booking_id);
CREATE INDEX idx_bids_contractor ON public.bids(contractor_id);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_bids_expires ON public.bids(expires_at);

CREATE INDEX idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX idx_reviews_contractor ON public.reviews(contractor_id);
CREATE INDEX idx_reviews_date ON public.reviews(review_date);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);

-- Insert default services
INSERT INTO public.services (name, category, description, default_price_min, default_price_max, estimated_duration_min, estimated_duration_max, questions) VALUES
('Aircon Servicing', 'aircon', 'Professional aircon cleaning and maintenance', 80, 150, 60, 120, 
 '[{"id": "aircon_type", "question": "What type of aircon unit?", "type": "select", "options": ["Window Unit", "Split Unit", "Central Air"], "required": true},
   {"id": "last_service", "question": "When was it last serviced?", "type": "select", "options": ["Less than 6 months", "6-12 months", "More than 1 year", "Never"], "required": true},
   {"id": "issue_description", "question": "Describe the issue", "type": "textarea", "required": true}]'::jsonb),

('Plumbing Repair', 'plumbing', 'Fix leaks, unclog drains, and plumbing maintenance', 100, 300, 30, 180,
 '[{"id": "issue_type", "question": "What type of plumbing issue?", "type": "select", "options": ["Leak", "Clog", "Installation", "Repair"], "required": true},
   {"id": "urgency_level", "question": "How urgent is this?", "type": "select", "options": ["Emergency", "Within 24 hours", "Within a week"], "required": true},
   {"id": "location", "question": "Where is the issue located?", "type": "text", "required": true}]'::jsonb),

('Electrical Work', 'electrical', 'Electrical repairs, installations, and safety checks', 120, 400, 45, 240,
 '[{"id": "work_type", "question": "Type of electrical work needed?", "type": "select", "options": ["Repair", "Installation", "Maintenance", "Emergency"], "required": true},
   {"id": "safety_concern", "question": "Is this a safety concern?", "type": "select", "options": ["Yes - Urgent", "Possibly", "No"], "required": true}]'::jsonb),

('House Cleaning', 'cleaning', 'Professional house cleaning services', 60, 200, 120, 480,
 '[{"id": "property_size", "question": "Property size?", "type": "select", "options": ["1-2 rooms", "3-4 rooms", "5+ rooms"], "required": true},
   {"id": "cleaning_type", "question": "Type of cleaning?", "type": "select", "options": ["Regular cleaning", "Deep cleaning", "Move-in/out"], "required": true}]'::jsonb),

('Painting Service', 'painting', 'Interior and exterior painting services', 150, 800, 240, 960,
 '[{"id": "area_size", "question": "Area to be painted?", "type": "select", "options": ["Single room", "Multiple rooms", "Entire unit", "Exterior"], "required": true},
   {"id": "paint_type", "question": "Paint preference?", "type": "select", "options": ["Standard", "Premium", "Eco-friendly"], "required": true}]'::jsonb);

-- Create function to automatically create user profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update contractor stats after job completion
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update contractor stats
CREATE TRIGGER update_contractor_stats_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_contractor_stats();

-- Function to update contractor rating after review
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update contractor rating
CREATE TRIGGER update_contractor_rating_trigger
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_contractor_rating();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;