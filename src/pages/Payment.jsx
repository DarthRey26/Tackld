import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, CreditCard, DollarSign } from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const bookingId = searchParams.get('bookingId');
  
  const [booking, setBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBooking(data.booking);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = localStorage.getItem('token');
      
      // Update booking status to paid
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsPaid(true);
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });

        // Show review modal after 2 seconds
        setTimeout(() => {
          navigate(`/customer-dashboard?showReview=${bookingId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Thank you for using Tackld</p>
            <p className="text-sm text-gray-500">Redirecting to review...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = (booking.price_min + booking.price_max) / 2 + 
    (booking.additional_parts?.reduce((sum, part) => sum + part.cost, 0) || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Service Details</h3>
              <p className="text-gray-600">{booking.service_id?.name}</p>
              <p className="text-sm text-gray-500">{booking.notes}</p>
            </div>

            {/* Contractor Info */}
            {booking.contractor_id && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Contractor</h3>
                <p className="text-gray-600">{booking.contractor_id.email}</p>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3">Cost Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span>${((booking.price_min + booking.price_max) / 2).toFixed(2)}</span>
                </div>
                
                {booking.additional_parts?.map((part, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{part.description}</span>
                    <span>${part.cost.toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="text-center">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pay ${totalAmount.toFixed(2)}
                  </div>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2">
                This is a simulated payment for demo purposes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;