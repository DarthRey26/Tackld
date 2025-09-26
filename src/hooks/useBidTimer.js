import { useState, useEffect, useCallback } from 'react';

// Simplified bid timer hook with centralized countdown management
export const useBidTimer = (bids = []) => {
  const [timers, setTimers] = useState(new Map());

  const updateTimer = useCallback((bidId, expiresAt, createdAt) => {
    const now = Date.now();
    const expiry = new Date(expiresAt || new Date(createdAt).getTime() + 30 * 60 * 1000).getTime();
    const timeLeft = expiry - now;

    if (timeLeft <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!bids.length) return;

    const interval = setInterval(() => {
      const newTimers = new Map();
      
      bids.forEach(bid => {
        if (bid.status === 'pending') {
          const timeLeft = updateTimer(bid.id, bid.expires_at, bid.created_at);
          newTimers.set(bid.id, timeLeft);
        }
      });

      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [bids, updateTimer]);

  const getTimeLeft = useCallback((bidId) => {
    return timers.get(bidId) || 'Expired';
  }, [timers]);

  return { getTimeLeft, timers };
};