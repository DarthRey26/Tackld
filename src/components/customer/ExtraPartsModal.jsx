import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, AlertTriangle } from 'lucide-react';
import { extraPartsService } from '@/lib/services/extraPartsService';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const ExtraPartsModal = ({ booking, isOpen, onClose, onUpdate }) => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!booking?.extra_parts || booking.extra_parts.length === 0) {
    return null;
  }

  const pendingParts = booking.extra_parts.filter(part => part.status === 'pending');
  
  if (pendingParts.length === 0) {
    return null;
  }

  const handleApproveAll = async () => {
    setProcessing(true);
    try {
      for (const part of pendingParts) {
        await extraPartsService.approveExtraParts(part.id, user.id);
      }
      toast({
        title: "Success",
        description: "All parts approved and final price updated",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Approve parts error:', error);
      toast({
        title: "Error",
        description: "Failed to approve parts",
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
        await extraPartsService.rejectExtraParts(part.id, user.id);
      }
      toast({
        title: "Success",
        description: "Parts rejected",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Reject parts error:', error);
      toast({
        title: "Error", 
        description: "Failed to reject parts",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalCost = pendingParts.reduce((sum, part) => sum + (parseFloat(part.total_price) || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Additional Parts Required
          </DialogTitle>
          <DialogDescription>
            Your contractor has requested additional parts for this job. Please review and approve or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Parts Approval Needed</span>
            </div>
            <p className="text-sm text-yellow-700">
              The contractor needs these additional parts to complete your job properly.
            </p>
          </div>

          <div className="space-y-3">
            {pendingParts.map((part, index) => (
              <Card key={part.id || index}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{part.part_name}</h4>
                      <Badge variant="outline">Qty: {part.quantity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{part.reason}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        ${parseFloat(part.unit_price || 0).toFixed(2)} × {part.quantity}
                      </span>
                      <span className="font-medium">
                        ${parseFloat(part.total_price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center font-medium">
            <span>Total Additional Cost:</span>
            <span className="text-lg">${totalCost.toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              disabled={processing}
              className="flex-1"
            >
              Reject All
            </Button>
            <Button
              onClick={handleApproveAll}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Approve All'}
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Report functionality coming soon",
              });
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtraPartsModal;