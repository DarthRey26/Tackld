-- Update get_enhanced_contractor_dashboard function to include service_answers field
CREATE OR REPLACE FUNCTION public.get_enhanced_contractor_dashboard(contractor_id_param uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  contractor_bids JSON;
  available_jobs JSON;
  contractor_profile RECORD;
  result JSON;
BEGIN
  -- Get contractor profile
  SELECT service_type, account_type, contractor_type INTO contractor_profile
  FROM public.profiles 
  WHERE id = contractor_id_param AND account_type = 'contractor';

  IF contractor_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contractor profile not found');
  END IF;

  -- Clean up expired bids first using correct status
  PERFORM public.cleanup_expired_bids();

  -- Get contractor's bids with booking details - exclude rejected/expired
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'amount', b.amount,
      'status', b.status,
      'eta_minutes', b.eta_minutes,
      'note', b.note,
      'created_at', b.created_at,
      'expires_at', b.expires_at,
      'booking', json_build_object(
        'id', bk.id,
        'service_type', bk.service_type,
        'customer_name', bk.customer_name,
        'status', bk.status,
        'current_stage', bk.current_stage,
        'scheduled_date', bk.scheduled_date,
        'scheduled_time', bk.scheduled_time,
        'address', bk.address,
        'description', bk.description,
        'urgency', bk.urgency,
        'booking_type', bk.booking_type,
        'created_at', bk.created_at,
        'service_answers', bk.service_answers
      )
    ) ORDER BY b.created_at DESC
  ) INTO contractor_bids
  FROM public.bids b
  JOIN public.bookings bk ON b.booking_id = bk.id
  WHERE b.contractor_id = contractor_id_param
    AND b.status IN ('pending', 'accepted'); -- Only show pending and accepted bids

  -- Get available jobs with bid status indicators - INCLUDE service_answers field
  SELECT json_agg(
    json_build_object(
      'id', bk.id,
      'service_type', bk.service_type,
      'customer_name', bk.customer_name,
      'status', bk.status,
      'current_stage', bk.current_stage,
      'scheduled_date', bk.scheduled_date,
      'scheduled_time', bk.scheduled_time,
      'address', bk.address,
      'description', bk.description,
      'urgency', bk.urgency,
      'booking_type', bk.booking_type,
      'price_range_min', bk.price_range_min,
      'price_range_max', bk.price_range_max,
      'created_at', bk.created_at,
      'service_answers', bk.service_answers,
      'uploaded_images', bk.uploaded_images,
      'has_bid', CASE WHEN bid_check.id IS NOT NULL THEN true ELSE false END,
      'bid_status', COALESCE(bid_check.status, 'none'),
      'bid_amount', bid_check.amount,
      'bid_expires_at', bid_check.expires_at,
      'total_bids', (
        SELECT COUNT(*) 
        FROM public.bids b2 
        WHERE b2.booking_id = bk.id 
          AND b2.status = 'pending' 
          AND b2.expires_at > NOW()
      )
    ) ORDER BY bk.created_at DESC
  ) INTO available_jobs
  FROM public.bookings bk
  LEFT JOIN public.bids bid_check ON bk.id = bid_check.booking_id 
    AND bid_check.contractor_id = contractor_id_param
    AND bid_check.status IN ('pending', 'accepted') -- Only check for active bids
  WHERE bk.service_type = contractor_profile.service_type 
    AND bk.status IN ('pending_bids', 'finding_contractor')
    AND bk.contractor_id IS NULL;

  result := json_build_object(
    'success', true,
    'contractor_bids', COALESCE(contractor_bids, '[]'::json),
    'available_jobs', COALESCE(available_jobs, '[]'::json),
    'contractor_profile', json_build_object(
      'service_type', contractor_profile.service_type,
      'contractor_type', contractor_profile.contractor_type
    )
  );

  RETURN result;
END;
$function$