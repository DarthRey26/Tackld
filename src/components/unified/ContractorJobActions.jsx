import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  DollarSign,
  CalendarDays
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { bookingService, extraPartsService, rescheduleService } from '@/lib/services';

const ContractorJobActions = ({ 
  job, 
  onJobUpdate, 
  onAddParts, 
  onReschedule, 
  onComplete, 
  onForfeit 
}) => {
  const { toast } = useToast();
  const [showExtraPartsDialog, setShowExtraPartsDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  
  const [extraParts, setExtraParts] = useState([
    { name: '', cost: '', description: '' }
  ]);
  
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });
  
  const [completionData, setCompletionData] = useState({
    afterImages: [],
    workSummary: '',
    recommendations: ''
  });

  const handleAddExtraParts = async () => {
    try {
      const validParts = extraParts.filter(part => part.name && part.cost);
      
      if (validParts.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one valid part",
          variant: "destructive"
        });
        return;
      }

      // Create requests for each part using the new service
      for (const part of validParts) {
        const { data, error } = await extraPartsService.createExtraPartsRequest({
          booking_id: job.id || job._id,
          part_name: part.name,
          quantity: 1,
          unit_price: parseFloat(part.cost),
          total_price: parseFloat(part.cost),
          reason: part.description || 'Additional part required'
        });
        
        if (error) throw error;
      }

      toast({
        title: "Extra Parts Requested",
        description: "Your request has been sent to the customer for approval"
      });
      
      setShowExtraPartsDialog(false);
      setExtraParts([{ name: '', cost: '', description: '' }]);
      onAddParts(response);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to request extra parts",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = async () => {
    try {
      if (!rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.reason) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await rescheduleService.createRescheduleRequest({
        booking_id: job.id || job._id,
        new_date: rescheduleData.newDate,
        new_time: rescheduleData.newTime,
        reason: rescheduleData.reason
      });
      if (error) throw error;

      toast({
        title: "Reschedule Requested",
        description: "Your reschedule request has been sent to the customer"
      });
      
      setShowRescheduleDialog(false);
      setRescheduleData({ newDate: '', newTime: '', reason: '' });
      onReschedule(response);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to request reschedule",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async () => {
    try {
      if (completionData.afterImages.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one 'after' image",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await bookingService.completeBooking(job._id, {
        afterImages: completionData.afterImages,
        workSummary: completionData.workSummary,
        recommendations: completionData.recommendations,
        completedAt: new Date().toISOString()
      });
      if (error) throw error;

      toast({
        title: "Job Completed",
        description: "Job marked as completed successfully"
      });
      
      setShowCompletionDialog(false);
      onComplete(response);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete job",
        variant: "destructive"
      });
    }
  };

  const handleForfeit = async () => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to forfeit this job? This action cannot be undone."
      );
      
      if (!confirmed) return;

      const { data, error } = await bookingService.forfeitBooking(job._id, {
        forfeitedAt: new Date().toISOString(),
        reason: "Contractor forfeited"
      });
      if (error) throw error;

      toast({
        title: "Job Forfeited",
        description: "You have forfeited this job"
      });
      
      onForfeit(response);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to forfeit job",
        variant: "destructive"
      });
    }
  };

  const addExtraPartRow = () => {
    setExtraParts([...extraParts, { name: '', cost: '', description: '' }]);
  };

  const updateExtraPart = (index, field, value) => {
    const updated = [...extraParts];
    updated[index][field] = value;
    setExtraParts(updated);
  };

  const removeExtraPartRow = (index) => {
    setExtraParts(extraParts.filter((_, i) => i !== index));
  };

  const getJobStatusBadge = () => {
    switch (job.status) {
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{job.status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Job Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Status</span>
            {getJobStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Service:</span> {job.serviceType}
            </div>
            <div>
              <span className="font-medium">Amount:</span> ${job.amount}
            </div>
            <div>
              <span className="font-medium">Scheduled:</span> {job.scheduledDate} at {job.scheduledTime}
            </div>
            <div>
              <span className="font-medium">Customer:</span> {job.customerName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Extra Parts Request */}
        <Dialog open={showExtraPartsDialog} onOpenChange={setShowExtraPartsDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Request Extra Parts
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Additional Parts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {extraParts.map((part, index) => (
                <div key={index} className="space-y-2 p-3 border rounded">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Part name"
                      value={part.name}
                      onChange={(e) => updateExtraPart(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={part.cost}
                      onChange={(e) => updateExtraPart(index, 'cost', e.target.value)}
                      className="w-24"
                    />
                  </div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={part.description}
                    onChange={(e) => updateExtraPart(index, 'description', e.target.value)}
                    rows={2}
                  />
                  {extraParts.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExtraPartRow(index)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={addExtraPartRow}>
                  Add Another Part
                </Button>
                <Button onClick={handleAddExtraParts} className="flex-1">
                  Send Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reschedule Request */}
        <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Request Reschedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Reschedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Date</label>
                <Input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Time</label>
                <Input
                  type="time"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, newTime: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Reschedule</label>
                <Textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you need to reschedule..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleReschedule} className="w-full">
                Send Reschedule Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete Job */}
        <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Complete Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Complete Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ImageUpload
                label="After Images (Required)"
                images={completionData.afterImages}
                onImagesChange={(images) => setCompletionData(prev => ({ ...prev, afterImages: images }))}
                maxImages={5}
                folder="completed-jobs"
                required
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Work Summary</label>
                <Textarea
                  value={completionData.workSummary}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, workSummary: e.target.value }))}
                  placeholder="Briefly describe the work completed..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Recommendations (Optional)</label>
                <Textarea
                  value={completionData.recommendations}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Any maintenance recommendations or future work suggestions..."
                  rows={2}
                />
              </div>
              
              <Button onClick={handleComplete} className="w-full">
                Mark as Completed
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Forfeit Job */}
        <Button
          variant="destructive"
          onClick={handleForfeit}
          className="flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Forfeit Job
        </Button>
      </div>
    </div>
  );
};

export default ContractorJobActions;