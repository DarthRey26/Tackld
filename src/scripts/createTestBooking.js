import { supabase } from '@/integrations/supabase/client';

// Create a test booking for contractors to see
export const createTestBooking = async () => {
  try {
    console.log('🔧 Creating test booking for contractors...');
    
    // Get a customer ID
    const { data: customers } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('account_type', 'customer')
      .limit(1);
    
    if (!customers || customers.length === 0) {
      console.error('❌ No customers found. Please create a customer account first.');
      return;
    }
    
    const customer = customers[0];
    console.log(`👤 Using customer: ${customer.email}`);
    
    // Create test booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: customer.id,
        customer_name: 'Test Customer',
        customer_email: customer.email,
        customer_phone: '+65 9876 5432',
        service_type: 'aircon',
        booking_type: 'saver',
        status: 'finding_contractor',
        address: {
          line1: '123 Test Street',
          line2: '#01-01',
          postal_code: '123456',
          city: 'Singapore',
          country: 'Singapore'
        },
        scheduled_date: '2025-09-20',
        scheduled_time: '14:00:00',
        urgency: 'normal',
        description: 'Aircon servicing needed for 2 units. System 1 in living room not cooling properly. Please check refrigerant levels and clean filters.',
        service_questions: {
          units: '2',
          type: 'servicing',
          issue: 'not_cooling',
          last_service: '6_months_ago'
        },
        uploaded_images: [
          'https://example.com/aircon1.jpg',
          'https://example.com/aircon2.jpg'
        ],
        price_range_min: 80,
        price_range_max: 150
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating test booking:', error);
      return;
    }
    
    console.log('✅ Test booking created successfully:', booking.id);
    console.log('📋 Booking Details:');
    console.log(`   Service: ${booking.service_type}`);
    console.log(`   Type: ${booking.booking_type}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Scheduled: ${booking.scheduled_date} at ${booking.scheduled_time}`);
    console.log(`   Customer: ${booking.customer_name}`);
    
    return booking;
  } catch (error) {
    console.error('❌ Failed to create test booking:', error);
  }
};

// Clean up old cancelled bookings
export const cleanupCancelledBookings = async () => {
  try {
    console.log('🧹 Cleaning up cancelled bookings...');
    
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('status', 'cancelled');
    
    if (error) {
      console.error('❌ Error cleaning up bookings:', error);
      return;
    }
    
    console.log('✅ Cancelled bookings cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup bookings:', error);
  }
};

// Run both functions
export const setupTestData = async () => {
  await cleanupCancelledBookings();
  await createTestBooking();
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.createTestBooking = createTestBooking;
  window.cleanupCancelledBookings = cleanupCancelledBookings;
  window.setupTestData = setupTestData;
}