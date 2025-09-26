import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { rescheduleService } from '@/lib/services/rescheduleService';
import { Calendar, Clock } from 'lucide-react';

const RescheduleRequest = ({ booking, onRequestSubmitted }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    new_date: '',
    new_time: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requestData = {
      booking_id: booking.id,
      new_date: formData.new_date,
      new_time: formData.new_time,
      reason: formData.reason
    };

    // Validate form data if validation function exists
    if (typeof validateRescheduleForm === 'function') {
      const validation = validateRescheduleForm(requestData);
      if (validation.error) {
        const formErrors = {};
        validation.error.forEach(error => {
          formErrors[error.path[0]] = error.message;
        });
        setErrors(formErrors);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await rescheduleService.createRescheduleRequest(requestData);
      
      if (error) {
        throw new Error(error.message || 'Failed to submit reschedule request');
      }

      toast({
        title: "Reschedule Requested",
        description: "Your reschedule request has been sent to the customer for approval.",
      });

      // Reset form and close dialog
      setFormData({
        new_date: '',
        new_time: '',
        reason: ''
      });
      setErrors({});
      setIsOpen(false);
      
      // Notify parent component
      onRequestSubmitted?.(data);

    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Request Reschedule
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Request Reschedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Current Schedule:</strong> {booking.scheduled_date} at {booking.scheduled_time}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new_date">New Date *</Label>
            <Input
              id="new_date"
              type="date"
              min={getMinDate()}
              value={formData.new_date}
              onChange={(e) => handleInputChange('new_date', e.target.value)}
              className={errors.new_date ? 'border-red-500' : ''}
            />
            {errors.new_date && (
              <p className="text-red-500 text-xs mt-1">{errors.new_date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="new_time">New Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="new_time"
                type="time"
                value={formData.new_time}
                onChange={(e) => handleInputChange('new_time', e.target.value)}
                className={`pl-10 ${errors.new_time ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.new_time && (
              <p className="text-red-500 text-xs mt-1">{errors.new_time}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason for Reschedule *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please explain why you need to reschedule this appointment..."
              rows={4}
              maxLength={500}
              className={errors.reason ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.reason && (
                <p className="text-red-500 text-xs">{errors.reason}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.reason.length}/500
              </p>
            </div>
          </div>

          {/* Preview new schedule */}
          {formData.new_date && formData.new_time && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>New Schedule:</strong> {formData.new_date} at {formData.new_time}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleRequest;