import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Camera, 
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Car,
  Play,
  Upload,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ImageUpload from '@/components/ui/image-upload';

const ContractorActiveJob = ({ job, onUpdateStatus, onAddPart, onReschedule, onComplete, onForfeit }) => {
  const { toast } = useToast();
  const [eta, setEta] = useState('');
  const [showAddPart, setShowAddPart] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showForfeit, setShowForfeit] = useState(false);
  const [partDescription, setPartDescription] = useState('');
  const [partCost, setPartCost] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [forfeitReason, setForfeitReason] = useState('');
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);

  const getStatusProgress = () => {
    const statusMap = {
      'contractor_found': 25,
      'arriving': 50,
      'contractor_arriving': 50,
      'job_started': 75,
      'job_completed': 100
    };
    return statusMap[job.status] || 0;
  };

  const getStatusText = () => {
    const statusText = {
      'contractor_found': 'Job Assigned',
      'arriving': 'En Route to Customer',
      'contractor_arriving': 'En Route to Customer',
      'job_started': 'Job in Progress',
      'job_completed': 'Job Completed'
    };
    return statusText[job.status] || 'Unknown Status';
  };

  const handleMarkArriving = async () => {
    if (!eta) {
      toast({
        title: "ETA Required",
        description: "Please enter your estimated arrival time",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`📤 Marking as arriving with ETA: ${eta}`);
      
      const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/bookings/${job._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'arriving',
          contractorId: job.contractor?.id || job.contractor_id,
          eta: eta
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Arriving status updated:`, result);
        
        onUpdateStatus('arriving', { eta });
        toast({
          title: "Status Updated",
          description: "Customer has been notified you're on the way"
        });
        setEta(''); // Clear ETA input
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Error marking as arriving:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartJob = async () => {
    try {
      console.log(`📤 Starting job with before images:`, beforeImages.length);
      
      const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/bookings/${job._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'job_started',
          contractorId: job.contractor?.id || job.contractor_id,
          beforeImages: beforeImages
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Job started successfully:`, result);
        
        onUpdateStatus('job_started', { beforeImages });
        toast({
          title: "Job Started",
          description: "Job status updated to in progress"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start job');
      }
    } catch (error) {
      console.error('❌ Error starting job:', error);
      toast({
        title: "Error",
        description: "Failed to start job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddPart = async () => {
    if (!partDescription || !partCost) {
      toast({
        title: "Missing Information",
        description: "Please fill in both description and cost",
        variant: "destructive"
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const newPart = {
        name: partDescription.split(' ')[0],
        description: partDescription,
        price: parseFloat(partCost),
        quantity: 1,
        approved_by_customer: false
      };

      const response = await fetch(`${apiUrl}/api/bookings/${job._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: job.status, // Keep current status
          additionalParts: [newPart]
        })
      });

      if (response.ok) {
        onAddPart(newPart);
        toast({
          title: "Part Request Sent",
          description: "Customer will be notified for approval"
        });

        setPartDescription('');
        setPartCost('');
        setShowAddPart(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add part. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleReason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all reschedule fields",
        variant: "destructive"
      });
      return;
    }

    onReschedule(job.id, {
      newDate: rescheduleDate,
      newTime: rescheduleTime,
      reason: rescheduleReason
    });

    toast({
      title: "Reschedule Request Sent",
      description: "Customer will be notified for approval"
    });

    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleReason('');
    setShowReschedule(false);
  };

  const handleCompleteJob = async () => {
    try {
      console.log(`📤 Completing job with after images:`, afterImages.length);
      
      const apiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/bookings/${job._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'job_completed',
          contractorId: job.contractor?.id || job.contractor_id,
          afterImages: afterImages
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Job completed successfully:`, result);
        
        onUpdateStatus('job_completed', { afterImages });
        toast({
          title: "Job Completed",
          description: "Customer can now proceed with payment"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete job');
      }
    } catch (error) {
      console.error('❌ Error completing job:', error);
      toast({
        title: "Error",
        description: "Failed to complete job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleForfeitJob = async () => {
    if (!forfeitReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for forfeiting this job",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`📤 Forfeiting job with reason: ${forfeitReason}`);
      
      // Import api at the top of file
      const api = await import('@/lib/api');
      await api.default.bookings.forfeit(job._id, forfeitReason);
      
      console.log(`✅ Job forfeited successfully`);
      
      onForfeit && onForfeit(job._id, forfeitReason);
      toast({
        title: "Job Forfeited",
        description: "The job has been returned to available jobs for other contractors"
      });
      
      setForfeitReason('');
      setShowForfeit(false);
    } catch (error) {
      console.error('❌ Error forfeiting job:', error);
      toast({
        title: "Error",
        description: "Failed to forfeit job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (type, files) => {
    // Simulate image upload - in real app, upload to cloud storage
    const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
    
    if (type === 'before') {
      setBeforeImages([...beforeImages, ...imageUrls]);
    } else {
      setAfterImages([...afterImages, ...imageUrls]);
    }
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-green-700">Active Job</CardTitle>
          <Badge className="bg-green-600">{getStatusText()}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Job Progress</span>
            <span>{getStatusProgress()}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-2" />
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Service Details</h4>
            <p className="text-sm text-gray-600">Type: {job.serviceType}</p>
            <p className="text-sm text-gray-600">Price: ${job.estimatedPrice}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Location</h4>
            <div className="flex items-start gap-1">
              <MapPin className="w-4 h-4 text-gray-500 mt-1" />
              <div className="text-sm text-gray-600">
                <p>{job.address?.street}, {job.address?.unit}</p>
                <p>Singapore {job.address?.postalCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forfeit Job Button - Available for all statuses except completed */}
        {job.status !== 'job_completed' && (
          <div className="border-t pt-4">
            <Dialog open={showForfeit} onOpenChange={setShowForfeit}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <XCircle className="w-4 h-4 mr-1" />
                  Forfeit Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Forfeit Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This will return the job to available jobs for other contractors. Please provide a reason.
                  </p>
                  <div>
                    <label className="text-sm font-medium">Reason for forfeiting</label>
                    <Textarea
                      placeholder="e.g., Equipment failure, emergency, illness..."
                      value={forfeitReason}
                      onChange={(e) => setForfeitReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowForfeit(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleForfeitJob}
                      className="flex-1"
                    >
                      Confirm Forfeit
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Action Buttons Based on Status */}
        <div className="space-y-3">
          {job.status === 'contractor_found' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="ETA (e.g., 15 mins)"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleMarkArriving} className="bg-blue-600 hover:bg-blue-700">
                  <Car className="w-4 h-4 mr-1" />
                  Mark Arriving
                </Button>
              </div>
            </div>
          )}

          {(job.status === 'arriving') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">ETA: {job.eta}</span>
              </div>
              
              <ImageUpload
                label="Upload 'Before' Images (Optional)"
                images={beforeImages}
                onImagesChange={setBeforeImages}
                maxImages={3}
                bookingId={job._id}
              />

              <Button onClick={handleStartJob} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-1" />
                Start Job
              </Button>
            </div>
          )}

          {job.status === 'job_started' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Dialog open={showAddPart} onOpenChange={setShowAddPart}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Extra Part
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Extra Part</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Part Description</label>
                        <Textarea
                          placeholder="Describe the additional part needed..."
                          value={partDescription}
                          onChange={(e) => setPartDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Additional Cost ($)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={partCost}
                          onChange={(e) => setPartCost(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddPart} className="w-full">
                        Send to Customer for Approval
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Reschedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Reschedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">New Date</label>
                        <Input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">New Time</label>
                        <Input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Reason</label>
                        <Textarea
                          placeholder="Explain why you need to reschedule..."
                          value={rescheduleReason}
                          onChange={(e) => setRescheduleReason(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleReschedule} className="w-full">
                        Send Reschedule Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ImageUpload
                label="Upload 'After' Images (Required for completion)"
                images={afterImages}
                onImagesChange={setAfterImages}
                maxImages={5}
                bookingId={job._id}
              />

              <Button 
                onClick={handleCompleteJob} 
                disabled={afterImages.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Job Completed
              </Button>
            </div>
          )}

          {job.status === 'job_completed' && (
            <div className="text-center py-6 bg-green-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Job Completed!</h3>
              <p className="text-sm text-green-600 mt-1">
                Waiting for customer payment to complete the transaction
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorActiveJob;