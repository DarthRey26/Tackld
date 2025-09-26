import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, bidService, realtimeService } from '@/lib/services';
import { useToast } from '@/components/ui/use-toast';

// Real-time hook for contractor dashboard
export const useContractorRealtime = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeJob, setActiveJob] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    availableJobs: [],
    contractorBids: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load enhanced dashboard data
      const { data: dashboardResponse, error: dashboardError } = await bidService.getEnhancedContractorDashboard(user.id);
      
      if (dashboardError) throw dashboardError;

      if (dashboardResponse) {
        // Filter out rejected jobs from localStorage
        const rejectedJobIds = JSON.parse(localStorage.getItem('rejectedJobs') || '[]');
        const filteredJobs = (dashboardResponse.available_jobs || []).filter(job => 
          !rejectedJobIds.includes(job.id) && 
          job.status === 'finding_contractor' &&
          !job.contractor_id
        );
        
        setDashboardData({
          availableJobs: filteredJobs,
          contractorBids: dashboardResponse.contractor_bids || []
        });
      }

      // Check for active job
      const { data: activeBookings } = await bookingService.getContractorBookings(
        user.id, 
        ['assigned', 'arriving', 'work_started', 'in_progress', 'work_completed']
      );
      
      if (activeBookings && activeBookings.length > 0) {
        setActiveJob(activeBookings[0]);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    let channels = [];

    // Subscribe to contractor-specific bookings
    const contractorBookingsChannel = realtimeService.subscribeToContractorBookings(user.id, (payload) => {
      console.log('Contractor booking update:', payload);
      
      if (payload.eventType === 'UPDATE' && payload.new) {
        // Update active job if it matches
        if (activeJob && payload.new.id === activeJob.id) {
          setActiveJob({ ...activeJob, ...payload.new });
          
          // Show notifications for important status changes
          const statusMessages = {
            cancelled: 'Your active job has been cancelled by the customer',
            completed: 'Job marked as completed! Payment is being processed.',
            paid: 'Payment received! Job completed successfully.'
          };
          
          if (statusMessages[payload.new.status] && payload.new.status !== activeJob.status) {
            toast({
              title: 'Job Update',
              description: statusMessages[payload.new.status],
            });
          }
        }
      }
    });
    channels.push(contractorBookingsChannel);

    // Subscribe to available bookings for contractor's service type
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.service_type) {
      const availableJobsChannel = realtimeService.subscribeToAvailableBookings(
        userProfile.service_type, 
        user?.id,
        (payload) => {
          console.log('New available job:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Check if job matches contractor type
            const contractorType = userProfile.contractor_type || 'saver';
            const jobBookingType = payload.new.booking_type;
            
            const isMatch = contractorType === 'tacklers_choice' 
              ? jobBookingType === 'tacklers_choice'
              : ['saver', 'open_tender'].includes(jobBookingType);
            
            if (isMatch) {
              setDashboardData(prev => ({
                ...prev,
                availableJobs: [payload.new, ...prev.availableJobs]
              }));
              
              toast({
                title: 'New Job Available!',
                description: `New ${payload.new.service_type} job posted`,
              });
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Remove job if no longer available
            if (payload.new.status !== 'finding_contractor' || payload.new.contractor_id) {
              setDashboardData(prev => ({
                ...prev,
                availableJobs: prev.availableJobs.filter(job => job.id !== payload.new.id)
              }));
            }
          }
        }
      );
      channels.push(availableJobsChannel);
    }

    // Subscribe to bid updates for contractor - don't pass 'all' as bookingId, use null/undefined
    const bidUpdatesChannel = realtimeService.subscribeToBids(null, user.id, (payload) => {
      console.log('Contractor bid update:', payload);
      
      if (payload.eventType === 'UPDATE' && payload.new && payload.new.contractor_id === user.id) {
        // Update contractor bids
        setDashboardData(prev => ({
          ...prev,
          contractorBids: prev.contractorBids.map(bid =>
            bid.id === payload.new.id ? { ...bid, ...payload.new } : bid
          )
        }));
        
        // Show notification for bid acceptance
        if (payload.new.status === 'accepted' && payload.old?.status !== 'accepted') {
          toast({
            title: 'Bid Accepted!',
            description: 'Your bid has been accepted by the customer',
          });
          
          // Refresh to get updated active job
          loadDashboardData();
        }
      }
    });
    channels.push(bidUpdatesChannel);

    // Subscribe to extra parts and reschedule requests
    const extraPartsChannel = realtimeService.subscribeToExtraPartsRequests(user.id, (payload) => {
      if (payload.eventType === 'UPDATE' && activeJob) {
        toast({
          title: 'Extra Parts Update',
          description: payload.new.status === 'approved' 
            ? 'Your extra parts request has been approved'
            : 'Extra parts request status updated',
        });
      }
    });
    channels.push(extraPartsChannel);

    const rescheduleChannel = realtimeService.subscribeToRescheduleRequests(user.id, (payload) => {
      if (payload.eventType === 'UPDATE' && activeJob) {
        toast({
          title: 'Reschedule Update',
          description: payload.new.status === 'approved'
            ? 'Your reschedule request has been approved'
            : 'Reschedule request status updated',
        });
      }
    });
    channels.push(rescheduleChannel);

    // Load initial data
    loadDashboardData();

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        if (channel) realtimeService.unsubscribe(channel);
      });
    };
  }, [user?.id, activeJob?.id, toast, loadDashboardData]);

  // Update job status
  const updateJobStatus = useCallback(async (status, data = {}) => {
    if (!activeJob) return { error: 'No active job found' };
    
    try {
      const { data: updatedJob, error } = await bookingService.updateBookingStatus(
        activeJob.id, 
        status, 
        data
      );
      
      if (error) throw error;
      
      setActiveJob(updatedJob);
      
      toast({
        title: 'Status Updated',
        description: `Job status updated to ${status}`,
      });
      
      return { data: updatedJob, error: null };
    } catch (err) {
      console.error('Error updating job status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
      return { data: null, error: err.message };
    }
  }, [activeJob, toast]);

  // Complete job with automatic payment processing
  const completeJob = useCallback(async () => {
    if (!activeJob) return { error: 'No active job found' };
    
    try {
      const { data: completedJob, error } = await bookingService.completeBooking(activeJob.id);
      
      if (error) throw error;
      
      setActiveJob(null); // Clear active job
      
      toast({
        title: 'Job Completed!',
        description: 'Job marked as completed and payment has been processed.',
      });
      
      // Refresh dashboard data
      await loadDashboardData();
      
      return { data: completedJob, error: null };
    } catch (err) {
      console.error('Error completing job:', err);
      toast({
        title: 'Error',
        description: 'Failed to complete job',
        variant: 'destructive',
      });
      return { data: null, error: err.message };
    }
  }, [activeJob, toast, loadDashboardData]);

  return {
    activeJob,
    dashboardData,
    loading,
    error,
    updateJobStatus,
    completeJob,
    refreshData: loadDashboardData
  };
};

// Hook for real-time progress updates
export const useJobProgressRealtime = (bookingId) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    if (!bookingId || !user?.id) return;

    const channel = realtimeService.subscribeToBookingUpdates(bookingId, user.id, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        setProgressData(prev => ({ ...prev, ...payload.new }));
        
        // Show notifications for progress updates
        if (payload.new.eta && payload.old?.eta !== payload.new.eta) {
          toast({
            title: 'ETA Updated',
            description: `Contractor ETA: ${payload.new.eta} minutes`,
          });
        }
      }
    });

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [bookingId, toast]);

  return { progressData };
};