import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { jobProgressService } from '@/lib/services';
import StageUpdateModal from './StageUpdateModal';
import { 
  Clock, 
  Camera, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Phone,
  User,
  DollarSign,
  Package
} from 'lucide-react';

const ContractorStageManager = ({ booking, onStageUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showStageModal, setShowStageModal] = useState(false);
  const [currentStage, setCurrentStage] = useState('arriving');
  const [canUpdateStage, setCanUpdateStage] = useState(true);

  const stageFlow = [
    {
      key: 'arriving',
      title: 'Arriving',
      icon: Clock,
      description: 'Update arrival time',
      color: 'bg-blue-500',
      nextStage: 'work_started'
    },
    {
      key: 'work_started',
      title: 'Work Started',
      icon: Camera,
      description: 'Take before photos and start work',
      color: 'bg-purple-500',
      nextStage: 'in_progress'
    },
    {
      key: 'in_progress',
      title: 'In Progress',
      icon: Play,
      description: 'Update progress with photos',
      color: 'bg-indigo-500',
      nextStage: 'work_completed'
    },
    {
      key: 'work_completed',
      title: 'Work Complete',
      icon: CheckCircle,
      description: 'Upload final photos and complete job',
      color: 'bg-green-500',
      nextStage: 'awaiting_payment'
    }
  ];

  useEffect(() => {
    if (booking?.current_stage) {
      setCurrentStage(booking.current_stage);
    }
    
    // Check if contractor can update stage
    setCanUpdateStage(booking?.contractor_id === user?.id && ['assigned', 'work_started', 'in_progress', 'work_completed'].includes(booking?.status));
  }, [booking, user]);

  const getCurrentStageInfo = () => {
    return stageFlow.find(stage => stage.key === currentStage) || stageFlow[0];
  };

  const getNextStageInfo = () => {
    const current = getCurrentStageInfo();
    return stageFlow.find(stage => stage.key === current.nextStage);
  };

  const handleStageUpdate = async (newStage, updateData) => {
    try {
      setCurrentStage(newStage);
      
      toast({
        title: 'Stage Updated',
        description: `Job stage updated to ${newStage.replace('_', ' ')}`,
      });
      
      // Notify parent component
      onStageUpdate?.(newStage, updateData);
      
    } catch (error) {
      console.error('Error handling stage update:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update job stage',
        variant: 'destructive'
      });
    }
  };

  const handleCompleteJob = async () => {
    try {
      const { data, error } = await jobProgressService.updateJobStage(
        booking.id,
        user.id,
        'awaiting_payment'
      );

      if (error) throw error;

      setCurrentStage('awaiting_payment');
      
      toast({
        title: 'Job Completed',
        description: 'Job marked as complete. Customer will be notified to make payment.',
      });

      onStageUpdate?.('awaiting_payment', {});
      
    } catch (error) {
      console.error('Error completing job:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete job',
        variant: 'destructive'
      });
    }
  };

  const canProceedToNext = () => {
    const nextStage = getNextStageInfo();
    return nextStage && canUpdateStage && currentStage !== 'awaiting_payment';
  };

  if (!booking) return null;

  const currentStageInfo = getCurrentStageInfo();
  const nextStageInfo = getNextStageInfo();
  const CurrentIcon = currentStageInfo.icon;

  return (
    <div className="space-y-6">
      {/* Current Stage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrentIcon className="w-5 h-5" />
            Current Stage: {currentStageInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">{currentStageInfo.description}</p>
            
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium mb-2">Customer Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{booking.customer_name}</span>
                  </div>
                  {booking.customer_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{booking.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Job Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{booking.address?.formatted || 'Address provided'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>${booking.estimated_price || booking.final_price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Progress */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                {stageFlow.map((stage, index) => {
                  const StageIcon = stage.icon;
                  const isActive = stage.key === currentStage;
                  const isCompleted = stageFlow.findIndex(s => s.key === currentStage) > index;
                  
                  return (
                    <div key={stage.key} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${isActive ? 'bg-blue-500 text-white' : 
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
                      `}>
                        <StageIcon className="w-4 h-4" />
                      </div>
                      {index < stageFlow.length - 1 && (
                        <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {canProceedToNext() && (
                <Button
                  onClick={() => setShowStageModal(true)}
                  className="flex-1"
                >
                  Update to {nextStageInfo?.title}
                </Button>
              )}
              
              {currentStage === 'work_completed' && canUpdateStage && (
                <Button
                  onClick={handleCompleteJob}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Job
                </Button>
              )}
              
              {currentStage === 'awaiting_payment' && (
                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm text-green-700">
                    Job completed! Waiting for customer payment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra Parts and Notes */}
      {(booking.extra_parts?.length > 0 || booking.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {booking.extra_parts?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Extra Parts Added</h4>
                <div className="space-y-2">
                  {booking.extra_parts.map((part, index) => (
                    <div key={index} className="flex justify-between p-2 bg-yellow-50 rounded border">
                      <span>{part.part_name}</span>
                      <span className="font-medium">${part.total_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {booking.notes && (
              <div>
                <h4 className="font-medium mb-2">Job Notes</h4>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  {booking.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage Update Modal */}
      <StageUpdateModal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        booking={booking}
        currentStage={currentStage}
        onStageUpdate={handleStageUpdate}
      />
    </div>
  );
};

export default ContractorStageManager;