import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { bidService } from '@/lib/services';
import { useBidTimer } from '@/hooks/useBidTimer';
import { 
  Clock, 
  Star, 
  MapPin, 
  DollarSign, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  Timer,
  ShieldCheck,
  Wrench
} from 'lucide-react';

const EnhancedBidManagement = ({ booking, onBidAccepted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [processingBid, setProcessingBid] = useState(null);
  
  const { getTimeLeft } = useBidTimer(bids);

  // Load bids for this booking
  useEffect(() => {
    if (!booking?.id) return;

    const loadBids = async () => {
      try {
        setLoading(true);
        console.log('🚀 [EnhancedBidManagement] Loading bids for booking:', booking.id);
        
        const { data: bidsData, error } = await bidService.getBidsForBooking(booking.id);
        
        if (error) {
          console.error('❌ [EnhancedBidManagement] Error loading bids:', error);
          throw error;
        }
        
        console.log('📦 [EnhancedBidManagement] Raw bids data received:', bidsData);
        
        // Filter for active bids only
        const activeBids = (bidsData || []).filter(bid => {
          const isActive = bid.status === 'pending' && new Date(bid.expires_at) > new Date();
          console.log('🔍 [EnhancedBidManagement] Checking bid:', bid.id, 'active:', isActive, 'contractor:', bid.contractor?.full_name);
          return isActive;
        });
        
        console.log('✅ [EnhancedBidManagement] Active bids found:', activeBids.length);
        setBids(activeBids);
      } catch (error) {
        console.error('Error loading bids:', error);
        toast({
          title: "Error",
          description: "Failed to load bids",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBids();
    
    // Set up real-time subscription for new bids
    const channel = supabase
      .channel('bid-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          const newBid = payload.new;
          if (newBid.status === 'pending') {
            setBids(prev => [...prev, newBid]);
            toast({
              title: "New Bid Received!",
              description: `A contractor has submitted a bid for $${newBid.amount}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          const updatedBid = payload.new;
          setBids(prev => prev.map(bid => 
            bid.id === updatedBid.id ? updatedBid : bid
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, toast]);

  const handleAcceptBid = async (bid) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept bids",
        variant: "destructive",
      });
      return;
    }

    setProcessingBid(bid.id);
    
    try {
      const { data: acceptedBid, error } = await bidService.acceptBid(bid.id, user.id);
      
      if (error) throw error;
      
      toast({
        title: "Bid Accepted!",
        description: `${bid.contractor?.full_name || 'Contractor'} has been assigned to your job.`,
      });
      
      // Update local state
      setBids(prev => prev.map(b => 
        b.id === bid.id 
          ? { ...b, status: 'accepted' }
          : { ...b, status: 'rejected' }
      ));
      
      onBidAccepted?.(acceptedBid);
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept bid",
        variant: "destructive",
      });
    } finally {
      setProcessingBid(null);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reject bids",
        variant: "destructive",
      });
      return;
    }

    setProcessingBid(bidId);
    
    try {
      const { data, error } = await bidService.rejectBid(bidId, user.id, 'Customer choice');
      
      if (error) throw error;
      
      setBids(prev => prev.filter(bid => bid.id !== bidId));
      
      toast({
        title: "Bid Rejected",
        description: "The contractor has been notified.",
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject bid",
        variant: "destructive",
      });
    } finally {
      setProcessingBid(null);
    }
  };

  const getTotalCost = (bid) => {
    const baseAmount = parseFloat(bid.amount) || 0;
    const materialsTotal = (bid.included_materials || []).reduce((total, material) => {
      return total + (parseFloat(material.cost) || 0);
    }, 0);
    return baseAmount + materialsTotal;
  };

  const getContractorRatingDisplay = (contractor) => {
    const rating = contractor?.rating || 5.0;
    const reviews = contractor?.total_reviews || 0;
    return { rating: rating.toFixed(1), reviews };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading bids...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Waiting for Contractor Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Searching for Contractors</h3>
            <p className="text-gray-600">
              We're reaching out to qualified contractors in your area. You'll receive bids shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Available Bids ({bids.length})
            </div>
            <Badge variant="secondary">
              Active bidding in progress
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bids.map((bid) => {
              const contractor = bid.contractor || {};
              const { rating, reviews } = getContractorRatingDisplay(contractor);
              const timeLeft = getTimeLeft(bid.id);
              const isExpired = timeLeft === 'Expired';
              
              if (isExpired) return null;

              return (
                <Card key={bid.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contractor.profile_photo_url} />
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{contractor.full_name || 'Contractor'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>{rating}</span>
                            </div>
                            <span>•</span>
                            <span>{reviews} reviews</span>
                            <span>•</span>
                            <span>{contractor.total_jobs_completed || 0} jobs completed</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${getTotalCost(bid).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total cost
                        </div>
                      </div>
                    </div>

                    {/* Bid Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">ETA</p>
                          <p className="text-sm text-gray-600">{bid.eta_minutes} minutes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Warranty</p>
                          <p className="text-sm text-gray-600">
                            {bid.terms?.warranty_days || 30} days
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Expires in</p>
                          <p className="text-sm text-orange-600 font-medium">{timeLeft}</p>
                        </div>
                      </div>
                    </div>

                    {/* Materials */}
                    {bid.included_materials && bid.included_materials.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Wrench className="w-4 h-4" />
                          Included Materials
                        </h5>
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          {bid.included_materials.map((material, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{material.name}</span>
                              <span>${material.cost}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contractor Notes */}
                    {bid.note && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-1">Contractor Notes</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {bid.note}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContractor(contractor);
                          setShowContractorModal(true);
                        }}
                        className="flex-1"
                      >
                        <User className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={processingBid === bid.id}
                        className="px-3"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAcceptBid(bid)}
                        disabled={processingBid === bid.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processingBid === bid.id ? (
                          <Clock className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Accept Bid
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contractor Profile Modal */}
      <Dialog open={showContractorModal} onOpenChange={setShowContractorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contractor Profile</DialogTitle>
          </DialogHeader>
          
          {selectedContractor && (
            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={selectedContractor.profile_photo_url} />
                  <AvatarFallback>
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{selectedContractor.full_name}</h3>
                <p className="text-gray-600">{selectedContractor.company_name || 'Independent Contractor'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{(selectedContractor.rating || 5.0).toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
                <div>
                  <p className="font-semibold">{selectedContractor.total_jobs_completed || 0}</p>
                  <p className="text-sm text-gray-600">Jobs Completed</p>
                </div>
              </div>

              {selectedContractor.bio && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-gray-600">{selectedContractor.bio}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{selectedContractor.phone_number || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>Singapore</span>
                </div>
              </div>

              <Button
                onClick={() => setShowContractorModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedBidManagement;