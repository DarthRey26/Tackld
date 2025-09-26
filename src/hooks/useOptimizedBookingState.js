import React, { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Simplified optimized booking state management 
export const useOptimizedBookingState = (initialBooking = null) => {
  const [booking, setBooking] = useState(initialBooking);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Memoized booking status for performance
  const bookingStatus = useMemo(() => {
    if (!booking) return null;
    
    return {
      isActive: ['finding_contractor', 'assigned', 'contractor_arriving', 'job_started'].includes(booking.status),
      isPending: ['finding_contractor', 'pending_bids'].includes(booking.status),
      isCompleted: booking.status === 'completed',
      canAcceptBids: ['finding_contractor', 'pending_bids'].includes(booking.status),
      currentStage: booking.current_stage || booking.status
    };
  }, [booking?.status, booking?.current_stage]);

  // Memoized active bids count
  const activeBidsCount = useMemo(() => {
    return bids.filter(bid => 
      bid.status === 'pending' && 
      new Date(bid.expires_at || new Date(bid.created_at).getTime() + 30 * 60 * 1000) > new Date()
    ).length;
  }, [bids]);

  const updateBooking = useCallback((updates) => {
    setBooking(prev => ({ ...prev, ...updates }));
  }, []);

  const updateBids = useCallback((newBids) => {
    setBids(Array.isArray(newBids) ? newBids : []);
  }, []);

  const showSuccess = useCallback((message) => {
    toast({
      title: "Success",
      description: message,
    });
  }, [toast]);

  const showError = useCallback((message) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
    setError(message);
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    booking,
    bids,
    loading,
    error,
    bookingStatus,
    activeBidsCount,
    setLoading,
    updateBooking,
    updateBids,
    showSuccess,
    showError,
    clearError
  };
};