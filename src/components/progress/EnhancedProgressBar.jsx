import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Star
} from 'lucide-react';

const EnhancedProgressBar = ({ booking, contractor, onPayment }) => {
  const [currentStage, setCurrentStage] = useState(0);
  
  const progressStages = [
    {
      key: 'finding_contractor',
      title: 'Finding Contractors',
      icon: Search,
      description: 'Contractors are reviewing your request and submitting bids',
      color: 'bg-yellow-500',
      delay: 5000
    },
    {
      key: 'contractor_found',
      title: 'Contractor Assigned',
      icon: UserCheck,
      description: 'Your contractor has been selected and notified',
      color: 'bg-green-500',
      delay: 5000
    },
    {
      key: 'arriving',
      title: 'Contractor Arriving',
      icon: Truck,
      description: 'Your contractor is on the way to your location',
      color: 'bg-blue-500',
      delay: 5000
    },
    {
      key: 'job_started',
      title: 'Job In Progress',
      icon: Play,
      description: 'Work has started on your service request',
      color: 'bg-purple-500',
      delay: 5000
    },
    {
      key: 'completed',
      title: 'Job Completed',
      icon: CheckCircle,
      description: 'Work has been completed successfully',
      color: 'bg-green-600',
      delay: 3000
    },
    {
      key: 'paid',
      title: 'Payment Confirmed',
      icon: CreditCard,
      description: 'Payment has been processed',
      color: 'bg-indigo-500',
      delay: 0
    }
  ];

  useEffect(() => {
    // Map booking status to stage index
    const statusToStageIndex = {
      'finding_contractor': 0,
      'contractor_found': 1,
      'arriving': 2,
      'job_started': 3,
      'completed': 4,
      'paid': 5
    };

    const stageIndex = statusToStageIndex[booking?.status] || 0;
    setCurrentStage(stageIndex);
  }, [booking?.status]);

  const handleStageClick = (stageIndex) => {
    const stage = progressStages[stageIndex];
    // Show stage details modal or tooltip
    console.log(`Clicked stage: ${stage.title} - ${stage.description}`);
  };

  const handlePayNow = () => {
    onPayment?.(booking);
  };

  if (!booking) return null;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Booking Progress</h3>
          <p className="text-sm text-gray-600">
            Track your service request from start to finish
          </p>
        </div>

        {/* Progress Stages */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-green-500 transition-all duration-1000 ease-in-out"
              style={{ 
                width: `${(currentStage / (progressStages.length - 1)) * 100}%` 
              }}
            />
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-between">
            {progressStages.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index <= currentStage;
              const isCurrent = index === currentStage;

              return (
                <div
                  key={stage.key}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleStageClick(index)}
                >
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center relative z-10 
                      transition-all duration-300 transform group-hover:scale-110
                      ${isActive 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-400'
                      }
                      ${isCurrent ? 'ring-4 ring-green-200 animate-pulse' : ''}
                    `}
                  >
                    <StageIcon className="w-5 h-5" />
                  </div>
                  <div className="mt-3 text-center max-w-20">
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
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="font-medium text-green-800">
              {progressStages[currentStage]?.title}
            </h4>
          </div>
          <p className="text-sm text-green-700">
            {progressStages[currentStage]?.description}
          </p>
        </div>
      </Card>

      {/* Contractor Info - Show when contractor is assigned */}
      {contractor && currentStage >= 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Contractor</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{contractor.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{contractor.rating}</span>
                <span>•</span>
                <span>{contractor.reviews} reviews</span>
              </div>
              <p className="text-sm text-gray-600">{contractor.experience}</p>
              
              {/* ETA Display when arriving */}
              {currentStage === 2 && contractor.eta && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {contractor.eta}</span>
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
        </Card>
      )}

      {/* Payment Section - Show when job is completed */}
      {currentStage === 4 && booking.status === 'completed' && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Job Completed Successfully!
            </h3>
            <p className="text-green-700 mb-4">
              Your {booking.service_type} service has been completed.
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${booking.final_price || booking.estimated_price}
                </span>
              </div>
            </div>
            <Button 
              onClick={handlePayNow}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedProgressBar;