-- Add foreign key constraints for bids table
ALTER TABLE public.bids 
ADD CONSTRAINT bids_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.bids 
ADD CONSTRAINT bids_contractor_id_fkey 
FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;