-- Fix foreign key relationships for reviews table
-- Add proper foreign key constraints to reviews table to enable joins with profiles

-- First, let's add the missing foreign key constraints
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_contractor_id_fkey 
FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;