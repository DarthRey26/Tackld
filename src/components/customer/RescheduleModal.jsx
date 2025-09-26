import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { rescheduleService } from '@/lib/services/rescheduleService';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RescheduleModal = ({ booking, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    new_date: '',
    new_time: '',
    reason: ''
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch existing reschedule requests
  React.useEffect(() => {
    const fetchRequests = async () => {
      if (!booking?.id) return;
      
      try {
        const { data, error } = await rescheduleService.getRescheduleRequestsForBooking(booking.id);
        if (!error && data) {
          setPendingRequests(data);
        }
      } catch (error) {
        console.error('Error fetching reschedule requests:', error);
      }
    };

    if (isOpen) {
      fetchRequests();
    }
  }, [booking?.id, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.new_date || !formData.new_time || !formData.reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await rescheduleService.createRescheduleRequest({
        booking_id: booking.id,
        new_date: formData.new_date,
        new_time: formData.new_time,
        reason: formData.reason
      });

      if (error) throw error;

      toast({
        title: "Reschedule Request Sent",
        description: "Your reschedule request has been sent to the contractor for approval.",
      });

      // Reset form
      setFormData({
        new_date: '',
        new_time: '',
        reason: ''
      });
      
      // Refresh requests
      const { data: updatedRequests } = await rescheduleService.getRescheduleRequestsForBooking(booking.id);
      setPendingRequests(updatedRequests || []);
      
      onUpdate?.();
    } catch (error) {
      console.error('Error creating reschedule request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reschedule request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const { data, error } = await rescheduleService.approveRescheduleRequest(requestId, user.id);
      if (error) throw error;

      toast({
        title: "Reschedule Approved",
        description: "The new schedule has been approved and updated.",
      });

      onClose();
      onUpdate?.();
    } catch (error) {
      console.error('Error approving reschedule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve reschedule",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const { data, error } = await rescheduleService.rejectRescheduleRequest(requestId, user.id);
      if (error) throw error;

      toast({
        title: "Reschedule Rejected",
        description: "The reschedule request has been rejected.",
      });

      // Refresh requests
      const { data: updatedRequests } = await rescheduleService.getRescheduleRequestsForBooking(booking.id);
      setPendingRequests(updatedRequests || []);
    } catch (error) {
      console.error('Error rejecting reschedule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject reschedule",
        variant: "destructive",
      });
    }
  };

  const pendingReschedules = pendingRequests.filter(req => req.status === 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reschedule Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Schedule */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Current Schedule</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Date:</strong> {booking.scheduled_date || 'ASAP'}</p>
                <p><strong>Time:</strong> {booking.scheduled_time || 'Flexible'}</p>
                <p><strong>Service:</strong> {booking.service_type}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reschedule Requests */}
          {pendingReschedules.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Pending Reschedule Requests</h3>
              {pendingReschedules.map(request => (
                <Card key={request.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Awaiting Your Response
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p><strong>New Date:</strong> {request.new_date}</p>
                      <p><strong>New Time:</strong> {request.new_time}</p>
                      <p><strong>Reason:</strong> {request.reason}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRequest(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        variant="outline"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* New Reschedule Request Form */}
          <div>
            <h3 className="font-medium mb-4">Request New Schedule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_date">Preferred Date</Label>
                  <Input
                    id="new_date"
                    type="date"
                    value={formData.new_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="new_time">Preferred Time</Label>
                  <Input
                    id="new_time"
                    type="time"
                    value={formData.new_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">Reason for Reschedule</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you need to reschedule..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;