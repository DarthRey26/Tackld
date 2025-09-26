import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, User, Phone, Mail, CreditCard, CheckCircle, Package } from 'lucide-react';
import { bookingService } from '@/lib/services/bookingService';
import { toast } from 'sonner';
import ExtraPartsModal from './ExtraPartsModal';

const RealTimeBookingStatus = ({ booking, onBookingUpdate }) => {
  const [processing, setProcessing] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);

  const getProgressPercentage = () => {
    const stagePhotos = booking.stage_photos || {};
    const beforePhotos = stagePhotos.before_photos?.length || booking.before_photos?.length || 0;
    const duringPhotos = stagePhotos.during_photos?.length || booking.during_photos?.length || 0;
    const afterPhotos = stagePhotos.after_photos?.length || booking.after_photos?.length || 0;
    
    // Use current_stage instead of status for more accurate progress
    const stage = booking.current_stage || booking.status;
    
    switch (stage) {
      case 'pending_bids':
      case 'finding_contractor':
        return 10;
      case 'assigned':
        return 20;
      case 'arriving':
        return 30;
      case 'work_started':
        return beforePhotos > 0 ? 45 : 35;
      case 'in_progress':
        return duringPhotos > 0 ? 70 : 60;
      case 'work_completed':
        return afterPhotos > 0 ? 85 : 80;
      case 'awaiting_payment':
        return 95;
      case 'paid':
        return 100;
      default:
        return 10;
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await bookingService.processPayment(booking.id, 'wallet');
      toast.success('Payment processed successfully!');
      onBookingUpdate();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  // Check for pending parts approval
  useEffect(() => {
    if (booking?.extra_parts && booking.extra_parts.some(part => part.status === 'pending')) {
      setShowPartsModal(true);
    }
  }, [booking?.extra_parts]);

  const getProgressSteps = () => {
    const steps = [
      { key: 'pending_bids', label: 'Finding Contractor', icon: User },
      { key: 'assigned', label: 'Contractor Assigned', icon: CheckCircle },
      { key: 'arriving', label: 'Contractor Arriving', icon: Clock },
      { key: 'work_started', label: 'Work Started', icon: CheckCircle },
      { key: 'in_progress', label: 'Job in Progress', icon: CheckCircle },
      { key: 'work_completed', label: 'Job Completed', icon: CheckCircle },
      { key: 'awaiting_payment', label: 'Awaiting Payment', icon: CreditCard },
      { key: 'paid', label: 'Payment Completed', icon: CheckCircle }
    ];

    const currentStage = booking?.current_stage || booking?.status;
    const currentIndex = steps.findIndex(step => step.key === currentStage);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'ASAP';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-SG', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Booking Status</div>
          <Badge variant="outline" className="capitalize">
            {booking.status?.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} />
        </div>

        {/* Extra Parts Alert */}
        {booking?.extra_parts && booking.extra_parts.some(part => part.status === 'pending') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Parts Approval Needed</span>
              </div>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Your contractor has requested additional parts for this job.
            </p>
            <Button 
              onClick={() => setShowPartsModal(true)}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              Review Parts Request
            </Button>
          </div>
        )}

        {/* Payment Section */}
        {(booking.current_stage === 'awaiting_payment' || booking.status === 'awaiting_payment') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Job Completed!</span>
              </div>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Your job has been completed successfully. Please proceed with payment to finalize the booking.
            </p>
            <Button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {processing ? 'Processing...' : `Pay Now - $${booking.estimated_price || booking.final_price || '0.00'}`}
            </Button>
          </div>
        )}

        {/* Job Details */}
        <div className="space-y-4">
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Service</p>
              <p className="font-medium capitalize">{booking.service_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{booking.scheduled_date || 'ASAP'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium">{booking.address?.line1}</p>
              {booking.address?.line2 && <p className="text-sm text-muted-foreground">{booking.address?.line2}</p>}
              <p className="text-sm text-muted-foreground">Singapore {booking.address?.postal_code}</p>
            </div>
          </div>

          {booking.contractor && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Your Contractor</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.contractor.full_name || booking.contractor_name}</span>
                </div>
                {booking.contractor.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.contractor.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ExtraPartsModal
          booking={booking}
          isOpen={showPartsModal}
          onClose={() => setShowPartsModal(false)}
          onUpdate={onBookingUpdate}
        />
      </CardContent>
    </Card>
  );
};

export default RealTimeBookingStatus;