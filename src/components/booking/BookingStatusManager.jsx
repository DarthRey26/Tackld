import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/lib/services';
import { useToast } from '@/components/ui/use-toast';

const BookingStatusManager = ({ booking, onStatusUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync booking status progression based on database changes
  useEffect(() => {
    if (!booking || !onStatusUpdate) return;

    const syncStatus = () => {
      // Ensure UI reflects actual database status
      const statusMap = {
        'pending_bids': 'finding_contractor',
        'assigned': 'contractor_assigned', 
        'arriving': 'contractor_arriving',
        'work_started': 'job_in_progress',
        'in_progress': 'job_in_progress', 
        'work_completed': 'awaiting_payment',
        'completed': 'awaiting_payment',
        'paid': 'job_completed'
      };

      const displayStatus = statusMap[booking.status] || booking.status;
      
      if (booking.payment_status === 'paid') {
        onStatusUpdate({
          ...booking,
          displayStatus: 'job_completed',
          current_stage: 'payment_completed'
        });
      } else {
        onStatusUpdate({
          ...booking,
          displayStatus,
          current_stage: booking.current_stage || booking.status
        });
      }
    };

    syncStatus();
  }, [booking?.status, booking?.payment_status, booking?.current_stage, onStatusUpdate]);

  const handleStatusTransition = async (newStatus, stageData = {}) => {
    if (!booking || !user) return;

    setIsUpdating(true);
    
    try {
      const { data: updatedBooking, error } = await bookingService.updateBookingStatus(
        booking.id,
        newStatus,
        stageData
      );

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus.replace('_', ' ')}`,
      });

      // Trigger callback with updated booking
      onStatusUpdate?.(updatedBooking);

    } catch (error) {
      console.error('Status transition error:', error);
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate final price including extra parts
  const calculateFinalPrice = (booking) => {
    const basePrice = parseFloat(booking.estimated_price) || 0;
    const extraPartsTotal = (booking.extra_parts || []).reduce((total, part) => {
      return total + (parseFloat(part.total_price) || 0);
    }, 0);
    
    return (basePrice + extraPartsTotal).toFixed(2);
  };

  // Validate price calculations to prevent NaN
  const validatePriceData = (booking) => {
    return {
      ...booking,
      estimated_price: isNaN(parseFloat(booking.estimated_price)) ? 0 : parseFloat(booking.estimated_price),
      final_price: isNaN(parseFloat(booking.final_price)) ? calculateFinalPrice(booking) : parseFloat(booking.final_price),
      extra_parts: (booking.extra_parts || []).map(part => ({
        ...part,
        unit_price: isNaN(parseFloat(part.unit_price)) ? 0 : parseFloat(part.unit_price),
        total_price: isNaN(parseFloat(part.total_price)) ? 0 : parseFloat(part.total_price)
      }))
    };
  };

  // This component manages state, doesn't render UI
  return null;
};

export default BookingStatusManager;