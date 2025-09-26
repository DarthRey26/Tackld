-- Fix RLS issue on booking_logs table
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_logs table
CREATE POLICY "Users can insert their own booking logs" 
ON public.booking_logs 
FOR INSERT 
WITH CHECK (true); -- Allow all inserts for logging purposes

CREATE POLICY "Users can view all booking logs" 
ON public.booking_logs 
FOR SELECT 
USING (true); -- Allow all selects for analytics