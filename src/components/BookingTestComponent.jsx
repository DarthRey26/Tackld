import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { bookingService } from '@/lib/services';

const BookingTestComponent = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState([]);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingBooking, setIsTestingBooking] = useState(false);
  
  const addTestResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toISOString() }]);
  };

  const testAuthentication = async () => {
    setIsTestingAuth(true);
    
    try {
      // Test 1: Check current auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addTestResult('Session Check', 'FAIL', `Session error: ${sessionError.message}`);
      } else if (!session) {
        addTestResult('Session Check', 'FAIL', 'No active session found');
      } else {
        addTestResult('Session Check', 'PASS', `User authenticated: ${session.user.email}`);
      }
      
      // Test 2: Check user profile
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          addTestResult('Profile Check', 'FAIL', `Profile error: ${profileError.message}`);
        } else {
          addTestResult('Profile Check', 'PASS', `Profile found: ${profile.account_type} - ${profile.full_name}`);
        }
      }
      
      // Test 3: Check RLS policies
      const { data: bookings, error: rlsError } = await supabase
        .from('bookings')
        .select('count')
        .limit(1);
        
      if (rlsError) {
        addTestResult('RLS Check', 'FAIL', `RLS error: ${rlsError.message}`);
      } else {
        addTestResult('RLS Check', 'PASS', 'RLS policies working');
      }
      
    } catch (error) {
      addTestResult('Auth Test', 'FAIL', `Unexpected error: ${error.message}`);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testBookingCreation = async () => {
    setIsTestingBooking(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        addTestResult('Booking Test', 'FAIL', 'No authenticated user');
        return;
      }
      
      // Create test booking data
      const testBookingData = {
        customer_id: user.id,
        customer_name: 'Test Customer',
        customer_email: user.email,
        customer_phone: '+65 9123 4567',
        service_type: 'aircon',
        booking_type: 'saver',
        address: {
          fullAddress: '123 Test Street, #01-01',
          postalCode: '123456',
          type: 'HDB'
        },
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '10:00',
        urgency: 'normal',
        asap: false,
        description: 'Test booking from test component',
        uploaded_images: [],
        status: 'finding_contractor'
      };
      
      // Test booking creation
      const { data: booking, error: bookingError } = await bookingService.createBooking(testBookingData);
      
      if (bookingError) {
        addTestResult('Create Booking', 'FAIL', `Booking creation failed: ${bookingError.message}`);
      } else {
        addTestResult('Create Booking', 'PASS', `Booking created with ID: ${booking.id}`);
        
        // Clean up test booking
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', booking.id);
          
        if (deleteError) {
          addTestResult('Cleanup', 'WARN', `Failed to cleanup test booking: ${deleteError.message}`);
        } else {
          addTestResult('Cleanup', 'PASS', 'Test booking cleaned up');
        }
      }
      
    } catch (error) {
      addTestResult('Booking Test', 'FAIL', `Unexpected error: ${error.message}`);
    } finally {
      setIsTestingBooking(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking System Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testAuthentication} 
              disabled={isTestingAuth}
              variant="outline"
            >
              {isTestingAuth ? 'Testing Auth...' : 'Test Authentication'}
            </Button>
            
            <Button 
              onClick={testBookingCreation} 
              disabled={isTestingBooking}
              variant="outline"
            >
              {isTestingBooking ? 'Testing Booking...' : 'Test Booking Creation'}
            </Button>
            
            <Button onClick={clearResults} variant="ghost">
              Clear Results
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-4">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm ${
                    result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                    result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <span className="font-semibold">[{result.status}] {result.test}:</span> {result.message}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingTestComponent;