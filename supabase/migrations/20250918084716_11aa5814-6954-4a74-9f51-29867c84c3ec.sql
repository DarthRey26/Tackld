-- Add service_answers column to store customer responses to service-specific questions
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_answers jsonb DEFAULT '{}'::jsonb;

-- Add stage_photos column to store contractor progress photos per stage
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS stage_photos jsonb DEFAULT '{"before_photos": [], "during_photos": [], "after_photos": []}'::jsonb;

-- Update current_stage to use proper enum values for contractor workflow
-- Create enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_stage') THEN
        CREATE TYPE job_stage AS ENUM (
            'pending_bids',
            'finding_contractor', 
            'contractor_assigned',
            'arriving',
            'work_started',
            'in_progress', 
            'work_completed',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- Add RLS policy to hide sensitive customer data pre-bid
-- Contractors can only see customer details after bid acceptance
CREATE OR REPLACE VIEW public.contractor_available_jobs AS
SELECT 
    id,
    service_type,
    booking_type,
    address,
    scheduled_date,
    scheduled_time,
    asap,
    urgency,
    price_range_min,
    price_range_max,
    description,
    service_answers,
    uploaded_images,
    created_at,
    -- Hide sensitive customer info pre-bid
    CASE WHEN contractor_id IS NOT NULL THEN customer_name ELSE NULL END as customer_name,
    CASE WHEN contractor_id IS NOT NULL THEN customer_phone ELSE NULL END as customer_phone,
    CASE WHEN contractor_id IS NOT NULL THEN customer_email ELSE NULL END as customer_email,
    contractor_id,
    status,
    current_stage
FROM public.bookings
WHERE status IN ('pending_bids', 'finding_contractor', 'assigned', 'arriving', 'work_started', 'in_progress', 'work_completed');

-- Grant access to the view
GRANT SELECT ON public.contractor_available_jobs TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.contractor_available_jobs SET (security_invoker = true);

-- Create function to update booking stage with photo upload
CREATE OR REPLACE FUNCTION public.update_booking_stage_with_photos(
    booking_id_param uuid,
    contractor_id_param uuid,
    new_stage text,
    photo_urls text[] DEFAULT ARRAY[]::text[],
    stage_type text DEFAULT 'during'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    booking_record RECORD;
    updated_photos jsonb;
    result json;
BEGIN
    -- Verify contractor owns this booking
    SELECT * INTO booking_record
    FROM public.bookings
    WHERE id = booking_id_param 
        AND contractor_id = contractor_id_param
        AND status NOT IN ('cancelled', 'completed');
        
    IF booking_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found or access denied');
    END IF;
    
    -- Update stage_photos with new photos
    updated_photos := COALESCE(booking_record.stage_photos, '{"before_photos": [], "during_photos": [], "after_photos": []}'::jsonb);
    
    CASE stage_type
        WHEN 'before' THEN
            updated_photos := jsonb_set(updated_photos, '{before_photos}', 
                (COALESCE(updated_photos->'before_photos', '[]'::jsonb) || to_jsonb(photo_urls)));
        WHEN 'during' THEN  
            updated_photos := jsonb_set(updated_photos, '{during_photos}', 
                (COALESCE(updated_photos->'during_photos', '[]'::jsonb) || to_jsonb(photo_urls)));
        WHEN 'after' THEN
            updated_photos := jsonb_set(updated_photos, '{after_photos}', 
                (COALESCE(updated_photos->'after_photos', '[]'::jsonb) || to_jsonb(photo_urls)));
    END CASE;
    
    -- Update booking stage and photos
    UPDATE public.bookings
    SET 
        current_stage = new_stage,
        stage_photos = updated_photos,
        progress = jsonb_set(
            COALESCE(progress, '{}'::jsonb),
            '{last_updated}',
            to_jsonb(NOW()::text)
        ),
        updated_at = NOW()
    WHERE id = booking_id_param;
    
    -- Create notification for customer
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        booking_record.customer_id,
        'job_progress_update',
        'Job Progress Update',
        'Your service provider has updated the job progress.',
        json_build_object(
            'booking_id', booking_id_param,
            'stage', new_stage,
            'photos_count', array_length(photo_urls, 1)
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'stage', new_stage,
        'photos_uploaded', array_length(photo_urls, 1)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;