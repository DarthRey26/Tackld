import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

const BidExpiryTimer = ({ bidCreatedAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!bidCreatedAt) return;

    const calculateTimeLeft = () => {
      const createdTime = new Date(bidCreatedAt).getTime();
      const expiryTime = createdTime + (30 * 60 * 1000); // 30 minutes
      const now = new Date().getTime();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        if (!isExpired) {
          setIsExpired(true);
          onExpired?.();
        }
        return;
      }

      setTimeLeft(remaining);
    };

    // Calculate initial time
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [bidCreatedAt, isExpired, onExpired]);

  const formatTime = (milliseconds) => {
    if (milliseconds <= 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isExpired) return 'bg-red-100 text-red-800';
    if (timeLeft < 5 * 60 * 1000) return 'bg-orange-100 text-orange-800'; // Less than 5 minutes
    if (timeLeft < 10 * 60 * 1000) return 'bg-yellow-100 text-yellow-800'; // Less than 10 minutes
    return 'bg-green-100 text-green-800';
  };

  const getIcon = () => {
    if (isExpired || timeLeft < 5 * 60 * 1000) {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  if (isExpired) {
    return (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </Badge>
    );
  }

  return (
    <Badge className={`${getTimerColor()} flex items-center gap-1`}>
      {getIcon()}
      {formatTime(timeLeft)}
    </Badge>
  );
};

export default BidExpiryTimer;