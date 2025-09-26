import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Clock, DollarSign, User, MessageSquare, CheckCircle, Timer, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FixedBidManagement = ({ booking, onBidAccepted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingBid, setProcessingBid] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});

  // Load bids for this booking
  useEffect(() => {
    if (!booking?.id) return;

    const loadBids = async () => {
      try {
        setLoading(true);
        console.log('🚀 [FixedBidManagement] Loading bids for booking:', booking.id);
        
        const { data: bidsData, error } = await bidService.getBidsForBooking(booking.id);
        
        if (error) {
          console.error('❌ [FixedBidManagement] Error loading bids:', error);
          throw error;
        }
        
        console.log('📦 [FixedBidManagement] Raw bids data received:', bidsData);
        
        // Filter for active bids only
        const activeBids = (bidsData || []).filter(bid => {
          const isActive = bid.status === 'pending' && new Date(bid.expires_at) > new Date();
          console.log('🔍 [FixedBidManagement] Checking bid:', bid.id, 'active:', isActive, 'contractor:', bid.contractor?.full_name);
          return isActive;
        });
        
        console.log('✅ [FixedBidManagement] Active bids found:', activeBids.length);
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
    
    // Set up real-time subscription for bid updates
    const channel = supabase
      .channel(`bid-updates-${booking.id}`)
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
          if (newBid.status === 'pending' && new Date(newBid.expires_at) > new Date()) {
            // Load complete bid data with contractor info
            bidService.getBidById(newBid.id).then(({ data: fullBid }) => {
              if (fullBid) {
                setBids(prev => {
                  const exists = prev.find(b => b.id === fullBid.id);
                  if (!exists) {
                    toast({
                      title: "New Bid Received!",
                      description: `${fullBid.contractor?.full_name || 'Contractor'} submitted a bid for $${fullBid.amount}`,
                    });
                    return [...prev, fullBid];
                  }
                  return prev;
                });
              }
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
          if (updatedBid.status !== 'pending') {
            // Remove non-pending bids from view
            setBids(prev => prev.filter(bid => bid.id !== updatedBid.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, toast]);

  // Timer for bid expiration
  useEffect(() => {
    if (bids.length === 0) return;

    const updateTimers = () => {
      const newTimeLeft = {};
      bids.forEach(bid => {
        const expiryTime = new Date(bid.expires_at).getTime();
        const now = new Date().getTime();
        const timeRemaining = expiryTime - now;
        
        if (timeRemaining <= 0) {
          newTimeLeft[bid.id] = 'Expired';
          // Remove expired bids
          setBids(prev => prev.filter(b => b.id !== bid.id));
        } else {
          const minutes = Math.floor(timeRemaining / (1000 * 60));
          const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
          newTimeLeft[bid.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [bids]);

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
      const { data, error } = await bidService.acceptBid(bid.id, user.id);
      
      if (error) throw error;
      
      toast({
        title: "Bid Accepted!",
        description: `${bid.contractor?.full_name || 'Contractor'} has been assigned to your job. They will contact you shortly.`,
      });
      
      // Update local state - remove all bids as booking is now assigned
      setBids([]);
      
      if (onBidAccepted) {
        onBidAccepted({ ...bid, ...data });
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept bid. Please try again.",
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
      const { error } = await bidService.rejectBid(bidId, user.id, 'Customer choice');
      
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

  const ContractorProfileModal = ({ contractor }) => (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Contractor Profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="text-center">
          <Avatar className="w-16 h-16 mx-auto mb-3">
            <AvatarImage src={contractor?.profile_photo_url} />
            <AvatarFallback>
              {(contractor?.full_name || 'Contractor').split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{contractor?.full_name || 'Contractor'}</h3>
          <p className="text-gray-600">{contractor?.company_name || 'Independent Contractor'}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{(contractor?.rating || 5.0).toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-600">Rating</p>
          </div>
          <div>
            <p className="font-semibold">{contractor?.total_jobs_completed || 0}</p>
            <p className="text-sm text-gray-600">Jobs Completed</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Contact</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{contractor?.phone_number || 'Available after acceptance'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>Singapore</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Specialties</h4>
          <Badge variant="secondary">{contractor?.contractor_type || 'General Contractor'}</Badge>
        </div>
      </div>
    </DialogContent>
  );

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

  if (!booking || bids.length === 0) {
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
              We're reaching out to qualified contractors in your area. Bids will appear here as they come in.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-700" />
            <span className="text-blue-800">Available Bids ({bids.length})</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Live Bidding
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id} className="bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Contractor Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={bid.contractor?.profile_photo_url} />
                        <AvatarFallback>
                          {(bid.contractor?.full_name || 'Contractor').split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{bid.contractor?.full_name || 'Contractor'}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{(bid.contractor?.rating || 5.0).toFixed(1)}</span>
                          </div>
                          <span>•</span>
                          <span>{bid.contractor?.total_jobs_completed || 0} jobs completed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${getTotalCost(bid).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bid.eta_minutes || 60} min ETA
                      </div>
                    </div>
                  </div>

                  {/* Bid expires countdown */}
                  <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-700 font-medium">Bid expires in:</span>
                      <span className="text-orange-700 font-mono">{timeLeft[bid.id] || 'Loading...'}</span>
                    </div>
                  </div>

                  {/* Materials */}
                  {bid.included_materials && bid.included_materials.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium text-sm mb-2">Included Materials:</h4>
                      <div className="space-y-1">
                        {bid.included_materials.map((material, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{material.name}</span>
                            <span className="font-medium">+${material.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contractor Note */}
                  {bid.note && (
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-blue-500" />
                        <div>
                          <h5 className="text-sm font-medium text-blue-800 mb-1">Contractor Notes</h5>
                          <p className="text-sm text-blue-700">{bid.note}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <User className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                      </DialogTrigger>
                      <ContractorProfileModal contractor={bid.contractor} />
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectBid(bid.id)}
                      disabled={processingBid === bid.id}
                      className="px-4"
                    >
                      Reject
                    </Button>
                    
                    <Button 
                      onClick={() => handleAcceptBid(bid)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      disabled={processingBid === bid.id}
                    >
                      {processingBid === bid.id ? (
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Accept Bid - ${getTotalCost(bid).toFixed(2)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FixedBidManagement;