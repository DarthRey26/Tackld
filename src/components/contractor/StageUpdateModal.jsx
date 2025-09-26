import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Clock, Camera, CheckCircle } from 'lucide-react';
import { storageService, jobProgressService } from '@/lib/services';

const StageUpdateModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  currentStage, 
  onStageUpdate 
}) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    eta_minutes: '',
    notes: '',
    photos: []
  });

  const getStageInfo = (stage) => {
    const stageConfig = {
      'arriving': {
        title: 'Update Arrival Time',
        description: 'Let the customer know when you\'ll arrive',
        icon: Clock,
        fields: ['eta'],
        nextStage: 'work_started'
      },
      'work_started': {
        title: 'Work Started',
        description: 'Upload before photos and mark work as started',
        icon: Camera,
        fields: ['photos', 'notes'],
        nextStage: 'in_progress',
        photoType: 'before'
      },
      'in_progress': {
        title: 'Progress Update',
        description: 'Upload progress photos',
        icon: Camera,
        fields: ['photos', 'notes'],
        nextStage: 'work_completed',
        photoType: 'during'
      },
      'work_completed': {
        title: 'Work Completed',
        description: 'Upload after photos and mark work as completed',
        icon: CheckCircle,
        fields: ['photos', 'notes'],
        nextStage: 'awaiting_payment',
        photoType: 'after'
      }
    };

    return stageConfig[stage] || {
      title: 'Update Status',
      description: 'Update job status',
      icon: CheckCircle,
      fields: [],
      nextStage: stage
    };
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setUpdating(true);
      const uploadPromises = files.map(file => 
        storageService.uploadJobPhoto(file, booking.id)
      );
      
      const photoUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...photoUrls]
      }));
      
      toast({
        title: 'Photos uploaded',
        description: `${files.length} photo(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async () => {
    const stageInfo = getStageInfo(currentStage);
    
    try {
      setUpdating(true);
      
      // Prepare update data
      const updateData = {
        notes: formData.notes,
        photos: formData.photos,
        eta_minutes: formData.eta_minutes ? parseInt(formData.eta_minutes) : undefined
      };

      // Update stage with photos using jobProgressService
      let result;
      if (formData.photos.length > 0) {
        // Convert photo URLs back to file objects if needed, or just update stage
        result = await jobProgressService.updateJobStage(
          booking.id,
          booking.contractor_id,
          stageInfo.nextStage
        );
      } else {
        result = await jobProgressService.updateJobStage(
          booking.id,
          booking.contractor_id,
          stageInfo.nextStage
        );
      }

      if (result.error) throw result.error;

      toast({
        title: 'Status updated',
        description: `Job stage updated to ${stageInfo.nextStage}`,
      });

      // Call parent callback
      if (onStageUpdate) {
        onStageUpdate(stageInfo.nextStage, updateData);
      }

      // Reset form and close
      setFormData({ eta_minutes: '', notes: '', photos: [] });
      onClose();
      
    } catch (error) {
      console.error('Stage update error:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update job stage',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  if (!booking || !currentStage) return null;

  const stageInfo = getStageInfo(currentStage);
  const StageIcon = stageInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StageIcon className="w-5 h-5" />
            {stageInfo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{stageInfo.description}</p>

          {/* ETA Input */}
          {stageInfo.fields.includes('eta') && (
            <div className="space-y-2">
              <Label htmlFor="eta">Estimated arrival time (minutes)</Label>
              <Input
                id="eta"
                type="number"
                placeholder="e.g., 15"
                value={formData.eta_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, eta_minutes: e.target.value }))}
              />
            </div>
          )}

          {/* Photo Upload */}
          {stageInfo.fields.includes('photos') && (
            <div className="space-y-2">
              <Label>Upload Photos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={updating}
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload {stageInfo.photoType} photos
                  </p>
                </label>
              </div>
              
              {/* Preview uploaded photos */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {stageInfo.fields.includes('notes') && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for the customer..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updating}
              className="flex-1"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StageUpdateModal;