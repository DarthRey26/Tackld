-- Fix the booking status constraint to include 'assigned' status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add updated constraint with all valid statuses including 'assigned'
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  'pending_bids', 
  'finding_contractor', 
  'assigned', 
  'contractor_found',
  'arriving', 
  'in_progress', 
  'job_started',
  'completed', 
  'cancelled', 
  'expired'
));