import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, bidService, realtimeService } from '@/lib/services';
import { useToast } from '@/components/ui/use-toast';

export const useRealtimeBooking = (bookingId, userId, userType = 'customer') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial booking data
  const loadBookingData = useCallback(async () => {
    if (!bookingId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Load booking details
      const { data: bookingData, error: bookingError } = await bookingService.getBookingById(bookingId);
      if (bookingError) throw bookingError;
      
      setBooking(bookingData);

      // Load bids if customer or if booking is finding contractor
      if (userType === 'customer' || bookingData?.status === 'finding_contractor') {
        const { data: bidsData, error: bidsError } = await bidService.getBidsForBooking(bookingId);
        if (!bidsError && bidsData) {
          setBids(bidsData);
        }
      }
    } catch (err) {
      console.error('Error loading booking data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId, user, userType]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!bookingId || !userId) return;

    // Subscribe to booking updates with userId
    const bookingChannel = realtimeService.subscribeToBookingUpdates(bookingId, userId, (payload) => {
      console.log('Booking update received:', payload);
      
      if (payload.new) {
        setBooking(prev => ({ ...prev, ...payload.new }));
        
        // Show notifications for stage changes with updated mappings
        if (payload.old && (payload.new.current_stage !== payload.old.current_stage || payload.new.status !== payload.old.status)) {
          const stageMessages = {
            'assigned': 'Contractor has been assigned!',
            'arriving': 'Contractor is on the way!',
            'work_started': 'Work has started on your booking',
            'in_progress': 'Job is in progress',
            'work_completed': 'Your booking has been completed!',
            'awaiting_payment': 'Ready for payment',
            'paid': 'Payment completed successfully'
          };
          
          const message = stageMessages[payload.new.current_stage] || stageMessages[payload.new.status];
          if (message) {
            toast({
              title: 'Job Progress Update',
              description: message,
            });
          }
        }
      }
    });

    // Subscribe to bid updates
    const bidChannel = realtimeService.subscribeToBids(bookingId, userId, (payload) => {
      console.log('🎯 Bid update received in useRealtimeBooking:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new) {
        // New bid submitted
        console.log('🎯 Processing new bid:', payload.new);
        setBids(prev => {
          const exists = prev.find(bid => bid.id === payload.new.id);
          if (!exists) {
            if (userType === 'customer') {
              toast({
                title: 'New Bid Received!',
                description: `A contractor has submitted a bid for $${payload.new.amount}`,
              });
            }
            return [...prev, payload.new];
          }
          return prev;
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Bid status updated
        console.log('🎯 Processing bid update:', payload.new);
        setBids(prev => 
          prev.map(bid => 
            bid.id === payload.new.id 
              ? { ...bid, ...payload.new }
              : bid
          )
        );
        
        // Show notifications for bid acceptance/rejection
        if (payload.new.status === 'accepted' && userType === 'contractor') {
          toast({
            title: 'Bid Accepted!',
            description: 'Your bid has been accepted by the customer',
          });
        }
      }
    });

    // Load initial data
    loadBookingData();

    // Cleanup subscriptions
    return () => {
      realtimeService.unsubscribe(bookingChannel);
      realtimeService.unsubscribe(bidChannel);
    };
  }, [bookingId, userId, userType, toast, loadBookingData]);

  // Accept a bid (customer only)
  const acceptBid = useCallback(async (bidId) => {
    if (!booking || userType !== 'customer') return { error: 'Unauthorized' };
    
    try {
      const { data, error } = await bidService.acceptBid(bidId, user.id);
      if (error) throw error;
      
      // Update local state
      setBooking(data.booking);
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, status: 'accepted' }
          : { ...bid, status: 'rejected' }
      ));
      
      toast({
        title: 'Bid Accepted!',
        description: 'The contractor has been assigned to your booking',
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Error accepting bid:', err);
      toast({
        title: 'Error',
        description: 'Failed to accept bid. Please try again.',
        variant: 'destructive',
      });
      return { data: null, error: err.message };
    }
  }, [booking, userType, user, toast]);

  // Update booking status
  const updateBookingStatus = useCallback(async (status, data = {}) => {
    if (!booking) return { error: 'No booking found' };
    
    try {
      const { data: updatedBooking, error } = await bookingService.updateBookingStatus(
        booking.id, 
        status, 
        data
      );
      
      if (error) throw error;
      
      setBooking(updatedBooking);
      
      toast({
        title: 'Status Updated',
        description: `Booking status updated to ${status}`,
      });
      
      return { data: updatedBooking, error: null };
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
      return { data: null, error: err.message };
    }
  }, [booking, toast]);

  return {
    booking,
    bids,
    loading,
    error,
    acceptBid,
    updateBookingStatus,
    refetch: loadBookingData
  };
};

// Hook for contractor to get available bookings with real-time updates
export const useAvailableBookings = (serviceType, contractorType) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAvailableJobs = useCallback(async () => {
    if (!serviceType || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: jobs, error: jobsError } = await bookingService.getAvailableBookings(
        serviceType, 
        contractorType
      );
      
      if (jobsError) throw jobsError;

      // Filter out rejected jobs and map data structure
      const rejectedJobs = JSON.parse(localStorage.getItem('rejectedJobs') || '[]');
      const filteredJobs = (jobs || [])
        .filter(job => !rejectedJobs.includes(job.id))
        .map(job => ({
          ...job,
          // Map Supabase field names to expected JobCard field names
          serviceType: job.service_type,
          bookingType: job.booking_type,
          scheduledDate: job.scheduled_date,
          scheduledTime: job.scheduled_time,
          priceRangeMin: job.price_range_min,
          priceRangeMax: job.price_range_max,
          uploadedImages: job.uploaded_images,
          customerName: job.customer_name
        }));

      setAvailableJobs(filteredJobs);
    } catch (err) {
      console.error('Error loading available jobs:', err);
      setError(err.message);
      setAvailableJobs([]);
    } finally {
      setLoading(false);
    }
  }, [serviceType, contractorType, user]);

  // Set up real-time subscription for new bookings
  useEffect(() => {
    if (!serviceType || !user) return;

    const channel = realtimeService.subscribeToAvailableBookings(serviceType, (payload) => {
      console.log('New booking available:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new) {
        const newJob = {
          ...payload.new,
          serviceType: payload.new.service_type,
          bookingType: payload.new.booking_type,
          scheduledDate: payload.new.scheduled_date,
          scheduledTime: payload.new.scheduled_time,
          priceRangeMin: payload.new.price_range_min,
          priceRangeMax: payload.new.price_range_max,
          uploadedImages: payload.new.uploaded_images,
          customerName: payload.new.customer_name
        };

        // Check if job matches contractor type and is not already in list
        if (payload.new.booking_type === contractorType || contractorType === 'saver') {
          setAvailableJobs(prev => {
            const exists = prev.find(job => job.id === payload.new.id);
            if (!exists) {
              toast({
                title: 'New Job Available!',
                description: `New ${payload.new.service_type} job posted`,
              });
              return [newJob, ...prev];
            }
            return prev;
          });
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Remove job if no longer available
        if (payload.new.status !== 'finding_contractor' || payload.new.contractor_id) {
          setAvailableJobs(prev => prev.filter(job => job.id !== payload.new.id));
        }
      }
    });

    loadAvailableJobs();

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [serviceType, contractorType, user, toast, loadAvailableJobs]);

  return {
    availableJobs,
    loading,
    error,
    refetch: loadAvailableJobs
  };
};