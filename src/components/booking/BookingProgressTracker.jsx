import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { extraPartsService, rescheduleService, bookingService } from "@/lib/services";
import { useRealtimeBooking } from "@/hooks/useRealtimeBooking";
import { 
  Clock, 
  CheckCircle, 
  User, 
  Wrench, 
  Star, 
  CreditCard,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  DollarSign
} from 'lucide-react';

const BookingProgressTracker = ({ booking: initialBooking, onPaymentRequired }) => {
  const { toast } = useToast();
  const [showStageDetails, setShowStageDetails] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [extraParts, setExtraParts] = useState([]);
  const [rescheduleRequest, setRescheduleRequest] = useState(null);
  
  // Use the real-time booking hook
  const { booking, updateBookingStatus } = useRealtimeBooking(initialBooking?.id, 'customer');

  const progressStages = [
    {
      key: 'finding_contractor',
      title: 'Finding Contractor',
      icon: Clock,
      description: 'Contractors are reviewing your request and submitting bids',
      color: 'bg-yellow-500',
      progress: 15
    },
    {
      key: 'contractor_found',
      title: 'Contractor Found',
      icon: User,
      description: 'A contractor has been assigned to your job',
      color: 'bg-blue-500',
      progress: 30
    },
    {
      key: 'arriving',
      title: 'Contractor Arriving',
      icon: MapPin,
      description: 'Your contractor is on the way to your location',
      color: 'bg-purple-500',
      progress: 45
    },
    {
      key: 'job_started',
      title: 'Job Started',
      icon: Wrench,
      description: 'Work has begun on your service request',
      color: 'bg-orange-500',
      progress: 60
    },
    {
      key: 'job_completed',
      title: 'Job Completed',
      icon: CheckCircle,
      description: 'The work has been completed successfully',
      color: 'bg-green-500',
      progress: 80
    },
    {
      key: 'payment_settled',
      title: 'Payment Settled',
      icon: CreditCard,
      description: 'Payment has been processed and job is complete',
      color: 'bg-emerald-500',
      progress: 100
    }
  ];

  // Load extra parts and reschedule requests
  useEffect(() => {
    if (!booking?.id) return;

    const loadExtraData = async () => {
      // Load extra parts requests
      const { data: extraPartsData } = await extraPartsService.getExtraPartsForBooking(booking.id);
      if (extraPartsData) {
        setExtraParts(extraPartsData.filter(part => part.status === 'pending'));
      }

      // Load reschedule requests
      const { data: rescheduleData } = await rescheduleService.getRescheduleRequestsForBooking(booking.id);
      if (rescheduleData) {
        const pendingReschedule = rescheduleData.find(req => req.status === 'pending');
        setRescheduleRequest(pendingReschedule || null);
      }
    };

    loadExtraData();
  }, [booking?.id]);

  const getCurrentStageIndex = () => {
    return progressStages.findIndex(stage => stage.key === booking?.status);
  };

  const getCurrentProgress = () => {
    const currentStage = progressStages.find(stage => stage.key === booking?.status);
    return currentStage?.progress || 0;
  };

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
    setShowStageDetails(true);
  };

  const handleExtraPartsResponse = async (extraPartId, approved) => {
    try {
      if (approved) {
        await extraPartsService.approveExtraParts(extraPartId, booking.customer_id);
      } else {
        await extraPartsService.rejectExtraParts(extraPartId, booking.customer_id);
      }
      
      setExtraParts(prev => prev.filter(part => part.id !== extraPartId));
      
      toast({
        title: approved ? "Parts Approved" : "Parts Rejected",
        description: approved ? "The contractor can proceed with additional parts" : "The contractor has been notified of your decision",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to parts request",
        variant: "destructive",
      });
    }
  };

  const handleRescheduleResponse = async (approved) => {
    if (!rescheduleRequest) return;
    
    try {
      if (approved) {
        await rescheduleService.approveRescheduleRequest(rescheduleRequest.id, booking.customer_id);
      } else {
        await rescheduleService.rejectRescheduleRequest(rescheduleRequest.id, booking.customer_id);
      }
      
      setRescheduleRequest(null);
      
      toast({
        title: approved ? "Reschedule Approved" : "Reschedule Rejected",
        description: approved ? "Your job has been rescheduled" : "The contractor has been notified",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to reschedule request",
        variant: "destructive",
      });
    }
  };

  const handlePayNow = async () => {
    try {
      await updateBookingStatus('paid', { 
        payment_status: 'completed',
        payment_method: 'simulation' 
      });
      
      toast({
        title: "Payment Processed",
        description: "Your payment has been successfully processed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const calculateTotalCost = () => {
    let total = booking?.final_price || 0;
    extraParts.forEach(part => {
      if (part.status === 'approved') {
        total += part.total_price;
      }
    });
    return total;
  };

  if (!booking) {
    return null;
  }

  const currentStageIndex = getCurrentStageIndex();
  const currentProgress = getCurrentProgress();

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Job Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-3" />
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-between items-center">
            {progressStages.map((stage, index) => {
              const isActive = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const StageIcon = stage.icon;
              
              return (
                <div
                  key={stage.key}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleStageClick(stage)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? `${stage.color} text-white` 
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-blue-200' : ''} group-hover:scale-110`}
                  >
                    <StageIcon className="h-5 w-5" />
                  </div>
                  <div className={`mt-2 text-xs text-center max-w-20 ${
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {stage.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Stage Info */}
          {currentStageIndex >= 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(progressStages[currentStageIndex].icon, { 
                  className: "h-5 w-5 text-primary" 
                })}
                <span className="font-semibold">
                  {progressStages[currentStageIndex].title}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {progressStages[currentStageIndex].description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra Parts Requests */}
      {extraParts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              Additional Parts Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extraParts.map((part) => (
              <div key={part.id} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{part.part_name}</h4>
                    <p className="text-sm text-muted-foreground">{part.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${part.total_price}</div>
                    <div className="text-sm text-muted-foreground">
                      {part.quantity} × ${part.unit_price}
                    </div>
                  </div>
                </div>
                {part.photo_url && (
                  <img 
                    src={part.photo_url} 
                    alt="Part" 
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleExtraPartsResponse(part.id, true)}
                    className="flex-1"
                  >
                    Approve (${part.total_price})
                  </Button>
                  <Button 
                    onClick={() => handleExtraPartsResponse(part.id, false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reschedule Request */}
      {rescheduleRequest && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Calendar className="h-5 w-5" />
              Reschedule Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <strong>New Date:</strong> {rescheduleRequest.new_date}
              </div>
              <div>
                <strong>New Time:</strong> {rescheduleRequest.new_time}
              </div>
              <div>
                <strong>Reason:</strong> {rescheduleRequest.reason}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleRescheduleResponse(true)}
                  className="flex-1"
                >
                  Accept Reschedule
                </Button>
                <Button 
                  onClick={() => handleRescheduleResponse(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section */}
      {booking?.status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Job Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Service Fee:</span>
                <span>${booking.final_price}</span>
              </div>
              {extraParts.filter(part => part.status === 'approved').map(part => (
                <div key={part.id} className="flex justify-between items-center mb-2">
                  <span>{part.part_name}:</span>
                  <span>${part.total_price}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>${calculateTotalCost()}</span>
              </div>
            </div>
            <Button onClick={handlePayNow} className="w-full" size="lg">
              <CreditCard className="h-5 w-5 mr-2" />
              Pay Now (${calculateTotalCost()})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stage Details Modal */}
      <Dialog open={showStageDetails} onOpenChange={setShowStageDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStage && React.createElement(selectedStage.icon, { 
                className: "h-5 w-5" 
              })}
              {selectedStage?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{selectedStage?.description}</p>
            
            {booking.contractor_id && (
              <div className="space-y-2">
                <h4 className="font-semibold">Contractor Information</h4>
                <div className="bg-muted p-3 rounded">
                  <div className="font-medium">{booking.contractor?.name || 'Contractor'}</div>
                  {booking.contractor?.phone && (
                    <div className="text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 inline mr-1" />
                      {booking.contractor.phone}
                    </div>
                  )}
                  {booking.contractor?.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{booking.contractor.rating} ({booking.contractor.reviews || 0} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingProgressTracker;