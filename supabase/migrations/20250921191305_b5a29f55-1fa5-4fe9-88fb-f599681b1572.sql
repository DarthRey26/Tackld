-- Clean up booking stage inconsistencies and simplify progress tracking
-- This migration ensures current_stage and status are properly synchronized

-- Update existing bookings to have consistent status based on current_stage
UPDATE public.bookings 
SET status = CASE 
  WHEN current_stage = 'pending_bids' THEN 'pending_bids'
  WHEN current_stage = 'finding_contractor' THEN 'finding_contractor'
  WHEN current_stage = 'assigned' THEN 'assigned'
  WHEN current_stage = 'arriving' THEN 'assigned'
  WHEN current_stage = 'work_started' THEN 'work_started'
  WHEN current_stage = 'in_progress' THEN 'in_progress'
  WHEN current_stage = 'work_completed' THEN 'completed'
  WHEN current_stage = 'awaiting_payment' THEN 'completed'
  WHEN current_stage = 'paid' THEN 'paid'
  ELSE status
END
WHERE current_stage IS NOT NULL 
  AND status != CASE 
    WHEN current_stage = 'pending_bids' THEN 'pending_bids'
    WHEN current_stage = 'finding_contractor' THEN 'finding_contractor'
    WHEN current_stage = 'assigned' THEN 'assigned'
    WHEN current_stage = 'arriving' THEN 'assigned'
    WHEN current_stage = 'work_started' THEN 'work_started'
    WHEN current_stage = 'in_progress' THEN 'in_progress'
    WHEN current_stage = 'work_completed' THEN 'completed'
    WHEN current_stage = 'awaiting_payment' THEN 'completed'
    WHEN current_stage = 'paid' THEN 'paid'
    ELSE status
  END;

-- Clean up progress field to remove redundant current_stage
UPDATE public.bookings 
SET progress = COALESCE(progress - 'current_stage', '{}')
WHERE progress ? 'current_stage';

-- Set default current_stage for bookings that don't have one
UPDATE public.bookings 
SET current_stage = CASE 
  WHEN status = 'pending_bids' THEN 'pending_bids'
  WHEN status = 'finding_contractor' THEN 'finding_contractor'
  WHEN status = 'assigned' THEN 'arriving'
  WHEN status = 'work_started' THEN 'work_started'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status = 'completed' AND payment_status = 'paid' THEN 'paid'
  WHEN status = 'completed' THEN 'awaiting_payment'
  WHEN status = 'paid' THEN 'paid'
  ELSE 'pending_bids'
END
WHERE current_stage IS NULL;