-- Fix foreign key relationships and ensure proper schema structure

-- Add missing foreign key constraints
ALTER TABLE public.bids 
ADD CONSTRAINT fk_bids_contractor_id 
FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bids 
ADD CONSTRAINT fk_bids_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_contractor_id 
FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure RLS policies are properly set for data persistence
-- Update bookings RLS to allow customers to see their bookings even after refresh
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
CREATE POLICY "Customers can view their own bookings" ON public.bookings
FOR SELECT USING (
  auth.uid() = customer_id OR 
  auth.uid() = contractor_id OR
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure bids can be properly queried with contractor profiles
DROP POLICY IF EXISTS "Customers can view bids for their bookings" ON public.bids;
CREATE POLICY "Customers can view bids for their bookings" ON public.bids
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = bids.booking_id 
    AND (bookings.customer_id = auth.uid() OR bookings.contractor_id = auth.uid())
  ) OR
  auth.uid() = contractor_id
);

-- Add index for better performance on frequently queried relationships
CREATE INDEX IF NOT EXISTS idx_bids_contractor_id ON public.bids(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bids_booking_id ON public.bids(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_contractor_id ON public.bookings(contractor_id);