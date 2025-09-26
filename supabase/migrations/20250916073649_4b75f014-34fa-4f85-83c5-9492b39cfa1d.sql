-- Fix database schema to match spec.md exactly

-- 1. Create missing extra_parts table
CREATE TABLE public.extra_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  reason TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create missing reschedule_requests table
CREATE TABLE public.reschedule_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  new_date DATE NOT NULL,
  new_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add missing fields to profiles table for contractor tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jobs_forfeited INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earnings_total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2) DEFAULT 0;

-- 4. Enable Row Level Security on new tables
ALTER TABLE public.extra_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for extra_parts
CREATE POLICY "Contractors can create extra parts" ON public.extra_parts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND contractor_id = auth.uid()
  )
);

CREATE POLICY "Customers and contractors can view extra parts" ON public.extra_parts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (customer_id = auth.uid() OR contractor_id = auth.uid())
  )
);

CREATE POLICY "Customers can update extra parts status" ON public.extra_parts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND customer_id = auth.uid()
  )
);

-- 6. Create RLS policies for reschedule_requests
CREATE POLICY "Contractors can create reschedule requests" ON public.reschedule_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND contractor_id = auth.uid()
  )
);

CREATE POLICY "Customers and contractors can view reschedule requests" ON public.reschedule_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND (customer_id = auth.uid() OR contractor_id = auth.uid())
  )
);

CREATE POLICY "Customers can update reschedule requests status" ON public.reschedule_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id AND customer_id = auth.uid()
  )
);

-- 7. Update booking status constraints to match spec
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('finding_contractor', 'contractor_found', 'arriving', 'job_started', 'completed', 'paid', 'cancelled'));

-- 8. Add trigger to update contractor stats when booking is completed
CREATE OR REPLACE FUNCTION public.update_contractor_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'completed' THEN
    UPDATE public.profiles 
    SET 
      earnings_total = earnings_total + COALESCE(NEW.final_price, 0),
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.profiles 
    SET 
      jobs_forfeited = jobs_forfeited + 1,
      updated_at = NOW()
    WHERE id = NEW.contractor_id AND account_type = 'contractor';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_contractor_earnings_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_contractor_earnings();

-- 9. Add realtime publications for new tables
ALTER TABLE public.extra_parts REPLICA IDENTITY FULL;
ALTER TABLE public.reschedule_requests REPLICA IDENTITY FULL;

-- 10. Add the tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_parts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reschedule_requests;