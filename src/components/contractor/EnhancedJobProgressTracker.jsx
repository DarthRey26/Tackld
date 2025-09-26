import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { bookingService, jobProgressService, extraPartsService, rescheduleService } from '@/lib/services';
import { 
  Camera, 
  Clock, 
  MapPin, 
  User,
  CheckCircle2,
  AlertCircle,
  Upload,
  Timer,
  Play,
  Pause,
  Trophy,
  DollarSign,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

const PROGRESS_STAGES = [
  { 
    key: 'arriving', 
    title: 'Arriving', 
    description: 'Set ETA and head to location',
    icon: MapPin,
    color: 'blue',
    progress: 10
  },
  { 
    key: 'work_started', 
    title: 'Work Started', 
    description: 'Take before photos and begin work',
    icon: Play,
    color: 'yellow',
    progress: 25
  },
  { 
    key: 'in_progress', 
    title: 'In Progress', 
    description: 'Upload progress photos',
    icon: Pause,
    color: 'orange',
    progress: 60
  },
  { 
    key: 'work_completed', 
    title: 'Work Completed', 
    description: 'Take after photos and complete job',
    icon: CheckCircle2,
    color: 'green',
    progress: 85
  },
  { 
    key: 'awaiting_payment', 
    title: 'Awaiting Payment', 
    description: 'Customer reviewing and processing payment',
    icon: DollarSign,
    color: 'purple',
    progress: 95
  },
  { 
    key: 'paid', 
    title: 'Paid', 
    description: 'Job completed and payment received',
    icon: Trophy,
    color: 'green',
    progress: 100
  }
];

const EnhancedJobProgressTracker = ({ booking, onStatusUpdate }) => {
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState(booking?.current_stage || 'arriving');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [eta, setEta] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoStage, setPhotoStage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extraPartsModal, setExtraPartsModal] = useState(false);
  const [extraParts, setExtraParts] = useState([{ name: '', quantity: 1, cost: 0 }]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    new_date: '',
    new_time: '',
    reason: ''
  });

  // Update current stage based on booking status
  useEffect(() => {
    if (booking?.current_stage) {
      setCurrentStage(booking.current_stage);
      const stage = PROGRESS_STAGES.find(s => s.key === booking.current_stage);
      if (stage) {
        setProgressPercentage(stage.progress);
      }
    }
  }, [booking?.current_stage]);

  const getCurrentStageIndex = () => {
    return PROGRESS_STAGES.findIndex(stage => stage.key === currentStage);
  };

  const getStagePhotoType = (stage) => {
    switch (stage) {
      case 'work_started': return 'before';
      case 'in_progress': return 'during';
      case 'work_completed': return 'after';
      default: return 'during';
    }
  };

  const handleStageUpdate = async (newStage, photoFiles = []) => {
    try {
      const result = await jobProgressService.updateBookingStageWithPhotos(
        booking.id,
        booking.contractor_id,
        newStage,
        photoFiles,
        getStagePhotoType(newStage)
      );

      if (!result.success) throw new Error(result.error);

      setCurrentStage(newStage);
      const stage = PROGRESS_STAGES.find(s => s.key === newStage);
      if (stage) {
        setProgressPercentage(stage.progress);
      }

      toast({
        title: 'Status Updated',
        description: `Job status updated to: ${stage?.title}`,
      });

      onStatusUpdate?.(result.data);

    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job status',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = async (files, stage) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Auto-advance to next stage with photo upload
      const stageIndex = getCurrentStageIndex();
      if (stageIndex < PROGRESS_STAGES.length - 1) {
        const nextStage = PROGRESS_STAGES[stageIndex + 1];
        await handleStageUpdate(nextStage.key, Array.from(files));
      }

      toast({
        title: 'Photos Uploaded',
        description: `${files.length} photo(s) uploaded and stage advanced`,
      });

      setShowPhotoUpload(false);

    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddExtraParts = async () => {
    try {
      const validParts = extraParts.filter(part => part.name.trim() && part.cost > 0);
      
      if (validParts.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one valid part',
          variant: 'destructive',
        });
        return;
      }

      // Create requests for each part using the new service
      for (const part of validParts) {
        const { data, error } = await extraPartsService.createExtraPartsRequest({
          booking_id: booking.id,
          part_name: part.name,
          quantity: part.quantity,
          unit_price: part.cost,
          total_price: part.quantity * part.cost,
          reason: `Requested by contractor during job progress`
        });
        
        if (error) throw error;
      }

      toast({
        title: 'Extra Parts Requested',
        description: 'Request sent to customer for approval',
      });

      setExtraPartsModal(false);
      setExtraParts([{ name: '', quantity: 1, cost: 0 }]);

    } catch (error) {
      console.error('Error adding extra parts:', error);
      toast({
        title: 'Error',
        description: 'Failed to request extra parts',
        variant: 'destructive',
      });
    }
  };

  const addPartRow = () => {
    setExtraParts([...extraParts, { name: '', quantity: 1, cost: 0 }]);
  };

  const updatePart = (index, field, value) => {
    let processedValue = value;
    
    // Handle NaN cases for numeric fields
    if (field === 'quantity') {
      processedValue = parseInt(value) || 1;
    } else if (field === 'cost') {
      processedValue = parseFloat(value) || 0;
    }
    
    const updated = extraParts.map((part, i) => 
      i === index ? { ...part, [field]: processedValue } : part
    );
    setExtraParts(updated);
  };

  const removePart = (index) => {
    setExtraParts(extraParts.filter((_, i) => i !== index));
  };

  const handleRescheduleRequest = async () => {
    try {
      if (!rescheduleData.new_date || !rescheduleData.new_time || !rescheduleData.reason) {
        toast({
          title: 'Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await rescheduleService.createRescheduleRequest({
        booking_id: booking.id,
        new_date: rescheduleData.new_date,
        new_time: rescheduleData.new_time,
        reason: rescheduleData.reason
      });
      
      if (error) throw error;

      toast({
        title: 'Reschedule Requested',
        description: 'Your reschedule request has been sent to the customer',
      });

      setRescheduleModal(false);
      setRescheduleData({ new_date: '', new_time: '', reason: '' });

    } catch (error) {
      console.error('Error requesting reschedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to request reschedule',
        variant: 'destructive',
      });
    }
  };

  const getStageColor = (stage, isCurrent, isPassed) => {
    if (isPassed) return 'bg-green-500 text-white border-green-500';
    if (isCurrent) return `bg-${stage.color}-500 text-white border-${stage.color}-500`;
    return 'bg-gray-200 text-gray-500 border-gray-300';
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl capitalize">
                {booking.service_type} Service - Active Job
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Customer: {booking.customer_name} | Job ID: {booking.id?.slice(-8)}
              </p>
            </div>
            <Badge variant="default" className="bg-blue-600">
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <MapPin className="w-6 h-6 mx-auto text-blue-600 mb-1" />
              <p className="text-sm font-medium">Location</p>
              <p className="text-xs text-gray-600">
                {booking.address?.line1}, {booking.address?.postal_code}
              </p>
            </div>
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto text-green-600 mb-1" />
              <p className="text-sm font-medium">Started</p>
              <p className="text-xs text-gray-600">
                {booking.actual_start ? format(new Date(booking.actual_start), 'HH:mm') : 'Not started'}
              </p>
            </div>
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto text-purple-600 mb-1" />
              <p className="text-sm font-medium">Value</p>
              <p className="text-xs text-gray-600">
                ${booking.estimated_price || booking.final_price}
              </p>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 mx-auto text-orange-600 mb-1" />
              <p className="text-sm font-medium">Contact</p>
              <p className="text-xs text-gray-600">
                {booking.customer_phone || 'Available in job details'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Progress</CardTitle>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{progressPercentage}%</p>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PROGRESS_STAGES.map((stage, index) => {
              const isCurrent = stage.key === currentStage;
              const isPassed = index < currentStageIndex;
              const StageIcon = stage.icon;

              return (
                <div 
                  key={stage.key}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    getStageColor(stage, isCurrent, isPassed)
                  }`}
                >
                  <StageIcon className="w-6 h-6" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{stage.title}</h4>
                    <p className="text-sm opacity-90">{stage.description}</p>
                  </div>
                  
                  {/* Stage-specific actions */}
                  {isCurrent && (
                    <div className="flex gap-2">
                      {stage.key === 'arriving' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="ETA (min)"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                            className="w-24"
                          />
                           <Button
                            size="sm"
                            onClick={() => handleStageUpdate('work_started')}
                            disabled={!eta}
                          >
                            Set ETA & Start
                          </Button>
                        </div>
                      )}
                      
                      {['work_started', 'in_progress', 'work_completed'].includes(stage.key) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPhotoStage(stage.key);
                            setShowPhotoUpload(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Upload Photos
                        </Button>
                      )}
                      
                       {stage.key === 'work_completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStageUpdate('awaiting_payment')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {isPassed && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setExtraPartsModal(true)}
              disabled={currentStage === 'paid'}
            >
              <Plus className="w-4 h-4 mr-1" />
              Request Extra Parts
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setRescheduleModal(true)}
              disabled={currentStage === 'paid'}
            >
              <Clock className="w-4 h-4 mr-1" />
              Request Reschedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload {photoStage.replace('_', ' ')} Photos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photos">Select Photos</Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(Array.from(e.target.files), photoStage)}
                disabled={uploading}
              />
            </div>
            
            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading photos...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra Parts Modal */}
      <Dialog open={extraPartsModal} onOpenChange={setExtraPartsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Extra Parts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {extraParts.map((part, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label>Part Name</Label>
                  <Input
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    placeholder="Part description"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Cost ($)</Label>
                  <Input
                    type="number"
                    value={part.cost}
                    onChange={(e) => updatePart(index, 'cost', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePart(index)}
                    disabled={extraParts.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addPartRow}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another Part
            </Button>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setExtraPartsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExtraParts}>
                Send Request to Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Request Modal */}
      <Dialog open={rescheduleModal} onOpenChange={setRescheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleData.new_date}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, new_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="reschedule-time">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleData.new_time}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, new_time: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="reschedule-reason">Reason for Reschedule</Label>
              <Textarea
                id="reschedule-reason"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please explain why you need to reschedule..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRescheduleRequest}>
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedJobProgressTracker;