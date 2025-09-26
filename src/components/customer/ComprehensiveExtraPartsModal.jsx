import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { extraPartsService } from '@/lib/services';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Camera,
  Shield,
  FileText,
  DollarSign,
  Eye
} from 'lucide-react';

const ComprehensiveExtraPartsModal = ({ booking, isOpen, onClose, onUpdate }) => {
  const [processing, setProcessing] = useState(false);
  const [showDisregardWarning, setShowDisregardWarning] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [disregardConfirmed, setDisregardConfirmed] = useState(false);
  const [extraParts, setExtraParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch extra parts from the separate table
  useEffect(() => {
    const fetchExtraParts = async () => {
      if (!booking?.id) return;
      
      try {
        const { data, error } = await extraPartsService.getExtraPartsForBooking(booking.id);
        if (error) throw error;
        setExtraParts(data || []);
      } catch (error) {
        console.error('Error fetching extra parts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExtraParts();
  }, [booking?.id]);

  if (loading) return null;

  const pendingParts = extraParts.filter(part => part.status === 'pending');
  
  if (pendingParts.length === 0) {
    return null;
  }

  const totalCost = pendingParts.reduce((sum, part) => sum + parseFloat(part.total_price || 0), 0);

  const handleApprove = async (partId) => {
    setProcessing(true);
    try {
      const { data, error } = await extraPartsService.handleCustomerAction(partId, user.id, 'approved');
      if (error) throw error;

      toast({
        title: "Part Approved ✅",
        description: "Additional part approved and added to final cost",
      });
      
      // Refresh extra parts data
      const { data: refreshedData, error: refreshError } = await extraPartsService.getExtraPartsForBooking(booking.id);
      if (!refreshError) setExtraParts(refreshedData || []);
      onUpdate();
    } catch (error) {
      console.error('Approve part error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve part",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (partId) => {
    setProcessing(true);
    try {
      const { data, error } = await extraPartsService.handleCustomerAction(partId, user.id, 'rejected');
      if (error) throw error;

      toast({
        title: "Part Rejected ❌",
        description: "Additional part request rejected",
      });
      
      // Refresh extra parts data
      const { data: refreshedData, error: refreshError } = await extraPartsService.getExtraPartsForBooking(booking.id);
      if (!refreshError) setExtraParts(refreshedData || []);
      onUpdate();
    } catch (error) {
      console.error('Reject part error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject part",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisregard = async (partId) => {
    if (!disregardConfirmed) {
      setShowDisregardWarning(true);
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await extraPartsService.handleCustomerAction(
        partId, 
        user.id, 
        'disregarded',
        'Customer chose to disregard and continue without parts'
      );
      if (error) throw error;

      toast({
        title: "Parts Disregarded ⚠️",
        description: "Contractor has been notified of your decision",
      });
      onUpdate();
      setShowDisregardWarning(false);
      setDisregardConfirmed(false);
    } catch (error) {
      console.error('Disregard parts error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disregard parts",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAndAppeal = async (partId) => {
    if (!appealReason.trim()) {
      toast({
        title: "Appeal Reason Required",
        description: "Please provide a reason for your appeal",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // First, approve the part for payment (funds go to escrow)
      const { data: actionData, error: actionError } = await extraPartsService.handleCustomerAction(
        partId, 
        user.id, 
        'pay_and_appeal',
        appealReason
      );
      if (actionError) throw actionError;

      // Then create the appeal
      const { data: appealData, error: appealError } = await extraPartsService.createAppeal(
        booking.id,
        user.id,
        partId,
        appealReason
      );
      if (appealError) throw appealError;

      toast({
        title: "Payment Approved with Appeal 📝",
        description: "Funds will be held in escrow pending appeal review",
      });
      onUpdate();
      setShowAppealForm(false);
      setAppealReason('');
    } catch (error) {
      console.error('Pay and appeal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment and appeal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    setProcessing(true);
    try {
      for (const part of pendingParts) {
        await extraPartsService.handleCustomerAction(part.id, user.id, 'approved');
      }
      toast({
        title: "All Parts Approved ✅",
        description: "All additional parts approved and final price updated",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Approve all parts error:', error);
      toast({
        title: "Error",
        description: "Failed to approve some parts",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showDisregardWarning && !showAppealForm} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Additional Parts Required - Action Needed
            </DialogTitle>
            <DialogDescription>
              Your contractor has requested additional parts. Please review each item and choose how to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Payment is blocked</strong> until you make a decision on these additional parts.
                You have three options for each part: Accept, Disregard & Continue, or Pay Now & Appeal Later.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {pendingParts.map((part, index) => (
                <Card key={part.id || index} className="border-2 border-orange-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Part Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-xl">{part.part_name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-blue-50">
                              Qty: {part.quantity}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50">
                              ${parseFloat(part.unit_price || 0).toFixed(2)} each
                            </Badge>
                          </div>
                        </div>
                        {part.photo_url && (
                          <div className="ml-4">
                            <img 
                              src={part.photo_url} 
                              alt={part.part_name}
                              className="w-20 h-20 object-cover rounded-lg border-2"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Part Details */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Contractor's Explanation:</p>
                        <p className="text-sm text-gray-600">{part.reason}</p>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm text-green-700">Total Cost for this item:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${parseFloat(part.total_price || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleApprove(part.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          ✅ Accept
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDisregardWarning(true);
                          }}
                          disabled={processing}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          ⚠️ Disregard & Continue
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAppealForm(true);
                          }}
                          disabled={processing}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          📝 Pay & Appeal Later
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Summary Section */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-blue-800">Total Additional Cost:</span>
                <span className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</span>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                This amount will be added to your final bill if approved.
              </p>
              
              {/* Bulk Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleApproveAll}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : 'Accept All Parts'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disregard Warning Modal */}
      <Dialog open={showDisregardWarning} onOpenChange={setShowDisregardWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Warning: Disregarding Parts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Not Recommended:</strong> If you disregard these charges, the contractor may not 
                complete the job as agreed. We recommend you pay first, and if there is an issue, 
                you can open an appeal for investigation.
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-gray-600">
              By continuing, you acknowledge that the contractor has been notified and may choose 
              to pause or not complete the work as originally planned.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDisregardWarning(false)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDisregardConfirmed(true);
                  handleDisregard(pendingParts[0]?.id);
                }}
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Confirm Disregard'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appeal Form Modal */}
      <Dialog open={showAppealForm} onOpenChange={setShowAppealForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Shield className="w-5 h-5" />
              Pay Now & Appeal Later
            </DialogTitle>
            <DialogDescription>
              You'll pay the full amount now, but funds for disputed parts will be held in escrow 
              until your appeal is reviewed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Appeal:</label>
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you believe these parts are unnecessary or overpriced..."
                className="mt-1"
                rows={4}
              />
            </div>
            
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <strong>Escrow Protection:</strong> The disputed amount (${totalCost.toFixed(2)}) 
                will be held safely until an admin reviews your appeal.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAppealForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handlePayAndAppeal(pendingParts[0]?.id)}
                disabled={processing || !appealReason.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {processing ? 'Processing...' : 'Submit Appeal & Pay'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComprehensiveExtraPartsModal;