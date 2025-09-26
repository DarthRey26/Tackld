import { supabase } from '@/integrations/supabase/client';

export const jobProgressService = {
  // Upload photos to Supabase Storage
  uploadProgressPhotos: async (bookingId, files, stageType) => {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${bookingId}/${stageType}/${Date.now()}_${index}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('job-images')
          .upload(fileName, file);
          
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(fileName);
          
        return publicUrl;
      });
      
      const photoUrls = await Promise.all(uploadPromises);
      return { success: true, photoUrls };
    } catch (error) {
      console.error('Error uploading photos:', error);
      return { success: false, error: error.message };
    }
  },

  // Update booking stage with photos
  updateBookingStageWithPhotos: async (bookingId, contractorId, newStage, photoFiles = [], stageType = 'during') => {
    try {
      console.log('Updating booking stage with photos:', { bookingId, contractorId, newStage, stageType });
      
      let photoUrls = [];
      
      // Upload photos if provided
      if (photoFiles.length > 0) {
        const uploadResult = await jobProgressService.uploadProgressPhotos(bookingId, photoFiles, stageType);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
        photoUrls = uploadResult.photoUrls;
      }
      
      // Update all fields including photos in one operation
      const statusMap = {
        'arriving': 'assigned',
        'work_started': 'job_started',
        'in_progress': 'in_progress', 
        'work_completed': 'completed',
        'awaiting_payment': 'awaiting_payment',
        'paid': 'paid'
      };

      const statusValue = statusMap[newStage] || newStage;

      // Prepare photo update based on stage type
      const photoUpdate = {};
      if (photoUrls.length > 0) {
        photoUpdate[`${stageType}_photos`] = photoUrls;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          current_stage: newStage,
          status: statusValue,
          stage_photos: photoUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('contractor_id', contractorId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating booking stage with photos:', error);
        throw error;
      }
      
      console.log('Successfully updated booking stage with photos:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating booking stage:', error);
      return { success: false, error: error.message };
    }
  },

  // Get booking progress photos
  getBookingProgressPhotos: async (bookingId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('stage_photos')
        .eq('id', bookingId)
        .single();
        
      if (error) throw error;
      
      return { success: true, photos: data.stage_photos };
    } catch (error) {
      console.error('Error fetching progress photos:', error);
      return { success: false, error: error.message };
    }
  },

  // Update just the job stage (without photos) and sync status
  updateJobStage: async (bookingId, contractorId, newStage) => {
    try {
      console.log('Updating job stage:', { bookingId, contractorId, newStage });
      
      // Map stages to status values
      const statusMap = {
        'arriving': 'assigned',
        'work_started': 'job_started',
        'in_progress': 'in_progress', 
        'work_completed': 'completed',
        'awaiting_payment': 'awaiting_payment',
        'paid': 'paid'
      };

      const statusValue = statusMap[newStage] || newStage;

      // Update all stage-related fields in one atomic operation
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          current_stage: newStage,
          status: statusValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('contractor_id', contractorId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating booking stage:', error);
        throw error;
      }

      console.log('Successfully updated job stage:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating job stage:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper function to calculate stage completion percentage
  getStageCompletionPercentage: (stage) => {
    const stageMap = {
      'pending_bids': 0,
      'finding_contractor': 0,
      'assigned': 14,
      'arriving': 28,
      'work_started': 42,
      'in_progress': 57,
      'work_completed': 71,
      'awaiting_payment': 86,
      'completed': 86,
      'paid': 100
    };
    return stageMap[stage] || 0;
  },

  // Get available jobs with proper data access control
  getAvailableJobsForContractor: async (contractorId, serviceType) => {
    try {
      // Use the view that handles data access control
      const { data, error } = await supabase
        .from('contractor_available_jobs')
        .select('*')
        .eq('service_type', serviceType)
        .in('status', ['pending_bids', 'finding_contractor'])
        .is('contractor_id', null)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { success: true, jobs: data };
    } catch (error) {
      console.error('Error fetching available jobs:', error);
      return { success: false, error: error.message };
    }
  },

  // Get contractor's assigned jobs with full access
  getContractorAssignedJobs: async (contractorId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('contractor_id', contractorId)
        .in('status', ['assigned', 'arriving', 'work_started', 'in_progress', 'work_completed'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { success: true, jobs: data };
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to job progress updates
  subscribeToJobProgress: (bookingId, callback) => {
    const channel = supabase
      .channel(`booking_progress_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};