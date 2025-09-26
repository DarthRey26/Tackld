import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bidService } from '@/lib/services';
import { reviewService } from '@/lib/services/reviewService';
import { realtimeService } from '@/lib/services/realtimeService';
import { 
  Clock, 
  Star, 
  DollarSign, 
  User, 
  CheckCircle,
  XCircle,
  Timer,
  ShieldCheck,
  Wrench,
  MessageSquare,
  AlertCircle,
  Award,
  Calendar,
  Building,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const BidAcceptanceFlow = ({ booking, onBidAccepted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [processingBid, setProcessingBid] = useState(null);
  const [biddingExpired, setBiddingExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [contractorReviews, setContractorReviews] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});

  // Calculate bidding time left without side effects
  const calculateTimeLeft = useMemo(() => {
    if (!booking?.created_at) return null;
    
    const bidExpiryTime = new Date(booking.created_at).getTime() + (30 * 60 * 1000); // 30 minutes
    const now = Date.now();
    const remainingTime = bidExpiryTime - now;
    
    if (remainingTime <= 0) {
      return { expired: true, display: 'Expired' };
    }
    
    const minutes = Math.floor(remainingTime / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    return { 
      expired: false, 
      display: `${minutes}:${seconds.toString().padStart(2, '0')}` 
    };
  }, [booking?.created_at, timeLeft]);

  // Timer effect to update time left
  useEffect(() => {
    if (!booking?.created_at) return;

    const updateTimer = () => {
      const bidExpiryTime = new Date(booking.created_at).getTime() + (30 * 60 * 1000);
      const now = Date.now();
      const remainingTime = bidExpiryTime - now;
      
      if (remainingTime <= 0) {
        setBiddingExpired(true);
        setTimeLeft('Expired');
      } else {
        setBiddingExpired(false);
        const minutes = Math.floor(remainingTime / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [booking?.created_at]);

  // Load bids for this booking with real-time updates
  useEffect(() => {
    if (!booking?.id || !['pending_bids', 'finding_contractor'].includes(booking.status)) {
      console.log('❌ BidAcceptanceFlow: Invalid booking or status', { 
        bookingId: booking?.id, 
        status: booking?.status,
        validStatuses: ['pending_bids', 'finding_contractor']
      });
      return;
    }

    let mounted = true;

    const loadBids = async () => {
      try {
        setLoading(true);
        console.log('🚀 Loading bids for booking:', booking.id, 'user:', user?.id, 'booking status:', booking.status);
        
        const { data: bidsData, error } = await bidService.getBidsForBooking(booking.id);
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error loading bids:', error);
          throw error;
        }
        
        console.log('📦 Raw bids data received:', bidsData?.length || 0, 'bids');
        console.log('📦 First bid sample:', bidsData?.[0]);
        
        // Filter for active, pending bids only
        const activeBids = (bidsData || []).filter(bid => {
          const now = new Date();
          const expiresAt = new Date(bid.expires_at);
          const isActive = bid.status === 'pending' && expiresAt > now;
          
          console.log('🔍 Filtering bid:', {
            id: bid.id?.slice(-8),
            status: bid.status, 
            expires_at: bid.expires_at,
            isExpired: expiresAt <= now,
            contractor: bid.contractor?.full_name,
            isActive
          });
          
          return isActive;
        });
        
        console.log('✅ Active bids found:', activeBids.length, 'for booking:', booking.id?.slice(-8));
        setBids(activeBids);
        
        // Load reviews for each contractor
        loadContractorReviews(activeBids);
      } catch (error) {
        if (mounted) {
          console.error('❌ Failed to load bids:', error);
          toast({
            title: "Error loading bids",
            description: error.message || "Failed to load contractor bids. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up real-time bid subscription
    console.log('📡 Setting up bid subscription for booking:', booking.id);
    let bidChannel;
    
    try {
      bidChannel = realtimeService.subscribeToBids(booking.id, user?.id, (payload) => {
        console.log('📊 Bid update received in BidAcceptanceFlow:', payload);
        
        if (!mounted) return;
      
      if (payload.eventType === 'INSERT' && payload.new) {
        const newBid = payload.new;
        console.log('📊 New bid received:', newBid);
        
        // Only add if it's a valid pending bid
        if (newBid.status === 'pending' && new Date(newBid.expires_at) > new Date()) {
          setBids(prev => {
            const exists = prev.find(bid => bid.id === newBid.id);
            if (!exists) {
              console.log('📊 Adding new bid to list');
              return [...prev, newBid];
            }
            return prev;
          });
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updatedBid = payload.new;
        console.log('📊 Bid updated:', updatedBid);
        
        setBids(prev => 
          prev.map(bid => 
            bid.id === updatedBid.id 
              ? { ...bid, ...updatedBid }
              : bid
          ).filter(bid => 
            // Remove rejected, expired, or accepted bids
            bid.status === 'pending' && new Date(bid.expires_at) > new Date()
          )
        );
      }
    });
    } catch (error) {
      console.error('📊 Error setting up bid subscription:', error);
    }

    loadBids();

    return () => {
      mounted = false;
      if (bidChannel) {
        realtimeService.unsubscribe(bidChannel);
      }
    };
  }, [booking?.id, booking?.status, user?.id, toast]);

  const handleAcceptBid = async (bid) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept bids",
        variant: "destructive",
      });
      return;
    }

    if (biddingExpired) {
      toast({
        title: "Bidding Expired",
        description: "The bidding period has expired",
        variant: "destructive",
      });
      return;
    }

    setProcessingBid(bid.id);
    
    try {
      // Use atomic RPC function for bid acceptance
      const { data: acceptResult, error } = await bidService.acceptBid(bid.id, user.id);
      
      if (error) throw error;
      
      toast({
        title: "Bid Accepted!",
        description: `${bid.contractor?.full_name || 'Contractor'} has been assigned to your job.`,
      });
      
      // Update local state - accepted bid, reject others
      setBids(prev => prev.map(b => 
        b.id === bid.id 
          ? { ...b, status: 'accepted' }
          : { ...b, status: 'rejected' }
      ));
      
      onBidAccepted?.(acceptResult);
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

  // Load contractor reviews for each bid
  const loadContractorReviews = async (bidsData) => {
    const reviewsData = {};
    
    for (const bid of bidsData) {
      if (bid.contractor?.id) {
        try {
          const { data: reviews, error } = await reviewService.getContractorReviews(bid.contractor.id, 5);
          if (!error && reviews) {
            reviewsData[bid.contractor.id] = reviews;
          }
        } catch (error) {
          console.error('Error loading reviews for contractor:', bid.contractor.id, error);
        }
      }
    }
    
    setContractorReviews(reviewsData);
  };

  const toggleReviewExpansion = (contractorId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [contractorId]: !prev[contractorId]
    }));
  };

  const renderContractorReviews = (contractor) => {
    const reviews = contractorReviews[contractor.id] || [];
    const isExpanded = expandedReviews[contractor.id];
    
    if (reviews.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">No reviews yet</div>
      );
    }

    const displayReviews = isExpanded ? reviews : reviews.slice(0, 2);

    return (
      <div className="space-y-3">
        {displayReviews.map((review, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  {review.profiles?.full_name || 'Anonymous'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(review.review_date).toLocaleDateString()}
              </span>
            </div>
            {review.review_text && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        ))}
        
        {reviews.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleReviewExpansion(contractor.id)}
            className="w-full text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Show {reviews.length - 2} more review{reviews.length - 2 > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  // Don't show if booking is not in bidding phase
  if (!booking || !['pending_bids', 'finding_contractor'].includes(booking.status)) {
    console.log('❌ BidAcceptanceFlow not showing:', { 
      hasBooking: !!booking, 
      status: booking?.status,
      validStatuses: ['pending_bids', 'finding_contractor']
    });
    return null;
  }

  console.log('✅ BidAcceptanceFlow rendering for booking:', {
    id: booking.id?.slice(-8),
    status: booking.status,
    bidsCount: bids.length,
    loading
  });

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
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Timer className="w-5 h-5" />
            Waiting for Contractor Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-blue-900">Searching for Contractors</h3>
            <p className="text-blue-700 mb-4">
              We're reaching out to qualified contractors in your area. You'll receive bids shortly.
            </p>
            <div className="text-sm text-blue-600 font-medium">
              Time remaining: {timeLeft || 'Calculating...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayTimeLeft = timeLeft;

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <DollarSign className="w-5 h-5" />
              Available Bids ({bids.length})
            </div>
            <div className="text-right">
              {displayTimeLeft === 'Expired' ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Bidding Closed
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-mono">
                  {displayTimeLeft} remaining
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bids.map((bid) => {
              const contractor = bid.contractor || {};
              const { rating, reviews } = getContractorRatingDisplay(contractor);
              const isExpired = displayTimeLeft === 'Expired';
              
              return (
                <Card key={bid.id} className="border border-gray-200 hover:border-green-300 transition-colors">
                  <CardContent className="p-6">
                    {/* Header with contractor info and price */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={contractor.profile_photo_url} />
                          <AvatarFallback>
                            <User className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg">{contractor.full_name || 'Contractor'}</h4>
                            {contractor.is_verified && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {contractor.contractor_type === 'tacklers_choice' && (
                              <Badge variant="default" className="text-xs bg-amber-100 text-amber-800">
                                <Award className="w-3 h-3 mr-1" />
                                Tackler's Choice
                              </Badge>
                            )}
                          </div>
                          
                          {contractor.company_name && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                              <Building className="w-3 h-3" />
                              <span>{contractor.company_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{rating}</span>
                            </div>
                            <span>•</span>
                            <span>{reviews} reviews</span>
                            <span>•</span>
                            <span>{contractor.total_jobs_completed || 0} jobs completed</span>
                            {contractor.years_experience && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{contractor.years_experience}+ years exp.</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {contractor.bio && (
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {contractor.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-green-600">
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
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Base Cost</p>
                          <p className="text-sm text-gray-600">${parseFloat(bid.amount).toFixed(2)}</p>
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
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                          {bid.included_materials.map((material, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{material.name}</span>
                              <span className="font-medium">${material.cost}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium mb-3 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Customer Reviews ({contractorReviews[contractor.id]?.length || 0})
                      </h5>
                      {renderContractorReviews(contractor)}
                    </div>

                    {/* Contractor Notes */}
                    {bid.note && (
                      <div className="mb-6">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          Response Notes
                        </h5>
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800 leading-relaxed italic">"{bid.note}"</p>
                        </div>
                      </div>
                    )}

                    {/* Estimated Timeframe */}
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-1 text-green-800">
                        <Clock className="w-4 h-4" />
                        Availability & Timeline
                      </h5>
                      <div className="text-sm text-green-700">
                        <p className="font-medium">Can start in: {bid.eta_minutes} minutes</p>
                        {bid.proposed_start_time && (
                          <p className="text-xs mt-1">
                            Proposed start: {new Date(bid.proposed_start_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={isExpired || processingBid === bid.id}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {processingBid === bid.id ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {isExpired ? 'Expired' : 'Decline'}
                      </Button>
                      
                      <Button
                        onClick={() => handleAcceptBid(bid)}
                        disabled={isExpired || processingBid === bid.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingBid === bid.id ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isExpired ? 'Expired' : 'Accept Bid'}
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
                {selectedContractor.contractor_type === 'tacklers_choice' && (
                  <Badge className="mt-2">Tackler's Choice Partner</Badge>
                )}
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
                <h4 className="font-medium">Specialization</h4>
                <Badge variant="secondary" className="capitalize">
                  {selectedContractor.service_type || 'General'}
                </Badge>
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

export default BidAcceptanceFlow;