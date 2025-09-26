import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Star, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

// Memoized bid card component to prevent unnecessary re-renders
const MemoizedBidCard = React.memo(({ 
  bid, 
  timeLeft, 
  onAcceptBid, 
  onRejectBid,
  isLoading = false 
}) => {
  const contractor = bid.contractor || bid.profiles;
  
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {contractor?.full_name || 'Professional Contractor'}
              </h4>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-foreground">
                  {contractor?.rating || 5.0}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({contractor?.total_reviews || 0})
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/50 text-xs font-mono">
            {timeLeft}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Bid Amount</p>
            <p className="text-2xl font-bold text-primary">${bid.amount}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Arrival Time</p>
            <p className="text-lg font-semibold text-foreground">{bid.eta_minutes || 60} mins</p>
          </div>
        </div>
        
        {bid.note && (
          <div className="p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Contractor Notes:</p>
            <p className="text-sm text-foreground leading-relaxed">{bid.note}</p>
          </div>
        )}
        
        {bid.status === 'pending' && timeLeft !== 'Expired' && (
          <div className="flex gap-3 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={() => onAcceptBid(bid.id)}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Bid
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              onClick={() => onRejectBid(bid.id)}
              disabled={isLoading}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {bid.status === 'accepted' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepted - Contractor will contact you
            </Badge>
          </div>
        )}
        
        {timeLeft === 'Expired' && bid.status === 'pending' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <Badge className="w-full justify-center bg-red-100 text-red-800 border-red-200">
              This bid has expired
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MemoizedBidCard.displayName = 'MemoizedBidCard';

export default MemoizedBidCard;