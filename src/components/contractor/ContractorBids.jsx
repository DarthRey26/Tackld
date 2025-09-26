import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/lib/services';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Eye
} from 'lucide-react';

const ContractorBids = () => {
  const { toast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (contractorId) {
      loadContractorBids();
    }
  }, [contractorId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Error getting user:', error);
        return;
      }
      setContractorId(user.id);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const loadContractorBids = async () => {
    try {
      setLoading(true);
      const { data: bidsData, error } = await bidService.getContractorBids(contractorId);
      if (error) throw error;
      setBids(bidsData || []);
    } catch (error) {
      console.error('Error loading contractor bids:', error);
      toast({
        title: "Error",
        description: "Failed to load your bids. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (bidCreatedAt, expiresAt) => {
    const expiry = new Date(expiresAt || new Date(bidCreatedAt).getTime() + 30 * 60 * 1000);
    const now = new Date();
    const timeLeft = expiry - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address) return 'Address not provided';
    return `${address.street || ''} ${address.unit || ''}, ${address.postalCode || 'Singapore'}`;
  };

  const formatScheduledDate = (date, time) => {
    if (!date) return 'Not scheduled';
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const parsedDate = parseISO(dateStr);
      const formattedDate = format(parsedDate, 'dd MMM yyyy');
      
      if (time) {
        const timeStr = time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
        return `${formattedDate} at ${timeStr}`;
      }
      
      return formattedDate;
    } catch (error) {
      return date && time ? `${date} at ${time}` : 'Not scheduled';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your bids...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Submitted Bids</h2>
        <Badge variant="secondary" className="px-3 py-1">
          {bids.length} bid{bids.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {bids.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-muted/30 to-muted/10">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2 text-foreground">No Bids Yet</h4>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start browsing available jobs and submit your first bid to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bids.map((bid) => (
            <Card key={bid.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-lg capitalize">
                      {bid.bookings?.service_type || 'Service'} Service
                    </CardTitle>
                    <Badge 
                      variant={getStatusBadgeVariant(bid.status)}
                      className="font-medium"
                    >
                      {getStatusText(bid.status)}
                    </Badge>
                  </div>
                {bid.status === 'pending' && (
                  <Badge variant="outline" className="bg-background/50 text-xs font-mono w-fit">
                    <Timer className="w-3 h-3 mr-1" />
                    {formatTimeLeft(bid.created_at, bid.expires_at)}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Your Bid</p>
                    <p className="text-2xl font-bold text-primary">${bid.amount}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ETA</p>
                    <p className="text-lg font-semibold text-foreground">{bid.eta_minutes} mins</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                      <p className="text-sm text-foreground">{formatAddress(bid.bookings?.address)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Scheduled</p>
                      <p className="text-sm text-foreground">
                        {formatScheduledDate(bid.bookings?.scheduled_date, bid.bookings?.scheduled_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Customer</p>
                      <p className="text-sm text-foreground">{bid.bookings?.customer_name || 'Customer'}</p>
                    </div>
                  </div>
                </div>
                
                {bid.note && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Your Notes:</p>
                    <p className="text-sm text-foreground leading-relaxed">{bid.note}</p>
                  </div>
                )}

                {bid.bookings?.description && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Job Description:</p>
                    <p className="text-sm text-foreground leading-relaxed">{bid.bookings.description}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Submitted {format(new Date(bid.created_at), 'dd MMM yyyy, HH:mm')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorBids;