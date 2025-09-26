import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { bookingService, extraPartsService } from '@/lib/services';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  User, 
  MapPin,
  Calendar,
  Star,
  XCircle
} from 'lucide-react';

const BookingStatusDisplay = ({ booking, onPaymentClick, onReviewClick, onBookingUpdate }) => {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extraParts, setExtraParts] = useState([]);
  const [loadingExtraParts, setLoadingExtraParts] = useState(false);

  // Fetch extra parts from separate table
  useEffect(() => {
    const fetchExtraParts = async () => {
      if (!booking?.id) return;
      
      setLoadingExtraParts(true);
      try {
        const { data, error } = await extraPartsService.getExtraPartsForBooking(booking.id);
        if (!error && data) {
          setExtraParts(data);
        }
      } catch (error) {
        console.error('Error fetching extra parts for booking display:', error);
      } finally {
        setLoadingExtraParts(false);
      }
    };

    fetchExtraParts();
  }, [booking?.id]);

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Cancellation Reason Required",
        description: "Please provide a reason for cancelling this booking.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await bookingService.cancelBooking(booking.id, cancellationReason);
      
      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully. Any contractors will be notified.",
      });

      setShowCancelDialog(false);
      setCancellationReason('');
      
      // Notify parent component to refresh bookings
      if (onBookingUpdate) {
        onBookingUpdate();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if booking can be cancelled
  const canCancelBooking = ['pending_bids', 'finding_contractor'].includes(booking.status);
  // Map database status to user-friendly display - prioritize current_stage over status
  const getStatusDisplay = (booking) => {
    const statusMap = {
      'pending_bids': { 
        label: 'Finding Contractors', 
        color: 'bg-blue-500', 
        progress: 20,
        description: 'We\'re searching for available contractors in your area'
      },
      'finding_contractor': { 
        label: 'Finding Contractors', 
        color: 'bg-blue-500', 
        progress: 20,
        description: 'Contractors are reviewing your job requirements'
      },
      'assigned': { 
        label: 'Contractor Assigned', 
        color: 'bg-green-500', 
        progress: 40,
        description: 'A contractor has been assigned and will contact you'
      },
      'arriving': { 
        label: 'Contractor Arriving', 
        color: 'bg-orange-500', 
        progress: 60,
        description: 'Your contractor is on the way'
      },
      'work_started': { 
        label: 'Work in Progress', 
        color: 'bg-purple-500', 
        progress: 70,
        description: 'Work has started on your job'
      },
      'job_started': { 
        label: 'Work in Progress', 
        color: 'bg-purple-500', 
        progress: 70,
        description: 'Work has started on your job'
      },
      'in_progress': { 
        label: 'Work in Progress', 
        color: 'bg-purple-500', 
        progress: 80,
        description: 'Work is actively being performed'
      },
      'work_completed': { 
        label: 'Work Completed', 
        color: 'bg-indigo-500', 
        progress: 90,
        description: 'Work has been completed, awaiting payment'
      },
      'awaiting_payment': { 
        label: 'Awaiting Payment', 
        color: 'bg-yellow-500', 
        progress: 95,
        description: 'Please complete payment to finish the job'
      },
      'completed': { 
        label: booking.payment_status === 'paid' ? 'Job Completed' : 'Awaiting Payment', 
        color: booking.payment_status === 'paid' ? 'bg-green-600' : 'bg-yellow-500', 
        progress: booking.payment_status === 'paid' ? 100 : 95,
        description: booking.payment_status === 'paid' ? 'Job successfully completed!' : 'Please complete payment to finish the job'
      },
      'paid': { 
        label: 'Job Completed', 
        color: 'bg-green-600', 
        progress: 100,
        description: 'Job successfully completed and paid!'
      },
      'cancelled': { 
        label: 'Cancelled', 
        color: 'bg-red-500', 
        progress: 0,
        description: 'This job has been cancelled'
      }
    };

    // Prioritize current_stage over status for more accurate display
    const currentStatus = booking.current_stage || booking.status;
    return statusMap[currentStatus] || statusMap['pending_bids'];
  };

  const statusInfo = getStatusDisplay(booking);
  const isCompleted = booking.payment_status === 'paid' || booking.status === 'paid';
  // Check if payment is needed and not blocked by pending parts
  const needsPayment = (booking.status === 'completed' || booking.current_stage === 'awaiting_payment' || booking.current_stage === 'work_completed') && booking.payment_status !== 'paid';
  const hasPendingParts = extraParts.some(part => part.status === 'pending');
  const paymentBlocked = needsPayment && hasPendingParts;

  // Calculate final price including extra parts from separate table
  const calculateTotalPrice = () => {
    const basePrice = parseFloat(booking.final_price || booking.estimated_price) || 0;
    const extraPartsTotal = extraParts.reduce((total, part) => {
      return total + (parseFloat(part.total_price) || 0);
    }, 0);
    return (basePrice + extraPartsTotal).toFixed(2);
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address) return 'Address not provided';
    
    return `${address.street || address.line1 || ''}, ${address.city || 'Singapore'} ${address.postalCode || address.postal_code || ''}`.trim();
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'Schedule TBD';
    
    const dateStr = new Date(date).toLocaleDateString();
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize text-lg">
              {booking.service_type} Service
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                Booking #{booking.id?.slice(-8)}
              </Badge>
              {booking.urgency === 'urgent' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${calculateTotalPrice()}
            </div>
            <div className="text-sm text-muted-foreground">
              {needsPayment ? 'Payment Due' : 'Total Cost'}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{statusInfo.label}</h4>
            <span className="text-sm text-muted-foreground">{statusInfo.progress}%</span>
          </div>
          <Progress value={statusInfo.progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{formatAddress(booking.address)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDateTime(booking.scheduled_date, booking.scheduled_time)}</span>
          </div>
        </div>

        {/* Contractor Info (if assigned) */}
        {booking.contractor_id && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h5 className="font-medium">Contractor Assigned</h5>
                <p className="text-sm text-muted-foreground">
                  Your service provider will contact you soon
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Extra Parts (if any) */}
        {booking.extra_parts && booking.extra_parts.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Additional Parts Added</h5>
            <div className="space-y-1">
              {booking.extra_parts.map((part, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-blue-800">{part.part_name} (x{part.quantity})</span>
                  <span className="font-medium text-blue-900">${parseFloat(part.total_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {booking.extra_parts.some(part => part.status === 'pending') && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                ⚠️ Customers need to approve additional parts before payment can proceed
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {needsPayment && onPaymentClick && !paymentBlocked && (
            <Button onClick={() => onPaymentClick(booking)} className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          )}
          
          {paymentBlocked && (
            <div className="flex-1">
              <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
                <AlertCircle className="w-4 h-4 mr-2" />
                Payment Blocked - Approve Parts First
              </Button>
            </div>
          )}
          
          {isCompleted && onReviewClick && (
            <Button 
              onClick={() => onReviewClick(booking)} 
              variant="outline"
              className={needsPayment ? "px-4" : "flex-1"}
            >
              <Star className="w-4 h-4 mr-2" />
              Leave Review
            </Button>
          )}

          {canCancelBooking && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Booking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                    Any contractors who have submitted bids will be notified.
                  </p>
                  <div>
                    <label className="text-sm font-medium">Reason for cancellation:</label>
                    <Textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Please provide a brief reason for cancelling..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCancelDialog(false);
                        setCancellationReason('');
                      }}
                    >
                      Keep Booking
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelBooking}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {booking.status === 'pending_bids' && !canCancelBooking && (
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Waiting for contractor bids...</span>
              </div>
            </div>
          )}
        </div>

        {/* Status-specific alerts */}
        {booking.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 font-medium">Job Cancelled</span>
            </div>
            {booking.cancellation_reason && (
              <p className="text-red-700 text-sm mt-1">{booking.cancellation_reason}</p>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Job Successfully Completed!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Thank you for using our service. We hope to serve you again soon.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingStatusDisplay;