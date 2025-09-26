import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Timer, X, Clock } from 'lucide-react';

const BidSubmittedIndicator = ({ status, amount, expiresAt, className = "" }) => {
  const getExpiryTime = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.max(0, expiry - now);
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (diff <= 0) return 'Expired';
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  switch (status) {
    case 'pending':
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
            <Timer className="w-3 h-3 mr-1" />
            Bid: ${amount}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Expires: {getExpiryTime()}
          </span>
        </div>
      );
    case 'accepted':
      return (
        <Badge variant="default" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted: ${amount}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="secondary" className={`bg-red-50 text-red-700 border-red-200 ${className}`}>
          <X className="w-3 h-3 mr-1" />
          Not selected
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return null;
  }
};

export default BidSubmittedIndicator;