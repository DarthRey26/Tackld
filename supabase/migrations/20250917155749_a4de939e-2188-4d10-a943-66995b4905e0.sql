-- Get a real customer ID and create test booking
DO $$
DECLARE
    customer_uuid UUID;
BEGIN
    -- Get the first customer ID
    SELECT id INTO customer_uuid FROM public.profiles WHERE account_type = 'customer' LIMIT 1;
    
    -- Create test booking only if we have a customer
    IF customer_uuid IS NOT NULL THEN
        INSERT INTO public.bookings (
            id,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            service_type,
            booking_type,
            status,
            address,
            scheduled_date,
            scheduled_time,
            urgency,
            description,
            service_questions,
            uploaded_images,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            customer_uuid,
            'Test Customer',
            'test@customer.com',
            '+65 9876 5432',
            'aircon',
            'saver',
            'finding_contractor',
            '{"line1": "123 Test Street", "line2": "#01-01", "postal_code": "123456", "city": "Singapore", "country": "Singapore"}',
            '2025-09-20',
            '14:00:00',
            'normal',
            'Aircon servicing needed for 2 units. System 1 in living room not cooling properly.',
            '{"units": "2", "type": "servicing", "issue": "not_cooling", "last_service": "6_months_ago"}',
            ARRAY['https://example.com/aircon1.jpg', 'https://example.com/aircon2.jpg'],
            NOW(),
            NOW()
        );
    END IF;
END $$;