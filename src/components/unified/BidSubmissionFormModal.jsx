import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/lib/services';
import { DollarSign, Clock, FileText } from 'lucide-react';

const BidSubmissionFormModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  contractorId,
  onBidSubmitted 
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    eta_minutes: '',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.eta_minutes) {
      toast({
        title: 'Missing information',
        description: 'Please provide both bid amount and estimated time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const bidData = {
        booking_id: booking.id,
        contractor_id: contractorId,
        amount: parseFloat(formData.amount),
        eta_minutes: parseInt(formData.eta_minutes),
        note: formData.note || null,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      };

      // Use the RPC function for atomic bid submission
      const result = await bidService.submitBidAtomic(bidData);
      
      if (result.error) throw result.error;

      // Enhanced confirmation based on booking type
      if (booking.booking_type === 'tacklers_choice') {
        toast({
          title: "✅ Bid Accepted Automatically!",
          description: `Your bid of $${result.data.amount} has been accepted for this Tackler's Choice job. You can now start work.`,
          duration: 6000,
        });
      } else {
        toast({
          title: '✅ Bid Submitted Successfully!',
          description: `Your bid of $${result.data.amount} has been submitted. The customer will review all bids before deciding.`,
          duration: 5000,
        });
      }

      // Reset form
      setFormData({ amount: '', eta_minutes: '', note: '' });
      
      // Call success callback with the actual bid data
      if (onBidSubmitted) {
        onBidSubmitted(result.data);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Bid submission error:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit bid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const getPriceRange = () => {
    if (booking.price_range_min && booking.price_range_max) {
      return `$${booking.price_range_min} - $${booking.price_range_max}`;
    }
    return 'Budget flexible';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Submit Bid
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium capitalize">{booking.service_type} Service</h4>
            <p className="text-sm text-gray-600">Customer Budget: {getPriceRange()}</p>
            <p className="text-sm text-gray-600">
              Schedule: {booking.scheduled_date || 'ASAP'} {booking.scheduled_time || ''}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bid Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Your Bid Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="Enter your bid amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500">
                Include all costs (labor, materials, etc.)
              </p>
            </div>

            {/* ETA */}
            <div className="space-y-2">
              <Label htmlFor="eta" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated Time to Complete (minutes) *
              </Label>
              <Input
                id="eta"
                type="number"
                min="15"
                max="480"
                placeholder="e.g., 120"
                value={formData.eta_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, eta_minutes: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500">
                Time from arrival to completion
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="note" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes (optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Any additional information for the customer..."
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !formData.amount || !formData.eta_minutes}
                className="flex-1"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    {formData.amount ? `Submit Bid - $${formData.amount}` : 'Submit Bid'}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Terms Notice */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <p>By submitting this bid, you agree to complete the work as described within the estimated timeframe.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BidSubmissionFormModal;