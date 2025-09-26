-- Update RLS policy to match correct booking status for contractor visibility
DROP POLICY IF EXISTS "Contractors can view available bookings in their service area" ON bookings;

CREATE POLICY "Contractors can view available bookings in their service area" 
ON bookings 
FOR SELECT 
USING (
  (status IN ('finding_contractor', 'pending_bids')) AND 
  (contractor_id IS NULL) AND
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'contractor'
    AND profiles.service_type = bookings.service_type
  ))
);