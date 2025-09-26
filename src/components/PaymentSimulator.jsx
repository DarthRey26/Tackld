import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { extraPartsService } from '@/lib/services';
import { 
  CreditCard, 
  Wallet, 
  DollarSign,
  CheckCircle,
  Clock
} from 'lucide-react';

const PaymentSimulator = ({ booking, onPaymentComplete, onCancel }) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extraParts, setExtraParts] = useState([]);

  // Fetch extra parts from separate table
  useEffect(() => {
    const fetchExtraParts = async () => {
      if (!booking?.id) return;
      
      try {
        const { data, error } = await extraPartsService.getExtraPartsForBooking(booking.id);
        if (!error && data) {
          setExtraParts(data);
        }
      } catch (error) {
        console.error('Error fetching extra parts for payment:', error);
      }
    };

    fetchExtraParts();
  }, [booking?.id]);

  const calculateTotal = () => {
    const servicePrice = parseFloat(booking.estimated_price || booking.final_price || 0);
    
    // Calculate approved extra parts cost from separate table
    const approvedExtraParts = extraParts.filter(part => part.status === 'approved');
    const extraPartsTotal = approvedExtraParts
      .reduce((sum, part) => sum + parseFloat(part.total_price || 0), 0);

    return servicePrice + extraPartsTotal;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    toast({
      title: "Processing Payment",
      description: "Please wait while we process your payment...",
    });

    try {
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Use atomic payment RPC
      const { data: result, error } = await supabase.rpc('complete_payment_atomic', {
        booking_id_param: booking.id,
        payment_method_param: paymentMethod
      });

      if (error) {
        console.error('Payment RPC error:', error);
        throw error;
      }

      if (result?.success) {
        setIsCompleted(true);
        
        toast({
          title: "Payment Successful!",
          description: `Payment of $${calculateTotal()} has been processed successfully.`,
        });
        
        onPaymentComplete?.({
          ...booking,
          status: 'paid',
          payment_status: 'paid',
          payment_method: paymentMethod
        });
      } else {
        throw new Error(result?.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your payment of ${calculateTotal()} has been processed.
          </p>
          <p className="text-sm text-gray-500">
            You will receive a receipt via email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Details */}
        <div className="space-y-2">
          <h4 className="font-medium">Service Details</h4>
          <div className="text-sm text-gray-600">
            <p className="capitalize">{booking.serviceType} Service</p>
            <p>{booking.address?.street}, Singapore {booking.address?.postalCode}</p>
            <Badge variant="outline" className="mt-1">
              {booking.bookingType === 'tacklers_choice' ? "Tackler's Choice" : 'Saver Option'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium">Cost Breakdown</h4>
            <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Service Cost:</span>
              <span>${(parseFloat(booking.estimated_price || booking.final_price || 0)).toFixed(2)}</span>
            </div>
            
            {extraParts.filter(part => part.status === 'approved').length > 0 && (
              <>
                <div className="text-sm font-medium">Additional Parts:</div>
                {extraParts.filter(part => part.status === 'approved').map((part, index) => (
                  <div key={part.id || index} className="flex justify-between text-gray-600">
                    <span>{part.part_name} (x{part.quantity})</span>
                    <span>${(parseFloat(part.total_price || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </>
            )}
            
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Method */}
        <div className="space-y-3">
          <h4 className="font-medium">Payment Method</h4>
          <div className="space-y-2">
            <Button
              variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setPaymentMethod('stripe')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Credit/Debit Card
            </Button>
            <Button
              variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setPaymentMethod('wallet')}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Tackld Wallet
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${calculateTotal()}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSimulator;