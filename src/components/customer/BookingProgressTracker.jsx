import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import PaymentSimulator from '@/components/PaymentSimulator';
import ReviewModal from '@/components/ReviewModal';
import { 
  Search, 
  UserCheck, 
  MapPin, 
  PlayCircle, 
  CheckCircle, 
  CreditCard,
  Clock,
  Star,
  Image as ImageIcon,
  MessageCircle,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const PROGRESS_STAGES = [
  {
    key: 'finding_contractor',
    title: 'Finding Contractor',
    icon: Search,
    description: 'Searching for qualified contractors in your area',
    color: 'bg-blue-500'
  },
  {
    key: 'bidding_in_progress', 
    title: 'Reviewing Bids',
    icon: DollarSign,
    description: 'Contractors are submitting their proposals',
    color: 'bg-yellow-500'
  },
  {
    key: 'contractor_assigned',
    title: 'Contractor Assigned',
    icon: UserCheck,
    description: 'Your contractor has been selected and notified',
    color: 'bg-green-500'
  },
  {
    key: 'contractor_arriving',
    title: 'Contractor Arriving',
    icon: MapPin,
    description: 'Your contractor is on the way to your location',
    color: 'bg-purple-500'
  },
  {
    key: 'job_in_progress',
    title: 'Job In Progress',
    icon: PlayCircle,
    description: 'Work is currently being performed',
    color: 'bg-orange-500'
  },
  {
    key: 'job_completed',
    title: 'Job Completed',
    icon: CheckCircle,
    description: 'Service has been completed successfully',
    color: 'bg-indigo-500'
  }
];

const BookingProgressTracker = ({ booking, onPaymentComplete }) => {
  const { toast } = useToast();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [stageDetails, setStageDetails] = useState({});
  const [extraPartsRequests, setExtraPartsRequests] = useState([]);

  // Map booking status to stage index
  const getStageFromStatus = (status) => {
    switch (status) {
      case 'finding_contractor':
      case 'pending_bids':
        return 0;
      case 'bidding_in_progress':
        return 1;
      case 'assigned':
      case 'contractor_found':
        return 2;
      case 'arriving':
        return 3;
      case 'started':
      case 'in_progress':
        return 4;
      case 'completed':
        return 5;
      default:
        return 0;
    }
  };

  // Update stage based on booking status
  useEffect(() => {
    if (!booking) return;
    
    const stageIndex = getStageFromStatus(booking.status);
    setCurrentStageIndex(stageIndex);
    
    // Load stage details from booking progress
    if (booking.progress) {
      setStageDetails(booking.progress);
    }
  }, [booking]);

  // Update progress bar
  useEffect(() => {
    const targetProgress = ((currentStageIndex + 1) / PROGRESS_STAGES.length) * 100;
    setProgress(Math.min(targetProgress, 100));
  }, [currentStageIndex]);

  // Simulate extra parts requests
  useEffect(() => {
    if (currentStageIndex === 4) { // Job in progress
      setTimeout(() => {
        setExtraPartsRequests([{
          id: 'part_1',
          name: 'Air Filter Replacement',
          description: 'High-efficiency HEPA filter for improved performance',
          price: 45,
          quantity: 1,
          reason: 'Current filter is severely clogged and needs replacement for optimal performance',
          status: 'pending'
        }]);
        
        toast({
          title: "Additional Parts Required",
          description: "Your contractor has requested approval for additional parts",
          duration: 6000,
        });
      }, 8000);
    }
  }, [currentStageIndex, toast]);

  const handleStageClick = (stageIndex) => {
    setSelectedStage(PROGRESS_STAGES[stageIndex]);
    setShowStageModal(true);
  };

  const handleExtraPartsResponse = (partId, approved) => {
    setExtraPartsRequests(prev => 
      prev.map(part => 
        part.id === partId 
          ? { ...part, status: approved ? 'approved' : 'rejected' }
          : part
      )
    );
    
    toast({
      title: approved ? "Parts Approved" : "Parts Rejected",
      description: approved 
        ? "Additional parts have been approved and added to your total"
        : "Additional parts request has been declined",
    });
  };

  const handleJobCompleted = () => {
    setShowPayment(true);
  };

  const handlePaymentCompleted = (updatedBooking) => {
    setShowPayment(false);
    setShowReview(true);
    onPaymentComplete?.(updatedBooking);
  };

  const handleReviewSubmitted = (review) => {
    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback. It helps us improve our service.",
    });
  };

  if (!booking) return null;

  const currentStage = PROGRESS_STAGES[currentStageIndex];
  const isCompleted = booking.status === 'completed';
  const showPaymentButton = isCompleted && booking.payment_status !== 'paid';

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Booking Progress</CardTitle>
            <Badge variant="outline" className="text-sm">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Animated Progress Bar */}
          <div className="relative mb-6">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-6 gap-2">
            {PROGRESS_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              
              return (
                <div 
                  key={stage.key} 
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleStageClick(index)}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-2
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? stage.color + ' text-white animate-pulse' : 
                      'bg-muted text-muted-foreground'}
                    group-hover:scale-110
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs text-center leading-tight transition-colors ${
                    isActive ? 'font-semibold text-primary' : 
                    isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {stage.title}
                  </p>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Stage Description */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-primary mb-1">
              {currentStage.title}
            </h3>
            <p className="text-primary/80 text-sm">
              {currentStage.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Extra Parts Requests */}
      {extraPartsRequests.filter(part => part.status === 'pending').map((part) => (
        <Card key={part.id} className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Additional Parts Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Your contractor has identified additional parts needed for optimal service:
            </p>
            
            <div className="bg-white p-4 rounded border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{part.name}</h4>
                  <p className="text-sm text-gray-600">{part.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Reason: {part.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">${part.price}</p>
                  <p className="text-xs text-gray-500">Qty: {part.quantity}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleExtraPartsResponse(part.id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve ${part.price}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExtraPartsResponse(part.id, false)}
                >
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Job Completed - Pay Now */}
      {showPaymentButton && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Job Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Excellent! Your service has been completed. Please review the work and proceed with payment.
            </p>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">
                  Total Amount: ${booking.final_price || booking.estimated_price || 150}
                </p>
                <p className="text-sm text-gray-600">
                  {extraPartsRequests.filter(p => p.status === 'approved').length > 0 && 'Includes approved additional parts'}
                </p>
              </div>
              
              <Button
                onClick={handleJobCompleted}
                className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Completed */}
      {booking.payment_status === 'paid' && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Payment Completed!</h3>
            <p className="text-green-700 mb-4">Your booking has been successfully completed and paid.</p>
            <Button
              variant="outline"
              onClick={() => setShowReview(true)}
              className="bg-white hover:bg-green-50"
            >
              <Star className="w-4 h-4 mr-2" />
              Leave a Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stage Details Modal */}
      <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStage && (
                <>
                  <selectedStage.icon className="w-5 h-5" />
                  {selectedStage.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStage && (
            <div className="space-y-4">
              <p className="text-muted-foreground">{selectedStage.description}</p>
              
              {/* Show stage-specific details from booking progress */}
              {stageDetails[selectedStage.key] && (
                <div className="space-y-2">
                  <h4 className="font-medium">Progress Details</h4>
                  {stageDetails[selectedStage.key].notes && (
                    <p className="text-sm text-muted-foreground">
                      {stageDetails[selectedStage.key].notes}
                    </p>
                  )}
                  {stageDetails[selectedStage.key].timestamp && (
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(stageDetails[selectedStage.key].timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Button onClick={() => setShowStageModal(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {showPayment && (
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="max-w-md">
            <PaymentSimulator
              booking={booking}
              onPaymentComplete={handlePaymentCompleted}
              onCancel={() => setShowPayment(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      <ReviewModal
        booking={booking}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onSubmit={handleReviewSubmitted}
      />
    </div>
  );
};

export default BookingProgressTracker;