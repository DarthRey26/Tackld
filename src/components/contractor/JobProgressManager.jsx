import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  MapPin, 
  Camera, 
  Clock, 
  PlayCircle, 
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react';

const JobProgressManager = ({ job, onStatusUpdate, onComplete }) => {
  const { toast } = useToast();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState([]);
  const [stageNotes, setStageNotes] = useState('');
  const [showExtraPartsDialog, setShowExtraPartsDialog] = useState(false);
  const [extraParts, setExtraParts] = useState([]);
  const [newPart, setNewPart] = useState({ name: '', quantity: 1, price: '', reason: '' });

  const getNextStage = () => {
    switch (job.status) {
      case 'assigned':
      case 'contractor_found':
        return { key: 'arriving', title: 'Mark as Arriving', icon: MapPin };
      case 'arriving':
        return { key: 'started', title: 'Start Job', icon: PlayCircle };
      case 'started':
      case 'in_progress':
        return { key: 'completed', title: 'Complete Job', icon: CheckCircle };
      default:
        return null;
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map(file => {
      const url = URL.createObjectURL(file);
      return { file, url, uploaded: false };
    });
    setUploadingPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setUploadingPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const simulatePhotoUpload = async (photos) => {
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock uploaded URLs
    return photos.map((photo, index) => ({
      url: `/api/placeholder/job-photo-${Date.now()}-${index}.jpg`,
      caption: `Job progress photo ${index + 1}`
    }));
  };

  const handleStageUpdate = async () => {
    const nextStage = getNextStage();
    if (!nextStage) return;

    try {
      let photoUrls = [];
      
      // Handle photo uploads if any
      if (uploadingPhotos.length > 0) {
        toast({
          title: "Uploading Photos",
          description: "Please wait while photos are being uploaded...",
        });
        
        photoUrls = await simulatePhotoUpload(uploadingPhotos);
        
        // Clean up object URLs
        uploadingPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
      }

      const updateData = {
        current_stage: nextStage.key,
        progress: {
          ...job.progress,
          [nextStage.key]: {
            timestamp: new Date().toISOString(),
            notes: stageNotes,
            photos: photoUrls
          }
        }
      };

      await onStatusUpdate(nextStage.key, updateData);
      
      // Reset form
      setUploadingPhotos([]);
      setStageNotes('');
      setShowPhotoUpload(false);

      toast({
        title: "Status Updated",
        description: `Job status updated to ${nextStage.title}`,
      });

    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const handleAddExtraPart = () => {
    if (!newPart.name || !newPart.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in part name and price",
        variant: "destructive",
      });
      return;
    }

    setExtraParts(prev => [...prev, { ...newPart, id: Date.now() }]);
    setNewPart({ name: '', quantity: 1, price: '', reason: '' });
  };

  const handleRequestExtraParts = async () => {
    if (extraParts.length === 0) return;

    try {
      // Simulate API call to request extra parts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Extra Parts Requested",
        description: `${extraParts.length} additional parts have been requested for customer approval.`,
      });
      
      setExtraParts([]);
      setShowExtraPartsDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request extra parts",
        variant: "destructive",
      });
    }
  };

  const nextStage = getNextStage();
  const StageIcon = nextStage?.icon;

  return (
    <div className="space-y-4">
      {/* Current Job Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Progress</span>
            <Badge variant="secondary" className="capitalize">
              {job.status.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Service Details</h4>
              <p className="text-sm text-gray-600 capitalize">{job.service_type} Service</p>
              <p className="text-sm text-gray-600">{job.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Customer Information</h4>
              <p className="text-sm text-gray-600">{job.customer_name}</p>
              <p className="text-sm text-gray-600">{job.customer_phone}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Location</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">
                {typeof job.address === 'string' 
                  ? job.address
                  : `${job.address?.line1}, ${job.address?.postal_code}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {nextStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StageIcon className="w-5 h-5" />
              Next Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Stage Notes (Optional)
              </label>
              <Textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder={`Add notes for ${nextStage.title.toLowerCase()}...`}
                rows={2}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Progress Photos
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhotoUpload(true)}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Add Photos
                </Button>
              </div>
              
              {uploadingPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadingPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExtraPartsDialog(true)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Request Extra Parts
              </Button>
              
              <Button
                onClick={handleStageUpdate}
                className="flex-1"
              >
                <StageIcon className="w-4 h-4 mr-1" />
                {nextStage.title}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Progress Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to select photos</p>
                <p className="text-xs text-gray-500">Support multiple files</p>
              </label>
            </div>
            
            <Button onClick={() => setShowPhotoUpload(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra Parts Dialog */}
      <Dialog open={showExtraPartsDialog} onOpenChange={setShowExtraPartsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Additional Parts</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add New Part Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Part</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Part Name</label>
                    <Input
                      value={newPart.name}
                      onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Air Filter"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={newPart.quantity}
                        onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPart.price}
                        onChange={(e) => setNewPart(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Additional Part</label>
                  <Textarea
                    value={newPart.reason}
                    onChange={(e) => setNewPart(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why this part is needed..."
                    rows={2}
                  />
                </div>
                
                <Button onClick={handleAddExtraPart} className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Part
                </Button>
              </CardContent>
            </Card>

            {/* Parts List */}
            {extraParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parts to Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extraParts.map((part) => (
                      <div key={part.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-gray-600">{part.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(part.price * part.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Qty: {part.quantity}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExtraParts(prev => prev.filter(p => p.id !== part.id))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Additional Cost:</span>
                      <span>${extraParts.reduce((total, part) => total + (part.price * part.quantity), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExtraPartsDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              {extraParts.length > 0 && (
                <Button
                  onClick={handleRequestExtraParts}
                  className="flex-1"
                >
                  Request Parts Approval
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobProgressManager;