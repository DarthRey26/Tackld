import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  UserCheck, 
  Truck, 
  PlayCircle, 
  CheckCircle, 
  CreditCard,
  Clock,
  User,
  Star,
  Phone,
  MessageCircle,
  Calendar,
  AlertTriangle,
  Wrench
} from 'lucide-react';

const PROGRESS_STAGES = {
  finding_contractor: {
    title: 'Finding Contractor',
    icon: Search,
    description: 'We\'re searching for the best contractor for your job',
    color: 'bg-blue-500',
    percentage: 10
  },
  contractor_found: {
    title: 'Contractor Found',
    icon: UserCheck,
    description: 'Your contractor has been assigned and notified',
    color: 'bg-green-500',
    percentage: 25
  },
  arriving: {
    title: 'Contractor Arriving',
    icon: Truck,
    description: 'Your contractor is on the way',
    color: 'bg-yellow-500',
    percentage: 40
  },
  job_started: {
    title: 'Job Started',
    icon: PlayCircle,
    description: 'Work has begun on your service',
    color: 'bg-blue-600',
    percentage: 60
  },
  job_completed: {
    title: 'Job Completed',
    icon: CheckCircle,
    description: 'Service completed, awaiting your review',
    color: 'bg-purple-500',
    percentage: 85
  },
  payment_settled: {
    title: 'Payment Settled',
    icon: CreditCard,
    description: 'Payment processed and booking complete',
    color: 'bg-green-600',
    percentage: 100
  }
};

const ProgressTracker = ({ 
  booking, 
  onExtraPartsResponse, 
  onRescheduleResponse,
  onNavigateToPayment 
}) => {
  const [currentStage, setCurrentStage] = useState('finding_contractor');
  const [progress, setProgress] = useState(10);
  const [notifications, setNotifications] = useState([]);

  // Update progress based on booking status
  useEffect(() => {
    if (!booking) return;

    const stage = booking.progress?.current_stage || 'finding_contractor';
    const percentage = booking.progress?.stage_completion || PROGRESS_STAGES[stage]?.percentage || 10;
    
    setCurrentStage(stage);
    setProgress(percentage);
  }, [booking]);

  // Add notification when stage changes
  useEffect(() => {
    const stageInfo = PROGRESS_STAGES[currentStage];
    if (stageInfo) {
      const notification = {
        id: Date.now(),
        message: stageInfo.description,
        timestamp: new Date(),
        stage: currentStage
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
    }
  }, [currentStage]);

  const getStageStatus = (stageKey) => {
    const stageOrder = Object.keys(PROGRESS_STAGES);
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageKey);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Bar */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Booking Progress</CardTitle>
            <Badge variant="outline" className="text-sm">
              {progress}% Complete
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stage Icons */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {Object.entries(PROGRESS_STAGES).map(([stageKey, stage]) => {
              const status = getStageStatus(stageKey);
              const Icon = stage.icon;
              
              return (
                <div key={stageKey} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${status === 'completed' ? 'bg-green-500 text-white' : 
                      status === 'current' ? stage.color + ' text-white animate-pulse' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-xs mt-1 text-center leading-tight ${
                    status === 'current' ? 'font-semibold text-blue-600' : 'text-gray-500'
                  }`}>
                    {stage.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Current Stage Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">
              {PROGRESS_STAGES[currentStage]?.title}
            </h3>
            <p className="text-blue-700 text-sm">
              {PROGRESS_STAGES[currentStage]?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Details */}
      {booking?.contractor_id && currentStage !== 'finding_contractor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Contractor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {booking.contractor_id.profile?.profile_photo_url && (
                <img
                  src={booking.contractor_id.profile.profile_photo_url}
                  alt="Contractor"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {booking.contractor_id.profile?.full_name || 'Contractor'}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {booking.contractor_id.rating || 'New'} • {booking.contractor_id.completed_jobs || 0} jobs
                  </span>
                </div>
                
                {/* Contact Info */}
                <div className="flex gap-4 text-sm">
                  {booking.contractor_id.profile?.phone_number && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {booking.contractor_id.profile.phone_number}
                    </div>
                  )}
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>

                {/* ETA Info */}
                {currentStage === 'arriving' && booking.estimated_arrival && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        Arriving at {formatTime(booking.estimated_arrival)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extra Parts Banner */}
      {booking?.pending_extra_parts?.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Additional Parts Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Your contractor has identified additional parts needed for the job:
            </p>
            
            <div className="space-y-3">
              {booking.pending_extra_parts.map((part, idx) => (
                <div key={idx} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{part.name}</h4>
                      <p className="text-sm text-gray-600">{part.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${part.price}</p>
                      <p className="text-xs text-gray-500">Qty: {part.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onExtraPartsResponse?.(part.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExtraPartsResponse?.(part.id, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reschedule Request */}
      {booking?.reschedule_request && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Calendar className="w-5 h-5" />
              Reschedule Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-2">
              <strong>Reason:</strong> {booking.reschedule_request.reason}
            </p>
            <p className="text-yellow-700 mb-4">
              <strong>New Time:</strong> {formatDate(booking.reschedule_request.new_date)} at {formatTime(booking.reschedule_request.new_time)}
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onRescheduleResponse?.('approve')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRescheduleResponse?.('reject')}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Images */}
      {(booking?.photos?.before?.length > 0 || booking?.photos?.after?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Job Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {booking.photos.before?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Before Photos</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {booking.photos.before.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Before ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {booking.photos.after?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">After Photos</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {booking.photos.after.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`After ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Button */}
      {currentStage === 'job_completed' && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Job Completed!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Great! Your service has been completed. Please review the work and proceed with payment.
            </p>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Total Amount: ${booking.final_price || booking.price_max}</p>
                <p className="text-sm text-gray-600">Includes all approved additional parts</p>
              </div>
              
              <Button
                onClick={() => onNavigateToPayment?.(booking.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressTracker;