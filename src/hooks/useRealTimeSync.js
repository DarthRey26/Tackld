import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';

export const useRealTimeSync = () => {
  const { user, userType } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!user || !userType) return;

    try {
      setError(null);
      
      // Supabase realtime is always connected, so we just mark as connected
      setIsConnected(true);
      setReconnectAttempts(0);
      
      showSuccessToast('Connected to real-time updates');
    } catch (err) {
      setError(err);
      setIsConnected(false);
      
      // Implement exponential backoff for reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts) * 1000;
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        showErrorToast('Failed to connect to real-time updates after multiple attempts');
      }
    }
  }, [user, userType, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    realtimeService.unsubscribeAll();
    setIsConnected(false);
    setError(null);
    setReconnectAttempts(0);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    realtimeService
  };
};

export const useBookingUpdates = (onBookingUpdate) => {
  const { realtimeService, isConnected } = useRealTimeSync();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!isConnected || !user) return;

    const handleNewBooking = (booking) => {
      setBookings(prev => {
        const exists = prev.find(b => b.id === booking.id);
        if (!exists) {
          return [...prev, booking];
        }
        return prev;
      });
      onBookingUpdate?.('new_booking', booking);
    };

    const handleBookingUpdate = (updatedBooking) => {
      setBookings(prev => 
        prev.map(booking => 
          booking.id === updatedBooking.id ? updatedBooking : booking
        )
      );
      onBookingUpdate?.('booking_update', updatedBooking);
    };

    const handleBookingCancelled = (cancelledBooking) => {
      setBookings(prev => 
        prev.filter(booking => booking.id !== cancelledBooking.id)
      );
      onBookingUpdate?.('booking_cancelled', cancelledBooking);
    };

    // Set up Supabase realtime subscriptions
    const unsubscribeBookings = realtimeService.subscribeToCustomerBookings(user.id, handleBookingUpdate);
    
    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, [isConnected, realtimeService, onBookingUpdate, user]);

  return {
    bookings,
    setBookings,
    isConnected
  };
};

export const useBidUpdates = (onBidUpdate) => {
  const { realtimeService, isConnected } = useRealTimeSync();
  const { user } = useAuth();
  const [bids, setBids] = useState([]);

  useEffect(() => {
    if (!isConnected || !user) return;

    const handleNewBid = (bid) => {
      setBids(prev => {
        const exists = prev.find(b => b.id === bid.id);
        if (!exists) {
          return [...prev, bid];
        }
        return prev;
      });
      onBidUpdate?.('new_bid', bid);
    };

    const handleBidAccepted = (acceptedBid) => {
      setBids(prev => 
        prev.map(bid => 
          bid.id === acceptedBid.id ? { ...bid, status: 'accepted' } : bid
        )
      );
      onBidUpdate?.('bid_accepted', acceptedBid);
    };

    const handleBidRejected = (rejectedBid) => {
      setBids(prev => 
        prev.map(bid => 
          bid.id === rejectedBid.id ? { ...bid, status: 'rejected' } : bid
        )
      );
      onBidUpdate?.('bid_rejected', rejectedBid);
    };

    // Set up Supabase realtime subscriptions for notifications
    const unsubscribeNotifications = realtimeService.subscribeToNotifications(user.id, (notification) => {
      if (notification.type === 'new_bid') {
        handleNewBid(notification.data);
      } else if (notification.type === 'bid_accepted') {
        handleBidAccepted(notification.data);
      } else if (notification.type === 'bid_rejected') {
        handleBidRejected(notification.data);
      }
    });

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [isConnected, realtimeService, onBidUpdate, user]);

  return {
    bids,
    setBids,
    isConnected
  };
};

export const useJobProgressUpdates = (onProgressUpdate) => {
  const { realtimeService, isConnected } = useRealTimeSync();
  const { user } = useAuth();

  useEffect(() => {
    if (!isConnected || !user) return;

    const handleProgressUpdate = (progressData) => {
      showSuccessToast(`Job progress updated: ${progressData.stage}`);
      onProgressUpdate?.(progressData);
    };

    const handleExtraPartsRequest = (partsData) => {
      showSuccessToast('Contractor requested extra parts approval');
      onProgressUpdate?.(partsData);
    };

    const handleRescheduleRequest = (rescheduleData) => {
      showSuccessToast('Contractor requested to reschedule');
      onProgressUpdate?.(rescheduleData);
    };

    // Set up Supabase realtime subscriptions for booking updates
    const unsubscribeBookings = realtimeService.subscribeToCustomerBookings(
      user.id, 
      (booking) => {
        handleProgressUpdate(booking);
      }
    );

    const unsubscribeNotifications = realtimeService.subscribeToNotifications(
      user.id, 
      (notification) => {
        if (notification.type === 'progress_update') {
          handleProgressUpdate(notification.data);
        } else if (notification.type === 'extra_parts_request') {
          handleExtraPartsRequest(notification.data);
        } else if (notification.type === 'reschedule_request') {
          handleRescheduleRequest(notification.data);
        }
      }
    );

    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [isConnected, realtimeService, onProgressUpdate, user]);

  return {
    isConnected
  };
};