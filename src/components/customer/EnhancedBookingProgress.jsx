import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import { bookingService, extraPartsService } from '@/lib/services';
import { 
  Search, 
  UserCheck, 
  Truck, 
  Play, 
  CheckCircle, 
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Star,
  User,
  Camera,
  Package,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react';
import PaymentSimulator from '../payment/PaymentSimulator';

const EnhancedBookingProgress = ({ booking: initialBooking, onStatusUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { booking, isSubscribed } = useBookingProgress(initialBooking);
  const [currentStage, setCurrentStage] = useState(0);
  const [contractor, setContractor] = useState(null);
  const [stagePhotos, setStagePhotos] = useState({});
  const [extraParts, setExtraParts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [eta, setEta] = useState(null);
  
  const progressStages = [
    {
      key: 'pending_bids',
      title: 'Finding Contractors',
      icon: Search,
      description: 'Contractors are reviewing your request and submitting bids',
      color: 'bg-yellow-500'
    },
    {
      key: 'assigned',
      title: 'Contractor Assigned',
      icon: UserCheck,
      description: 'Your contractor has been selected and notified',
      color: 'bg-green-500'
    },
    {
      key: 'arriving',
      title: 'Contractor Arriving',
      icon: Truck,
      description: 'Your contractor is on the way to your location',
      color: 'bg-blue-500'
    },
    {
      key: 'work_started',
      title: 'Work Started',
      icon: Camera,
      description: 'Work has begun on your service request',
      color: 'bg-purple-500'
    },
    {
      key: 'in_progress',
      title: 'Job In Progress',
      icon: Play,
      description: 'Work is actively being performed',
      color: 'bg-indigo-500'
    },
    {
      key: 'work_completed',
      title: 'Work Completed',
      icon: CheckCircle,
      description: 'Work has been completed successfully',
      color: 'bg-green-600'
    },
    {
      key: 'awaiting_payment',
      title: 'Awaiting Payment',
      icon: CreditCard,
      description: 'Please review the work and make payment',
      color: 'bg-orange-500'
    },
    {
      key: 'paid',
      title: 'Payment Complete',
      icon: CheckCircle,
      description: 'Payment has been processed successfully',
      color: 'bg-emerald-600'
    }
  ];

  // Map booking status/stage to progress index with enhanced debugging
  useEffect(() => {
    if (!booking) {
      console.log('No booking data available');
      return;
    }

    console.log('Booking data for progress calculation:', {
      id: booking.id,
      current_stage: booking.current_stage,
      status: booking.status,
      payment_status: booking.payment_status,
      progress: booking.progress
    });

    const stageToIndex = {
      'pending_bids': 0,
      'finding_contractor': 0,
      'assigned': 1,
      'arriving': 2,
      'work_started': 3,
      'in_progress': 4,
      'work_completed': 5,
      'awaiting_payment': 6,
      'paid': 7
    };

    let stageIndex = 0;
    let stageSource = 'default';
    
    // Use current_stage as the single source of truth
    if (booking?.current_stage) {
      stageIndex = stageToIndex[booking.current_stage] || 0;
      stageSource = 'current_stage';
    } else if (booking?.status) {
      // Fallback to status if current_stage is not set
      stageIndex = stageToIndex[booking.status] || 0;
      stageSource = 'status';
    }
    
    // Special case: if payment is complete, show final stage
    if (booking?.payment_status === 'paid' || booking?.current_stage === 'paid') {
      stageIndex = 7;
      stageSource = 'payment_status';
    }
    
    console.log('Progress calculation result:', {
      stageIndex,
      stageSource,
      progressPercentage: (stageIndex / (progressStages.length - 1)) * 100
    });
    
    setCurrentStage(stageIndex);
    
    // Reset and load stage photos
    setStagePhotos({});
    if (booking?.stage_photos) {
      setStagePhotos(booking.stage_photos);
    }
    
    // Fetch extra parts from separate table
    const fetchExtraParts = async () => {
      if (!booking?.id) return;
      
      try {
        const { data, error } = await extraPartsService.getExtraPartsForBooking(booking.id);
        if (!error && data) {
          setExtraParts(data);
        }
      } catch (error) {
        console.error('Error fetching extra parts for progress:', error);
      }
    };

    fetchExtraParts();
  }, [booking, booking?.current_stage, booking?.status, booking?.payment_status]);

  // Load contractor details
  useEffect(() => {
    if (booking?.contractor_id && currentStage >= 1) {
      loadContractorInfo();
    }
  }, [booking?.contractor_id, currentStage]);

  const loadContractorInfo = async () => {
    try {
      const { data, error } = await bookingService.getContractorProfile(booking.contractor_id);
      if (!error && data) {
        setContractor(data);
      }
    } catch (error) {
      console.error('Error loading contractor info:', error);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setCurrentStage(7);
    toast({
      title: "Payment Complete",
      description: "Your payment has been processed successfully",
    });
    // Refresh booking data to reflect payment completion
    onStatusUpdate?.();
  };

  const renderStagePhotos = (stageType) => {
    const photos = stagePhotos[`${stageType}_photos`] || [];
    if (photos.length === 0) return null;

    return (
      <div className="mt-4">
        <h6 className="text-sm font-medium mb-2 capitalize">{stageType} Photos</h6>
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`${stageType} photo ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  };

  const renderExtraParts = () => {
    if (extraParts.length === 0) return null;

    const pendingParts = extraParts.filter(part => part.status === 'pending');
    const approvedParts = extraParts.filter(part => part.status === 'approved');

    return (
      <div className="mt-4 space-y-3">
        {pendingParts.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-sm font-medium flex items-center gap-1 text-yellow-800">
                <Package className="w-4 h-4" />
                Parts Awaiting Approval ({pendingParts.length})
              </h6>
              <Badge variant="outline" className="text-yellow-700">Action Required</Badge>
            </div>
            <div className="space-y-2">
              {pendingParts.map((part, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-yellow-700">{part.part_name} (x{part.quantity})</span>
                  <span className="font-medium text-yellow-800">${parseFloat(part.total_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              Please review and approve these parts to continue with payment
            </p>
          </div>
        )}

        {approvedParts.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h6 className="text-sm font-medium mb-2 flex items-center gap-1 text-green-800">
              <CheckCircle className="w-4 h-4" />
              Approved Additional Parts
            </h6>
            <div className="space-y-2">
              {approvedParts.map((part, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-700">{part.part_name} (x{part.quantity})</span>
                  <span className="font-medium text-green-800">${parseFloat(part.total_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!booking) return null;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Service Progress</CardTitle>
          <p className="text-sm text-gray-600">
            Track your service request from start to finish
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Progress Stages */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0">
              <div 
                className="h-full bg-green-500 transition-all duration-1000 ease-in-out"
                style={{ 
                  width: `${(currentStage / (progressStages.length - 1)) * 100}%` 
                }}
              />
            </div>

            {/* Stage Indicators */}
            <div className="relative z-10 flex justify-between">
              {progressStages.map((stage, index) => {
                const StageIcon = stage.icon;
                const isActive = index <= currentStage;
                const isCurrent = index === currentStage;

                return (
                  <div
                    key={stage.key}
                    className="flex flex-col items-center"
                  >
                    <div 
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center relative
                        transition-all duration-300 border-4 border-white shadow-lg
                        ${isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                        }
                        ${isCurrent ? 'ring-4 ring-green-200 animate-pulse scale-110' : ''}
                      `}
                    >
                      <StageIcon className="w-5 h-5" />
                    </div>
                    <div className="mt-3 text-center max-w-24">
                      <p className={`
                        text-xs font-medium leading-tight
                        ${isActive ? 'text-green-600' : 'text-gray-500'}
                      `}>
                        {stage.title}
                      </p>
                      {isCurrent && (
                        <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Stage Description */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-green-800">
                {progressStages[currentStage]?.title}
              </h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              {progressStages[currentStage]?.description}
            </p>
            
            {/* Show photos for current stage */}
            {currentStage >= 3 && currentStage <= 5 && (
              <>
                {renderStagePhotos('before')}
                {renderStagePhotos('during')}
                {renderStagePhotos('after')}
              </>
            )}
            
            {/* Show extra parts separately */}
            {renderExtraParts()}
          </div>
        </CardContent>
      </Card>

      {/* Contractor Info - Show when contractor is assigned */}
      {contractor && currentStage >= 1 && (
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle>Your Service Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={contractor.profile_photo_url} />
                <AvatarFallback>
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">{contractor.full_name}</h4>
                {contractor.company_name && (
                  <p className="text-sm text-gray-600 mb-1">{contractor.company_name}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{contractor.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                  <span>•</span>
                  <span>{contractor.total_reviews || 0} reviews</span>
                  <span>•</span>
                  <span>{contractor.total_jobs_completed || 0} jobs completed</span>
                </div>
                
                {/* ETA Display when arriving */}
                {currentStage === 2 && eta && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span>ETA: {eta}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Track
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section - Show when awaiting payment */}
      {currentStage === 6 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <CardContent>
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Service Completed Successfully!
              </h3>
              <p className="text-green-700 mb-4">
                Please review the completed work and process payment
              </p>
              
              {/* Final Amount Display */}
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Service Cost:</span>
                    <span className="font-medium">${booking.estimated_price || booking.final_price}</span>
                  </div>
                  {extraParts.filter(part => part.status === 'approved').length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Additional Parts:</span>
                      <span className="font-medium">
                        ${extraParts.filter(part => part.status === 'approved').reduce((sum, part) => sum + parseFloat(part.total_price || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      ${(
                        parseFloat(booking.final_price || booking.estimated_price || 0) +
                        extraParts.filter(part => part.status === 'approved').reduce((sum, part) => sum + parseFloat(part.total_price || 0), 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Complete Section */}
      {currentStage === 7 && (
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <CardContent>
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                Payment Complete!
              </h3>
              <p className="text-emerald-700 mb-6">
                Thank you for using our service. We hope to serve you again soon!
              </p>
              
              <Button 
                onClick={async () => {
                  try {
                    toast({
                      title: "Booking Complete",
                      description: "Thank you for choosing our service!",
                    });
                    
                    // Force refresh bookings to remove this completed booking from active list
                    await onStatusUpdate?.();
                    
                    // Additional safety: wait a moment then refresh again
                    setTimeout(() => {
                      onStatusUpdate?.();
                    }, 500);
                  } catch (error) {
                    console.error('Error completing booking:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update booking status. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentSimulator
          booking={booking}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default EnhancedBookingProgress;