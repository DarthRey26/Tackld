
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, DollarSign, Clock, Wrench, Calendar, Plus, AlertTriangle, Camera, Check, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const JobStages = {
  ARRIVAL: { id: 'arrival', name: 'Arrival Confirmation', progress: 25 },
  MIDWAY: { id: 'midway', name: 'Midway Check-in', progress: 50 },
  COMPLETION: { id: 'completion', name: 'Completion Check', progress: 75 },
  PAYMENT: { id: 'payment', name: 'Payment Confirmation', progress: 100 }
};

const OngoingJob = ({ job, onComplete, onCancel }) => {
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isAddingParts, setIsAddingParts] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [additionalParts, setAdditionalParts] = useState([]);
  const [newPart, setNewPart] = useState({ name: '', price: '' });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [uploadedImages, setUploadedImages] = useState({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [autoUpdating, setAutoUpdating] = useState(false);
  
  useEffect(() => {
    // Initialize from job data if available
    if (job) {
      setProgress(job.progress || 0);
      // Get wallet balance (in a real app, this would come from the server)
      const storedBalance = localStorage.getItem('contractorWalletBalance') || '0';
      setWalletBalance(parseFloat(storedBalance));
    }
  }, [job]);
  
  const handleStageComplete = (stage) => {
    setCurrentStage(stage);
    setVerificationStatus(prev => ({ ...prev, [stage.id]: 'pending' }));
    
    // Simulate upload if there's an image
    if (uploadedImages[stage.id]) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        simulateVerification(stage);
      }, 2000);
    } else {
      simulateVerification(stage);
    }
  };
  
  const simulateVerification = (stage) => {
    // Show verification in progress
    toast({
      title: "Verification in Progress",
      description: "Customer is verifying your update...",
    });
    
    // After 5 seconds, update status to verified
    setAutoUpdating(true);
    setTimeout(() => {
      setVerificationStatus(prev => ({ ...prev, [stage.id]: 'verified' }));
      setProgress(stage.progress);
      
      if (stage.progress === 100) {
        // Process payment
        const jobTotal = job.price + additionalParts.reduce((sum, part) => sum + Number(part.price), 0);
        const newBalance = walletBalance + jobTotal;
        setWalletBalance(newBalance);
        localStorage.setItem('contractorWalletBalance', newBalance.toString());
        
        // Show payment confirmation
        toast({
          title: "Payment Released",
          description: `$${jobTotal.toFixed(2)} has been added to your wallet!`,
          variant: "success",
        });
        
        // Wait before completing the job
        setTimeout(() => {
          onComplete({
            ...job, 
            additionalParts,
            totalPaid: jobTotal,
            completedAt: new Date().toLocaleDateString()
          });
        }, 1500);
      } else {
        toast({
          title: `${stage.name} Verified`,
          description: `Moving to next stage: ${getNextStage(stage).name}`,
          variant: "success",
        });
      }
      setAutoUpdating(false);
    }, 5000);
  };
  
  const getNextStage = (stage) => {
    if (stage.id === 'arrival') return JobStages.MIDWAY;
    if (stage.id === 'midway') return JobStages.COMPLETION;
    if (stage.id === 'completion') return JobStages.PAYMENT;
    return null;
  };
  
  const handleImageUpload = (stage) => {
    // Simulate image upload with a random image URL
    // In a real app, this would be an actual upload
    const randomImage = `https://source.unsplash.com/random/300x200?service&${Math.random()}`;
    setUploadedImages(prev => ({ ...prev, [stage]: randomImage }));
    
    toast({
      title: "Image Uploaded",
      description: "Your proof image has been successfully uploaded.",
    });
  };
  
  const handleAddPart = () => {
    if (!newPart.name || !newPart.price) return;
    setAdditionalParts([...additionalParts, newPart]);
    setNewPart({ name: '', price: '' });
    toast({
      title: "Part Added",
      description: `${newPart.name} has been added to the job.`,
    });
    setIsAddingParts(false);
  };
  
  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleReason) return;
    toast({
      title: "Job Rescheduled",
      description: `Job has been rescheduled to ${rescheduleDate}.`,
    });
    setIsRescheduling(false);
  };
  
  const handleCancelConfirm = () => {
    if (!cancelReason) return;
    toast({
      title: "Job Cancelled",
      description: "The job has been cancelled successfully.",
      variant: "destructive",
    });
    setIsCancelling(false);
    onCancel(job.id);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-600 flex justify-between items-center">
            <span>Current Job</span>
            <Badge className="bg-green-500">In Progress</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{job.service}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>{job.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Date: {job.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <DollarSign className="h-4 w-4" />
              <span>Agreed price: ${job.price}</span>
            </div>
            {additionalParts.length > 0 && (
              <div className="mt-2">
                <h4 className="font-medium text-sm">Additional Parts:</h4>
                <ul className="text-sm pl-4">
                  {additionalParts.map((part, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{part.name}</span>
                      <span className="font-medium">${part.price}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-medium text-sm mt-1">
                  <span>Total Job Amount:</span>
                  <span>${job.price + additionalParts.reduce((sum, part) => sum + Number(part.price), 0)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className={`w-full h-2 ${autoUpdating ? 'animate-pulse bg-blue-200' : ''}`} />
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.values(JobStages).map((stage) => (
                <div key={stage.id} className="flex flex-col space-y-1">
                  <Button
                    onClick={() => handleStageComplete(stage)}
                    variant={progress >= stage.progress ? "default" : "outline"}
                    disabled={
                      (progress === 0 && stage.id !== 'arrival') || 
                      (progress < stage.progress - 25 && progress !== 0) ||
                      verificationStatus[stage.id] === 'pending' ||
                      autoUpdating
                    }
                    className="flex flex-col items-center p-2 h-auto relative"
                  >
                    {verificationStatus[stage.id] === 'pending' && (
                      <Loader2 className="h-4 w-4 absolute top-1 right-1 animate-spin text-yellow-500" />
                    )}
                    {verificationStatus[stage.id] === 'verified' && (
                      <Check className="h-4 w-4 absolute top-1 right-1 text-green-500" />
                    )}
                    <span className="text-xs">{stage.name}</span>
                    <span className="text-lg font-bold">{stage.progress}%</span>
                  </Button>
                  
                  {/* Photo upload button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs"
                    onClick={() => handleImageUpload(stage.id)}
                    disabled={
                      (progress === 0 && stage.id !== 'arrival') || 
                      (progress < stage.progress - 25 && progress !== 0) ||
                      verificationStatus[stage.id] === 'pending' ||
                      autoUpdating
                    }
                  >
                    <Camera className="h-3 w-3" /> 
                    {uploadedImages[stage.id] ? 'Change Photo' : 'Add Photo'}
                  </Button>
                  
                  {/* Show image preview if uploaded */}
                  {uploadedImages[stage.id] && (
                    <div className="relative h-20 mt-1 rounded overflow-hidden">
                      <img 
                        src={uploadedImages[stage.id]} 
                        alt={`Proof for ${stage.name}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddingParts(true)}
              className="flex items-center gap-1"
              disabled={autoUpdating}
            >
              <Plus className="h-4 w-4" /> Add Parts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsRescheduling(true)}
              className="flex items-center gap-1"
              disabled={autoUpdating}
            >
              <Calendar className="h-4 w-4" /> Reschedule
            </Button>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsCancelling(true)}
            className="flex items-center gap-1"
            disabled={autoUpdating}
          >
            <AlertTriangle className="h-4 w-4" /> Cancel
          </Button>
        </CardFooter>
      </Card>
      
      {/* Wallet and Earnings Card */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="text-lg font-bold text-green-600">Wallet & Earnings</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Current Balance:</span>
            </div>
            <span className="text-xl font-bold text-green-600">${walletBalance.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-500 border-t pt-2 mt-2">
            <p>Potential earnings from this job: ${(job.price + additionalParts.reduce((sum, part) => sum + Number(part.price), 0)).toFixed(2)}</p>
            <p className="mt-1">Funds are released after job completion and customer verification.</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Parts Dialog */}
      <Dialog open={isAddingParts} onOpenChange={setIsAddingParts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Required Parts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={newPart.name}
                onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                placeholder="e.g., Water filter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partPrice">Price ($)</Label>
              <Input
                id="partPrice"
                type="number"
                value={newPart.price}
                onChange={(e) => setNewPart({...newPart, price: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddPart}>Add Part</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reschedule Dialog */}
      <Dialog open={isRescheduling} onOpenChange={setIsRescheduling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rescheduleDate">New Date</Label>
              <Input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescheduleReason">Reason for Rescheduling</Label>
              <Textarea
                id="rescheduleReason"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Please explain why you need to reschedule"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReschedule}>Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle /> Cancel Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-amber-600">Warning: Cancelling a job may affect your reputation on the platform.</p>
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you need to cancel this job"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelling(false)}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OngoingJob;
