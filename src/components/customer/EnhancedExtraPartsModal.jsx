import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { extraPartsService } from '@/lib/services';
import { Package, AlertTriangle, CheckCircle, XCircle, Camera } from 'lucide-react';

const EnhancedExtraPartsModal = ({ booking, isOpen, onClose, onUpdate }) => {
  const [processing, setProcessing] = useState(false);
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
      
      // Refresh extra parts data
      const { data: refreshedData, error: refreshError } = await extraPartsService.getExtraPartsForBooking(booking.id);
      if (!refreshError) setExtraParts(refreshedData || []);
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

  const handleRejectAll = async () => {
    setProcessing(true);
    try {
      for (const part of pendingParts) {
        await extraPartsService.handleCustomerAction(part.id, user.id, 'rejected');
      }
      toast({
        title: "All Parts Rejected ❌",
        description: "All additional part requests rejected",
      });
      
      // Refresh extra parts data
      const { data: refreshedData, error: refreshError } = await extraPartsService.getExtraPartsForBooking(booking.id);
      if (!refreshError) setExtraParts(refreshedData || []);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Reject all parts error:', error);
      toast({
        title: "Error",
        description: "Failed to reject some parts",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalCost = pendingParts.reduce((sum, part) => sum + parseFloat(part.total_price || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Additional Parts Required
          </DialogTitle>
          <DialogDescription>
            Your contractor has requested additional parts for this job. Please review each item and approve or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Parts Approval Required</span>
            </div>
            <p className="text-sm text-yellow-700">
              The contractor needs these additional parts to complete your job properly. 
              Review each item carefully before approving.
            </p>
          </div>

          <div className="space-y-3">
            {pendingParts.map((part, index) => (
              <Card key={part.id || index} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{part.part_name}</h4>
                        <Badge variant="outline" className="mt-1">Qty: {part.quantity}</Badge>
                      </div>
                      {part.photo_url && (
                        <div className="ml-4">
                          <img 
                            src={part.photo_url} 
                            alt={part.part_name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 font-medium mb-1">Reason:</p>
                      <p className="text-sm text-gray-600">{part.reason}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        ${parseFloat(part.unit_price || 0).toFixed(2)} × {part.quantity}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${parseFloat(part.total_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(part.id)}
                        disabled={processing}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(part.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-green-800">Total Additional Cost:</span>
              <span className="text-xl font-bold text-green-600">${totalCost.toFixed(2)}</span>
            </div>
            <p className="text-sm text-green-700">
              This amount will be added to your final bill if approved.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              disabled={processing}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject All
            </Button>
            <Button
              onClick={handleApproveAll}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {processing ? 'Processing...' : 'Approve All'}
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Report functionality coming soon",
              });
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Issue with Parts Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExtraPartsModal;