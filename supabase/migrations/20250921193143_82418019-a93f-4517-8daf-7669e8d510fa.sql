-- Update the stage update function to handle work_completed -> awaiting_payment transition
CREATE OR REPLACE FUNCTION public.update_booking_stage_with_photos(
    booking_id_param uuid, 
    contractor_id_param uuid, 
    new_stage text, 
    photo_urls text[] DEFAULT ARRAY[]::text[], 
    stage_type text DEFAULT 'during'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    booking_record RECORD;
    updated_photos jsonb;
    final_stage text;
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
    
    -- Auto-transition work_completed to awaiting_payment
    final_stage := CASE 
        WHEN new_stage = 'work_completed' THEN 'awaiting_payment'
        ELSE new_stage
    END;
    
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
        current_stage = final_stage,
        stage_photos = updated_photos,
        status = CASE 
            WHEN final_stage = 'awaiting_payment' THEN 'completed'
            ELSE status
        END,
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
        CASE 
            WHEN final_stage = 'awaiting_payment' THEN 'work_completed_payment_ready'
            ELSE 'job_progress_update'
        END,
        CASE 
            WHEN final_stage = 'awaiting_payment' THEN 'Work Completed - Payment Ready'
            ELSE 'Job Progress Update'
        END,
        CASE 
            WHEN final_stage = 'awaiting_payment' THEN 'Your service has been completed successfully. Please review and make payment.'
            ELSE 'Your service provider has updated the job progress.'
        END,
        json_build_object(
            'booking_id', booking_id_param,
            'stage', final_stage,
            'photos_count', array_length(photo_urls, 1)
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'stage', final_stage,
        'photos_uploaded', array_length(photo_urls, 1)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;