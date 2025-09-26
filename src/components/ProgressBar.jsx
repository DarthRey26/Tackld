import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  UserCheck, 
  Truck, 
  Play, 
  CheckCircle, 
  CreditCard,
  Upload,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PROGRESS_STAGES = [
  {
    id: 'finding_contractor',
    label: 'Finding Contractor',
    icon: Search,
    description: 'We are searching for available contractors in your area'
  },
  {
    id: 'contractor_found',
    label: 'Contractor Found',
    icon: UserCheck,
    description: 'A contractor has been assigned to your job'
  },
  {
    id: 'arriving',
    label: 'Contractor Arriving',
    icon: Truck,
    description: 'Your contractor is on the way to your location'
  },
  {
    id: 'job_started',
    label: 'Job Started',
    icon: Play,
    description: 'Work has begun on your service request'
  },
  {
    id: 'job_completed',
    label: 'Job Completed',
    icon: CheckCircle,
    description: 'The work has been completed successfully'
  },
  {
    id: 'payment_settled',
    label: 'Payment Settled',
    icon: CreditCard,
    description: 'Payment has been processed and job is complete'
  }
];

const ProgressBar = ({ 
  currentStage, 
  stagePhotos = {}, 
  contractor = null, 
  userType = 'customer',
  onStageUpdate,
  onPhotoUpload 
}) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const getCurrentStageIndex = () => {
    return PROGRESS_STAGES.findIndex(stage => stage.id === currentStage);
  };

  const progressPercentage = ((getCurrentStageIndex() + 1) / PROGRESS_STAGES.length) * 100;

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
  };

  const handlePhotoUpload = async (stageId, file) => {
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      // Convert file to base64 for demo
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoUpload?.(stageId, reader.result);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingPhoto(false);
      console.error('Failed to upload photo:', error);
    }
  };

  const canUpdateStage = (stageIndex) => {
    const currentIndex = getCurrentStageIndex();
    return userType === 'contractor' && stageIndex === currentIndex + 1;
  };

  return (
    <Card className="w-full mb-6">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Job Progress</h3>
            <Badge variant="outline" className="text-green-600 border-green-600">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-4" />
        </div>

        <div className="grid grid-cols-6 gap-2 mb-4">
          {PROGRESS_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index <= getCurrentStageIndex();
            const isCurrent = index === getCurrentStageIndex();
            const hasPhoto = stagePhotos[stage.id]?.length > 0;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => handleStageClick(stage)}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                          ? 'bg-blue-500 text-white animate-pulse' 
                          : 'bg-gray-200 text-gray-500'
                      } hover:scale-110`}
                    >
                      <Icon size={20} />
                      {hasPhoto && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <Eye size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Icon size={20} />
                        {stage.label}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">{stage.description}</p>
                      
                      {stagePhotos[stage.id]?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Photos:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {stagePhotos[stage.id].map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`${stage.label} photo ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {userType === 'contractor' && index <= getCurrentStageIndex() + 1 && (
                        <div>
                          <h4 className="font-semibold mb-2">Upload Photo:</h4>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(stage.id, e.target.files[0])}
                            className="w-full p-2 border rounded"
                            disabled={uploadingPhoto}
                          />
                        </div>
                      )}

                      {canUpdateStage(index) && (
                        <Button
                          onClick={() => onStageUpdate?.(stage.id)}
                          className="w-full"
                        >
                          Mark as {stage.label}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <span className={`text-xs text-center leading-tight ${
                  isCurrent ? 'font-semibold text-blue-600' : 'text-gray-500'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {contractor && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Your Contractor</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {contractor.name?.charAt(0) || 'C'}
              </div>
              <div>
                <p className="font-medium">{contractor.name}</p>
                <p className="text-sm text-gray-600">
                  ⭐ {contractor.rating || 'N/A'} • {contractor.experience || ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressBar;