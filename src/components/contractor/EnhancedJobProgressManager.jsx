import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, User, Phone, Mail, Upload, AlertTriangle, Calendar, Camera, Package, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { bookingService } from '@/lib/services/bookingService';
import { storageService } from '@/lib/services/storageService';
import { extraPartsService } from '@/lib/services/extraPartsService';
import { rescheduleService } from '@/lib/services/rescheduleService';
import { toast } from 'sonner';

const EnhancedJobProgressManager = ({ job, onJobUpdate }) => {
  const [etaMinutes, setEtaMinutes] = useState(30);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partReason, setPartReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoStage, setPhotoStage] = useState('before');
  const [extraParts, setExtraParts] = useState([]);

  const getProgressPercentage = () => {
    const beforePhotos = job.before_photos?.length || 0;
    const duringPhotos = job.during_photos?.length || 0;
    const afterPhotos = job.after_photos?.length || 0;
    
    switch (job.status) {
      case 'contractor_found':
      case 'assigned':
        return 10;
      case 'arriving':
        return 25;
      case 'job_started':
        return beforePhotos > 0 ? 40 : 30;
      case 'in_progress':
        return duringPhotos > 0 ? 70 : 60;
      case 'completed':
        return afterPhotos > 0 ? 95 : 85;
      case 'awaiting_payment':
        return 98;
      case 'paid':
        return 100;
      default:
        return 0;
    }
  };

  const handleSetETA = async () => {
    if (!etaMinutes || etaMinutes < 5) {
      toast.error('Please enter a valid ETA (minimum 5 minutes)');
      return;
    }
    
    try {
      await bookingService.updateBookingStatus(job.id, 'arriving', { eta_minutes: etaMinutes });
      toast.success(`ETA set to ${etaMinutes} minutes`);
      onJobUpdate();
    } catch (error) {
      console.error('Set ETA error:', error);
      toast.error('Failed to set ETA');
    }
  };

  const handleMarkStarted = async () => {
    try {
      await bookingService.updateBookingStatus(job.id, 'job_started');
      toast.success('Job marked as started');
      onJobUpdate();
    } catch (error) {
      console.error('Mark started error:', error);
      toast.error('Failed to mark job as started');
    }
  };

  const handleUploadPhotos = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const photoUrls = [];
      
      for (const file of files) {
        const { data, error } = await storageService.uploadJobPhoto(file, job.id);
        if (error) throw error;
        photoUrls.push(data.publicUrl);
      }

      // Upload photos and update progress
      for (const photoUrl of photoUrls) {
        await bookingService.uploadProgressPhoto(job.id, photoStage, photoUrl);
      }
      
      toast.success(`${photoStage} photos uploaded successfully!`);
      onJobUpdate();
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleAddExtraPart = async () => {
    if (!partName || !partPrice) return;
    
    try {
      const { data, error } = await extraPartsService.createExtraPartsRequest({
        booking_id: job.id,
        part_name: partName,
        quantity: 1,
        unit_price: parseFloat(partPrice),
        total_price: parseFloat(partPrice),
        reason: partReason || 'Additional part required for job completion'
      });
      
      if (error) throw error;
      
      setPartName('');
      setPartPrice('');
      setPartReason('');
      setExtraParts([...extraParts, { name: partName, price: parseFloat(partPrice), reason: partReason }]);
      toast.success('Extra part request submitted');
      onJobUpdate();
    } catch (error) {
      console.error('Add extra part error:', error);
      toast.error('Failed to add extra part');
    }
  };

  const handleRequestReschedule = async () => {
    if (!rescheduleDate || !rescheduleReason) {
      toast.error('Please fill in all reschedule fields');
      return;
    }
    
    try {
      const { data, error } = await rescheduleService.createRescheduleRequest({
        booking_id: job.id,
        new_date: rescheduleDate,
        new_time: '09:00', // Default time, could be made configurable
        reason: rescheduleReason
      });
      
      if (error) throw error;
      
      toast.success('Reschedule request submitted');
      setRescheduleDate('');
      setRescheduleReason('');
      onJobUpdate();
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error('Failed to request reschedule');
    }
  };

  const handleCompleteJob = async () => {
    try {
      await bookingService.completeBooking(job.id);
      toast.success('Job marked as completed! Awaiting payment approval.');
      onJobUpdate();
    } catch (error) {
      console.error('Complete job error:', error);
      toast.error('Failed to complete job');
    }
  };

  const handleForfeitJob = async () => {
    if (window.confirm('Are you sure you want to forfeit this job? This action cannot be undone.')) {
      try {
        await bookingService.forfeitJob(job.id, 'Contractor forfeited');
        toast.success('Job forfeited and returned to available pool');
        onJobUpdate();
      } catch (error) {
        console.error('Forfeit error:', error);
        toast.error('Failed to forfeit job');
      }
    }
  };

  const canUploadStage = (stage) => {
    if (stage === 'before') return job.status === 'arriving' || job.status === 'job_started';
    if (stage === 'during') return job.status === 'job_started' || job.status === 'in_progress';
    if (stage === 'after') return job.status === 'in_progress' || job.status === 'completed';
    return false;
  };

  if (!job) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Job Progress</div>
          <Badge variant="outline" className="capitalize">
            {job.status?.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Job Progress</h3>
            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
              {job.status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
          
          <Progress value={getProgressPercentage()} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {getProgressPercentage()}% Complete
          </p>
          
          {/* Photo Progress Indicators */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded text-center ${(job.before_photos?.length || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              Before: {job.before_photos?.length || 0}
            </div>
            <div className={`p-2 rounded text-center ${(job.during_photos?.length || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              During: {job.during_photos?.length || 0}
            </div>
            <div className={`p-2 rounded text-center ${(job.after_photos?.length || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              After: {job.after_photos?.length || 0}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {job.status === 'contractor_found' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Set ETA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Arrival Time</DialogTitle>
                  <DialogDescription>
                    Let the customer know when you expect to arrive
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eta">ETA (minutes)</Label>
                    <Input
                      id="eta"
                      type="number"
                      value={etaMinutes}
                      onChange={(e) => setEtaMinutes(parseInt(e.target.value) || 0)}
                      min="5"
                      max="120"
                    />
                  </div>
                  <Button onClick={handleSetETA} className="w-full">
                    Confirm ETA
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {job.status === 'arriving' && (
            <Button 
              size="sm" 
              onClick={handleMarkStarted}
            >
              Mark as Started
            </Button>
          )}

          {/* Photo Upload */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!canUploadStage(photoStage)}>
                <Camera className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Job Photos</DialogTitle>
                <DialogDescription>
                  Upload photos to track job progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photoStage">Photo Stage</Label>
                  <Select value={photoStage} onValueChange={setPhotoStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before" disabled={!canUploadStage('before')}>
                        Before (Job Start)
                      </SelectItem>
                      <SelectItem value="during" disabled={!canUploadStage('during')}>
                        During (In Progress)
                      </SelectItem>
                      <SelectItem value="after" disabled={!canUploadStage('after')}>
                        After (Completion)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleUploadPhotos(Array.from(e.target.files))}
                  disabled={uploading}
                />
                <Button 
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  disabled={uploading || !canUploadStage(photoStage)}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : 'Select Photos'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {(job.status === 'job_started' || job.status === 'in_progress') && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Add Parts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Additional Parts</DialogTitle>
                    <DialogDescription>
                      Request additional parts or materials needed for the job
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="partName">Part Name</Label>
                      <Input
                        id="partName"
                        value={partName}
                        onChange={(e) => setPartName(e.target.value)}
                        placeholder="e.g., Replacement valve"
                      />
                    </div>
                    <div>
                      <Label htmlFor="partPrice">Price ($)</Label>
                      <Input
                        id="partPrice"
                        type="number"
                        step="0.01"
                        value={partPrice}
                        onChange={(e) => setPartPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="partReason">Reason</Label>
                      <Textarea
                        id="partReason"
                        value={partReason}
                        onChange={(e) => setPartReason(e.target.value)}
                        placeholder="Explain why this part is needed"
                      />
                    </div>
                    <Button onClick={handleAddExtraPart} className="w-full">
                      Request Part
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {job.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  onClick={handleCompleteJob}
                >
                  Complete Job
                </Button>
              )}
            </>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Reschedule</DialogTitle>
                <DialogDescription>
                  Request to reschedule this job to a different date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rescheduleDate">New Date</Label>
                  <Input
                    id="rescheduleDate"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rescheduleReason">Reason</Label>
                  <Textarea
                    id="rescheduleReason"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Explain why you need to reschedule"
                  />
                </div>
                <Button onClick={handleRequestReschedule} className="w-full">
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleForfeitJob}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Forfeit Job
          </Button>
        </div>

        <Separator />

        {/* Job Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{job.address?.line1}</p>
              {job.address?.line2 && <p className="text-sm text-muted-foreground">{job.address?.line2}</p>}
              <p className="text-sm text-muted-foreground">Singapore {job.address?.postal_code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{job.customer_name}</span>
          </div>

          {job.customer_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{job.customer_phone}</span>
            </div>
          )}

          {job.customer_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{job.customer_email}</span>
            </div>
          )}

          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Job Value: ${job.estimated_price || job.final_price || 'TBD'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedJobProgressManager;