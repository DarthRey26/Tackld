import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookingService, reviewService } from '@/lib/services';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Star,
  ArrowRight
} from 'lucide-react';

const PaymentSimulator = ({ booking, isOpen, onClose, onPaymentComplete }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update booking status to paid using atomic function
      const { data, error } = await bookingService.processPayment(
        booking.id, 
        paymentMethod
      );
      
      if (error) {
        throw new Error(error.message || 'Payment processing failed');
      }

      toast({
        title: "Payment Successful!",
        description: "Your payment has been processed successfully.",
      });

      // Show review prompt after successful payment
      setShowReviewPrompt(true);
      
      // Notify parent component
      onPaymentComplete?.(booking);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewLater = () => {
    setShowReviewPrompt(false);
    onClose?.();
  };

  const handleLeaveReview = () => {
    setShowReviewPrompt(false);
    onClose?.();
    // Navigate to review form or show review modal
    // This would be handled by the parent component
    window.dispatchEvent(new CustomEvent('showReviewModal', { 
      detail: { booking } 
    }));
  };

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Tackld Wallet',
      description: 'Pay using your wallet balance',
      icon: Wallet,
      available: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with your card',
      icon: CreditCard,
      available: true
    }
  ];

  const totalAmount = booking?.final_price || booking?.estimated_price || 0;
  const serviceFee = totalAmount * 0.05; // 5% service fee
  const finalAmount = totalAmount + serviceFee;

  if (showReviewPrompt) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              Your payment has been processed successfully
            </h3>
            
            <p className="text-gray-600 mb-6">
              Thank you for using Tackld! How was your experience with the contractor?
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleLeaveReview}
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Leave a Review
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReviewLater}
              >
                Review Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Service Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium capitalize">{booking?.service_type} Service</h4>
                  <p className="text-sm text-gray-600">{booking?.customer_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {booking?.scheduled_date} at {booking?.scheduled_time}
                    </span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Service Cost</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform Fee (5%)</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-green-600">${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <h4 className="font-medium mb-3">Select Payment Method</h4>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${paymentMethod === method.id 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      <div className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${paymentMethod === method.id 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                        }
                      `}>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Action */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pay ${finalAmount.toFixed(2)}
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSimulator;