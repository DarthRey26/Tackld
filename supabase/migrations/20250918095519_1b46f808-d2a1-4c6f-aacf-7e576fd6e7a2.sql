-- Enable realtime for reviews table to support real-time notifications
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;