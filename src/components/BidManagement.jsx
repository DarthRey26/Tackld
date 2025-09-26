import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Clock, DollarSign, User, MessageSquare, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/lib/services';
import { useRealtimeBooking } from '@/hooks/useRealtimeBooking';
import { showToastForRpcError } from '@/utils/rpcErrorHandler';
import { supabase } from '@/integrations/supabase/client';

const BidManagement = ({ booking, onBidAccepted }) => {
  const { toast } = useToast();
  const { bids, acceptBid, loading } = useRealtimeBooking(booking?.id, 'customer');
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time left for bidding
  useEffect(() => {
    if (!booking?.created_at) return;

    const bidExpiryTime = new Date(booking.created_at).getTime() + (30 * 60 * 1000); // 30 minutes
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const timeRemaining = bidExpiryTime - now;
      
      if (timeRemaining <= 0) {
        setTimeLeft('Expired');
        return;
      }
      
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking?.created_at]);

  // Handle accepting a bid with proper error handling and user authentication
  const handleAcceptBid = async (bid) => {
    try {
      // Get current user to ensure proper authorization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to accept bids');
      }

      const result = await acceptBid(bid.id);
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Bid Accepted!",
        description: `${bid.contractor?.full_name || 'Contractor'} has been notified and will contact you.`,
      });
      
      if (onBidAccepted) {
        onBidAccepted(bid);
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      showToastForRpcError(toast, error, 'bid acceptance');
    }
  };

  // Handle rejecting a bid with proper error handling
  const handleRejectBid = async (bidId) => {
    try {
      // Get current user to ensure proper authorization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to reject bids');
      }

      const { error } = await bidService.rejectBid(bidId, user.id, 'Customer choice');
      if (error) throw error;
      
      toast({
        title: "Bid Rejected",
        description: "The bid has been rejected and the contractor notified.",
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      showToastForRpcError(toast, error, 'bid rejection');
    }
  };

  const getTotalCost = (bid) => {
    if (bid.included_materials && bid.included_materials.length > 0) {
      const materialsCost = bid.included_materials.reduce((sum, material) => sum + (material.cost || 0), 0);
      return bid.amount + materialsCost;
    }
    return bid.amount;
  };

  const ContractorProfileModal = ({ contractor }) => (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Contractor Profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={contractor?.profile_photo_url} />
            <AvatarFallback>{(contractor?.full_name || 'Contractor').split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{contractor?.full_name || 'Contractor'}</h3>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{contractor?.rating || '5.0'}</span>
              <span className="text-sm text-gray-500">({contractor?.total_jobs_completed || 0} jobs)</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Specialties</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{contractor?.contractor_type || 'General'}</Badge>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Contact</h4>
          <p className="text-sm text-gray-600">{contractor?.company_name || 'Independent Contractor'}</p>
        </div>
      </div>
    </DialogContent>
  );

  // Filter only pending, non-expired bids
  const activeBids = (bids || []).filter(bid => 
    bid.status === 'pending' && 
    new Date(bid.expires_at || new Date(bid.created_at).getTime() + 30 * 60 * 1000) > new Date()
  );

  if (!booking || timeLeft === 'Expired' || activeBids.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {activeBids.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-blue-800">
                Available Bids ({activeBids.length})
              </CardTitle>
              <span className={`font-mono text-sm ${timeLeft === 'Expired' ? 'text-red-500' : 'text-gray-600'}`}>
                {timeLeft === 'Expired' ? 'Bidding Closed' : `${timeLeft} left`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBids.map((bid) => (
                <Card key={bid.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Contractor Header */}
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Avatar>
                           <AvatarImage src={bid.contractor?.profile_photo_url} />
                           <AvatarFallback>
                             {(bid.contractor?.full_name || 'Contractor').split(' ').map(n => n[0]).join('')}
                           </AvatarFallback>
                         </Avatar>
                        <div>
                          <h3 className="font-semibold">{bid.contractor?.full_name || 'Contractor'}</h3>
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                             <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                             <span>{bid.contractor?.rating || '5.0'}</span>
                             <span>•</span>
                             <span>{bid.contractor?.total_jobs_completed || 0} jobs</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${getTotalCost(bid)}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {bid.eta_minutes || 60} min ETA
                        </div>
                      </div>
                    </div>

                    {/* Materials */}
                    {bid.included_materials && bid.included_materials.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-sm mb-2">Additional Materials:</h4>
                        {bid.included_materials.map((material, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {material.name} (+${material.cost || 0})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contractor Note */}
                    {bid.note && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-gray-500" />
                          <p className="text-sm text-gray-700">{bid.note}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {timeLeft !== 'Expired' && (
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <User className="w-4 h-4 mr-1" />
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <ContractorProfileModal contractor={bid.contractor} />
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectBid(bid.id)}
                          disabled={loading}
                        >
                          Reject
                        </Button>
                        
                        <Button 
                          onClick={() => handleAcceptBid(bid)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Bid
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BidManagement;