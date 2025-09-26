-- Add foreign key constraints for reviews table to enable proper joins

-- Add foreign key constraint from reviews.customer_id to profiles.id
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from reviews.contractor_id to profiles.id  
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_contractor_id_fkey 
FOREIGN KEY (contractor_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from reviews.booking_id to bookings.id
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.bookings(id) 
ON DELETE CASCADE;