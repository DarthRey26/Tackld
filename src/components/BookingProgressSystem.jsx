import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  UserCheck, 
  Truck, 
  PlayCircle, 
  CheckCircle, 
  CreditCard,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Image,
  MessageCircle
} from 'lucide-react';

const PROGRESS_STAGES = [
  {
    key: 'finding_contractor',
    title: 'Finding Contractor',
    icon: Search,
    description: 'Searching for available contractors in your area',
    color: 'bg-blue-500',
    duration: 5000
  },
  {
    key: 'bidding_in_progress',
    title: 'Bidding in Progress',
    icon: DollarSign,
    description: 'Contractors are submitting their bids',
    color: 'bg-yellow-500',
    duration: 5000
  },
  {
    key: 'contractor_found',
    title: 'Contractor Assigned',
    icon: UserCheck,
    description: 'Your contractor has been selected and notified',
    color: 'bg-green-500',
    duration: 5000
  },
  {
    key: 'job_in_progress',
    title: 'Job In Progress',
    icon: PlayCircle,
    description: 'Work is currently being performed',
    color: 'bg-purple-500',
    duration: 5000
  },
  {
    key: 'job_completed',
    title: 'Job Completed',
    icon: CheckCircle,
    description: 'Service has been completed successfully',
    color: 'bg-indigo-500',
    duration: 5000
  },
  {
    key: 'payment_confirmation',
    title: 'Payment Confirmation',
    icon: CreditCard,
    description: 'Payment processed and booking complete',
    color: 'bg-green-600',
    duration: 0
  }
];

const BookingProgressSystem = ({ booking, onPaymentRequired }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageDetails, setStageDetails] = useState({});
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [extraParts, setExtraParts] = useState([]);
  const [rescheduleRequest, setRescheduleRequest] = useState(null);
  const { toast } = useToast();

  // Auto-progress through stages with 5-second delays
  useEffect(() => {
    if (!booking || booking.status === 'completed') return;

    const timer = setInterval(() => {
      setCurrentStageIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= PROGRESS_STAGES.length - 1) {
          clearInterval(timer);
          return PROGRESS_STAGES.length - 1;
        }
        
        // Show notification for stage transition
        const nextStage = PROGRESS_STAGES[nextIndex];
        toast({
          title: `Status Update: ${nextStage.title}`,
          description: nextStage.description,
          duration: 4000,
        });

        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [booking, toast]);

  // Update progress bar based on current stage
  useEffect(() => {
    const targetProgress = ((currentStageIndex + 1) / PROGRESS_STAGES.length) * 100;
    setProgress(targetProgress);
  }, [currentStageIndex]);

  // Simulate contractor updates during job progress
  useEffect(() => {
    if (currentStageIndex === 3) { // Job In Progress
      // Simulate arrival confirmation
      setTimeout(() => {
        setStageDetails(prev => ({
          ...prev,
          arrival_confirmed: {
            time: new Date(),
            photo: '/api/placeholder/contractor-arrival.jpg',
            note: 'Arrived at location and ready to begin work'
          }
        }));
        toast({
          title: "Contractor Update",
          description: "Contractor has arrived and confirmed their location",
        });
      }, 2000);

      // Simulate midway check-in
      setTimeout(() => {
        setStageDetails(prev => ({
          ...prev,
          midway_checkin: {
            time: new Date(),
            photo: '/api/placeholder/work-progress.jpg',
            note: 'Work is progressing well. Cleaning filters and checking system.'
          }
        }));
        toast({
          title: "Progress Update",
          description: "Contractor provided a midway progress update",
        });
      }, 8000);

      // Simulate extra parts request
      setTimeout(() => {
        const parts = [
          {
            id: 'part_1',
            name: 'Air Filter Replacement',
            description: 'High-efficiency HEPA filter for improved air quality',
            price: 45,
            quantity: 1,
            reason: 'Current filter is severely clogged and needs immediate replacement'
          }
        ];
        setExtraParts(parts);
        toast({
          title: "Additional Parts Required",
          description: "Contractor has requested approval for additional parts",
        });
      }, 12000);

      // Simulate completion
      setTimeout(() => {
        setStageDetails(prev => ({
          ...prev,
          completion_photos: {
            before: ['/api/placeholder/before-1.jpg', '/api/placeholder/before-2.jpg'],
            after: ['/api/placeholder/after-1.jpg', '/api/placeholder/after-2.jpg'],
            note: 'Work completed successfully. System is running efficiently.'
          }
        }));
      }, 15000);
    }
  }, [currentStageIndex, toast]);

  const handleStageClick = (stageIndex) => {
    setSelectedStage(PROGRESS_STAGES[stageIndex]);
    setShowStageModal(true);
  };

  const handleExtraPartsResponse = (partId, response) => {
    setExtraParts(prev => prev.filter(part => part.id !== partId));
    
    if (response === 'approve') {
      toast({
        title: "Parts Approved",
        description: "Additional parts have been approved and added to your bill",
      });
    } else {
      toast({
        title: "Parts Rejected",
        description: "Additional parts request has been declined",
      });
    }
  };

  const handleRescheduleResponse = (response) => {
    setRescheduleRequest(null);
    
    if (response === 'approve') {
      toast({
        title: "Reschedule Approved",
        description: "New appointment time has been confirmed",
      });
    } else {
      toast({
        title: "Reschedule Declined",
        description: "Original appointment time will be maintained",
      });
    }
  };

  const handlePayNow = () => {
    onPaymentRequired?.(booking);
    setCurrentStageIndex(PROGRESS_STAGES.length - 1);
    toast({
      title: "Payment Processed",
      description: "Your payment has been processed successfully",
    });
  };

  if (!booking) return null;

  const currentStage = PROGRESS_STAGES[currentStageIndex];

  return (
    <div className="space-y-6">
      {/* Main Progress Bar */}
      <Card className="border-l-4 border-l-blue-500">
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
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
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
              const isPending = index > currentStageIndex;
              
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
                      'bg-gray-200 text-gray-400'}
                    group-hover:scale-110
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs text-center leading-tight transition-colors ${
                    isActive ? 'font-semibold text-blue-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stage.title}
                  </p>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Stage Description */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-1">
              {currentStage.title}
            </h3>
            <p className="text-blue-700 text-sm">
              {currentStage.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Extra Parts Request */}
      {extraParts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
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
            
            {extraParts.map((part) => (
              <div key={part.id} className="bg-white p-4 rounded border mb-3">
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
                    onClick={() => handleExtraPartsResponse(part.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExtraPartsResponse(part.id, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pay Now Button */}
      {currentStageIndex === PROGRESS_STAGES.length - 2 && (
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
                <p className="font-semibold text-lg">Total Amount: ${booking.estimatedPrice + 45}</p>
                <p className="text-sm text-gray-600">Includes approved additional parts</p>
              </div>
              
              <Button
                onClick={handlePayNow}
                className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
              >
                Pay Now
              </Button>
            </div>
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
              <p className="text-gray-600">{selectedStage.description}</p>
              
              {/* Show stage-specific details */}
              {stageDetails.arrival_confirmed && selectedStage.key === 'job_in_progress' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Arrival Confirmed</h4>
                  <p className="text-sm text-gray-600">{stageDetails.arrival_confirmed.note}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(stageDetails.arrival_confirmed.time).toLocaleTimeString()}
                  </p>
                </div>
              )}
              
              {stageDetails.midway_checkin && selectedStage.key === 'job_in_progress' && (
                <div className="space-y-2">
                  <h4 className="font-medium">Progress Update</h4>
                  <p className="text-sm text-gray-600">{stageDetails.midway_checkin.note}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(stageDetails.midway_checkin.time).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingProgressSystem;