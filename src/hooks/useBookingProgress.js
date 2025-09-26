import { useState, useEffect } from 'react';
import { jobProgressService } from '@/lib/services';

export const useBookingProgress = (booking) => {
  const [realTimeBooking, setRealTimeBooking] = useState(booking);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!booking?.id) return;

    console.log('Setting up real-time subscription for booking:', booking.id);
    
    // Update local state when booking prop changes
    setRealTimeBooking(booking);

    // Set up real-time subscription
    const unsubscribe = jobProgressService.subscribeToJobProgress(
      booking.id,
      (updatedBooking) => {
        console.log('Real-time booking update received:', {
          id: updatedBooking.id,
          current_stage: updatedBooking.current_stage,
          status: updatedBooking.status,
          payment_status: updatedBooking.payment_status
        });
        setRealTimeBooking(updatedBooking);
      }
    );

    setIsSubscribed(true);

    return () => {
      console.log('Cleaning up real-time subscription for booking:', booking.id);
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [booking?.id]);

  return {
    booking: realTimeBooking,
    isSubscribed
  };
};