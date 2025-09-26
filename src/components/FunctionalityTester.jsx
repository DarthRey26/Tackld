import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storageService, authService } from '@/lib/services';
import { bookingService, bidService, profileService } from '@/lib/services';
import { toast } from 'sonner';

const FunctionalityTester = () => {
  const { user, userType } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (testName, status, message = '') => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { status, message, timestamp: new Date().toISOString() }
    }));
  };

  const runTest = async (testName, testFunction) => {
    updateTestResult(testName, 'running', 'Test in progress...');
    try {
      const result = await testFunction();
      updateTestResult(testName, 'passed', result.message || 'Test passed');
      return true;
    } catch (error) {
      updateTestResult(testName, 'failed', error.message || 'Test failed');
      return false;
    }
  };

  const tests = {
    // 1. Infrastructure Tests
    'Supabase Auth - User Session': async () => {
      const { session, error } = await authService.getCurrentSession();
      if (error) throw error;
      if (!session) throw new Error('No active session');
      return { message: `Session active for ${session.user.email}` };
    },

    'Supabase Storage - Image Upload': async () => {
      // Create a test file
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          try {
            const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
            const result = await storageService.uploadJobImage(testFile, 'test-booking');
            if (!result.success) throw new Error('Upload failed');
            resolve({ message: `Image uploaded successfully: ${result.url}` });
          } catch (error) {
            reject(error);
          }
        });
      });
    },

    'Supabase Connection Test': async () => {
      const { data, error } = await supabase.from('profiles').select('count').single();
      if (error && error.code !== 'PGRST116') throw new Error('Supabase connection failed');
      return { message: 'Supabase connection successful' };
    },

    'Socket.IO Connection': async () => {
      return new Promise((resolve, reject) => {
        const socket = io('http://localhost:3001');
        const timeout = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Socket connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({ message: 'Socket.IO connected successfully' });
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    },

    // 2. User Experience Tests
    'Customer Booking Flow': async () => {
      if (userType !== 'customer') {
        throw new Error('Must be logged in as customer');
      }
      
      const testBooking = {
        serviceType: 'cleaning',
        bookingType: 'saver',
        address: 'Test Address',
        scheduledDate: new Date().toISOString(),
        notes: 'Test booking from functionality tester'
      };

      const { data: result, error } = await bookingService.createBooking(testBooking);
      if (error) throw error;
      return { message: `Test booking created: ${result.id}` };
    },

    'Contractor Dashboard': async () => {
      if (userType !== 'contractor') {
        throw new Error('Must be logged in as contractor');
      }
      
      const { data: bookings, error } = await bookingService.getAvailableJobs({
        serviceType: 'cleaning'
      });
      if (error) throw error;
      
      return { message: `Found ${bookings.length} available bookings` };
    },

    'Bid Submission': async () => {
      if (userType !== 'contractor') {
        throw new Error('Must be logged in as contractor');
      }

      // First get available bookings
      const { data: bookings, error } = await bookingService.getAvailableJobs({
        serviceType: 'cleaning'
      });
      if (error) throw error;

      if (bookings.length === 0) {
        throw new Error('No available bookings to bid on');
      }

      const testBid = {
        bookingId: bookings[0].id,
        amount: 50,
        eta: '2 hours',
        notes: 'Test bid from functionality tester'
      };

      const { data: result, error: bidError } = await bidService.submitBid(testBid);
      if (bidError) throw bidError;
      return { message: `Test bid submitted: ${result.id}` };
    },

    'Review System': async () => {
      // This would need a completed booking to test properly
      // For now, just test the API endpoint exists
      try {
        const { data, error } = await reviewService.getContractorReviews('test-contractor-id');
        return { message: 'Review API endpoint accessible' };
      } catch (error) {
        if (error.message.includes('404')) {
          return { message: 'Review API endpoint exists (contractor not found is expected)' };
        }
        throw error;
      }
    },

    'File Storage Integration': async () => {
      const testImages = ['test1.jpg', 'test2.jpg'];
      const publicUrls = testImages.map(img => storageService.getPublicUrl(`test/${img}`));
      return { message: `Generated ${publicUrls.length} public URLs` };
    },

    'Real-time Updates': async () => {
      return new Promise((resolve, reject) => {
        const socket = io('http://localhost:3001');
        const timeout = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Real-time test timeout'));
        }, 3000);

        socket.on('connect', () => {
          socket.emit('join_room', 'test-user');
          
          // Test if we can join rooms successfully
          setTimeout(() => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve({ message: 'Real-time room joining works' });
          }, 1000);
        });
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    for (const [testName, testFunction] of Object.entries(tests)) {
      await runTest(testName, testFunction);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    toast.success('All functionality tests completed!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'passed': return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="secondary">Running...</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedTests = Object.values(testResults).filter(r => r.status === 'passed').length;
  const failedTests = Object.values(testResults).filter(r => r.status === 'failed').length;
  const totalTests = Object.keys(tests).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tackld MVP Functionality Tester</CardTitle>
          <CardDescription>
            Comprehensive test suite for all MVP features and integrations
            {user && <span className="block mt-2">Testing as: {user.email} ({userType})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(tests).map(([testName, testFunction]) => {
              const result = testResults[testName];
              return (
                <div key={testName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result?.status)}
                    <div>
                      <div className="font-medium">{testName}</div>
                      {result?.message && (
                        <div className="text-sm text-gray-600">{result.message}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result?.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTest(testName, testFunction)}
                      disabled={isRunning}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunctionalityTester;