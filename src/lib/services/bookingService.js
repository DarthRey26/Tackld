import { supabase } from '@/integrations/supabase/client';

export const bookingService = {
  // Create a new booking
  async createBooking(bookingData) {
    try {
      // Get service ID by category if not provided
      let serviceId = bookingData.service_id;
      if (!serviceId) {
        const { data: service } = await supabase
          .from('services')
          .select('id')
          .eq('category', bookingData.service_type)
          .single();
        serviceId = service?.id;
      }

      const booking = {
        customer_id: bookingData.customer_id,
        customer_name: bookingData.customer_name,
        customer_phone: bookingData.customer_phone,
        customer_email: bookingData.customer_email,
        service_id: serviceId,
        service_type: bookingData.service_type,
        booking_type: bookingData.booking_type || 'saver',
        address: bookingData.address,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        urgency: bookingData.urgency || 'normal',
        asap: bookingData.asap || false,
        price_range_min: bookingData.price_range_min,
        price_range_max: bookingData.price_range_max,
        estimated_price: bookingData.estimated_price,
        description: bookingData.description,
        notes: bookingData.notes,
        service_questions: bookingData.service_questions || {},
        service_answers: bookingData.service_answers || bookingData.service_questions || {},
        uploaded_images: bookingData.uploaded_images || [],
        status: 'finding_contractor' // Correct initial status per constraint
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create booking error:', error);
      return { data: null, error };
    }
  },

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          contractor:profiles!contractor_id(full_name, rating, profile_photo_url, phone_number),
          customer:profiles!customer_id(full_name, phone_number),
          extra_parts(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get booking by ID error:', error);
      return { data: null, error };
    }
  },

  // Get bookings for contractor
  async getContractorBookings(contractorId, status = null) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          customer:profiles!customer_id(full_name, phone_number)
        `)
        .eq('contractor_id', contractorId);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor bookings error:', error);
      return { data: null, error };
    }
  },

  // Get bookings for a customer
  async getCustomerBookings(customerId, status = null) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          contractor:profiles!contractor_id(full_name, rating, profile_photo_url),
          extra_parts(*)
        `)
        .eq('customer_id', customerId);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get customer bookings error:', error);
      return { data: null, error };
    }
  },

  // Get available bookings for contractors
  async getAvailableBookings(serviceType, contractorType) {
    try {
      console.log(`🔍 Filtering bookings for: serviceType="${serviceType}", contractorType="${contractorType}"`);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          customer:profiles!customer_id(full_name)
        `)
        .eq('status', 'finding_contractor')
        .eq('service_type', serviceType)
        .is('contractor_id', null);

      console.log('📋 Base query created, adding booking type filter...');

      // Filter by booking type based on contractor type
      if (contractorType === 'tacklers_choice') {
        query = query.eq('booking_type', 'tacklers_choice');
        console.log('🎯 Filtering for tacklers_choice bookings only');
      } else if (contractorType === 'saver') {
        query = query.in('booking_type', ['saver', 'open_tender']);
        console.log('💰 Filtering for saver and open_tender bookings');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('📊 Query results:', { data: data?.length || 0, error });
      if (data) {
        console.log('📝 Available bookings:', data.map(b => ({
          id: b.id,
          service_type: b.service_type,
          booking_type: b.booking_type,
          status: b.status,
          customer_name: b.customer_name
        })));
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ Get available bookings error:', error);
      return { data: null, error };
    }
  },

  // Get contractor bookings
  async getContractorBookings(contractorId, status = null) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          customer:profiles!customer_id(full_name, phone_number)
        `)
        .eq('contractor_id', contractorId);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor bookings error:', error);
      return { data: null, error };
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId, status, updates = {}) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update booking status error:', error);
      return { data: null, error };
    }
  },

  // Update booking progress
  async updateProgress(bookingId, stage, completion = null) {
    try {
      const progress = {
        current_stage: stage,
        stage_completion: completion || 0,
        last_updated: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .update({
          progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update progress error:', error);
      return { data: null, error };
    }
  },

  // Add job photos
  async addJobPhotos(bookingId, photoType, photoUrls) {
    try {
      // First get current photos
      const { data: booking } = await supabase
        .from('bookings')
        .select('photos')
        .eq('id', bookingId)
        .single();

      const currentPhotos = booking?.photos || { before: [], during: [], after: [] };
      
      // Add new photos
      if (!currentPhotos[photoType]) {
        currentPhotos[photoType] = [];
      }
      currentPhotos[photoType] = [...currentPhotos[photoType], ...photoUrls];

      const { data, error } = await supabase
        .from('bookings')
        .update({
          photos: currentPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add job photos error:', error);
      return { data: null, error };
    }
  },

  // Request additional parts
  async requestAdditionalParts(bookingId, parts) {
    try {
      // Get current additional parts
      const { data: booking } = await supabase
        .from('bookings')
        .select('additional_parts')
        .eq('id', bookingId)
        .single();

      const currentParts = booking?.additional_parts || [];
      const newParts = parts.map(part => ({
        ...part,
        approved_by_customer: false,
        requested_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('bookings')
        .update({
          additional_parts: [...currentParts, ...newParts],
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Request additional parts error:', error);
      return { data: null, error };
    }
  },

  // Approve additional parts
  async approveAdditionalParts(bookingId, partIndexes) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('additional_parts')
        .eq('id', bookingId)
        .single();

      if (!booking?.additional_parts) {
        throw new Error('No additional parts found');
      }

      const updatedParts = booking.additional_parts.map((part, index) => {
        if (partIndexes.includes(index)) {
          return { ...part, approved_by_customer: true };
        }
        return part;
      });

      const { data, error } = await supabase
        .from('bookings')
        .update({
          additional_parts: updatedParts,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Approve additional parts error:', error);
      return { data: null, error };
    }
  },

  // Request reschedule
  async requestReschedule(bookingId, newDate, reason) {
    try {
      const rescheduleRequest = {
        reason,
        new_date: newDate,
        approved: false,
        requested_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .update({
          reschedule_request: rescheduleRequest,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Request reschedule error:', error);
      return { data: null, error };
    }
  },

  // Approve reschedule
  async approveReschedule(bookingId, approved = true) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('reschedule_request')
        .eq('id', bookingId)
        .single();

      if (!booking?.reschedule_request) {
        throw new Error('No reschedule request found');
      }

      const updatedRequest = {
        ...booking.reschedule_request,
        approved,
        approved_at: new Date().toISOString()
      };

      const updates = {
        reschedule_request: updatedRequest,
        updated_at: new Date().toISOString()
      };

      // If approved, update the scheduled date
      if (approved && booking.reschedule_request.new_date) {
        updates.scheduled_date = booking.reschedule_request.new_date;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Approve reschedule error:', error);
      return { data: null, error };
    }
  },

  // Mark payment as completed
  async markPaymentCompleted(bookingId, paymentMethod = 'wallet') {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Mark payment completed error:', error);
      return { data: null, error };
    }
  },

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description, questions),
          customer:profiles!customer_id(full_name, phone_number, email),
          contractor:profiles!contractor_id(full_name, phone_number, rating, profile_photo_url),
          extra_parts(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get booking by ID error:', error);
      return { data: null, error };
    }
  },

  // Get active jobs for contractor
  async getContractorActiveJobs(contractorId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description),
          customer:profiles!customer_id(full_name, phone_number, email)
        `)
        .eq('contractor_id', contractorId)
        .in('status', ['contractor_found', 'arriving', 'job_started'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor active jobs error:', error);
      return { data: null, error };
    }
  },

  // Cancel booking
  async cancelBooking(bookingId, reason) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { data: null, error };
    }
  },

  // Complete booking
  async completeBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'awaiting_payment',
          actual_end: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Complete booking error:', error);
      return { data: null, error };
    }
  },

  // Upload progress photos
  async uploadProgressPhoto(bookingId, stage, photoUrl) {
    try {
      let updateData = { updated_at: new Date().toISOString() };
      let newStatus = null;

      // Determine which photo array to update and status progression
      if (stage === 'before') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('before_photos')
          .eq('id', bookingId)
          .single();
        
        const currentPhotos = booking?.before_photos || [];
        updateData.before_photos = [...currentPhotos, photoUrl];
        newStatus = 'job_started';
      } else if (stage === 'during') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('during_photos')
          .eq('id', bookingId)
          .single();
        
        const currentPhotos = booking?.during_photos || [];
        updateData.during_photos = [...currentPhotos, photoUrl];
        newStatus = 'in_progress';
      } else if (stage === 'after') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('after_photos')
          .eq('id', bookingId)
          .single();
        
        const currentPhotos = booking?.after_photos || [];
        updateData.after_photos = [...currentPhotos, photoUrl];
        newStatus = 'completed';
      }

      if (newStatus) {
        updateData.status = newStatus;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Upload progress photo error:', error);
      return { data: null, error };
    }
  },

  // DEPRECATED: Use extraPartsService.createExtraPartsRequest instead
  // This function is kept for backward compatibility but should not be used
  async addExtraParts(bookingId, partsArray) {
    console.warn('DEPRECATED: bookingService.addExtraParts is deprecated. Use extraPartsService.createExtraPartsRequest instead');
    return { data: null, error: new Error('This function is deprecated. Use extraPartsService.createExtraPartsRequest instead') };
  },

  // Approve or reject extra parts
  async updateExtraPartsStatus(bookingId, partId, status, rejectionReason = null) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('extra_parts')
        .eq('id', bookingId)
        .single();

      if (!booking?.extra_parts) {
        throw new Error('No extra parts found');
      }

      const updatedParts = booking.extra_parts.map(part => {
        if (part.id === partId) {
          return {
            ...part,
            status,
            reviewed_at: new Date().toISOString(),
            rejection_reason: rejectionReason
          };
        }
        return part;
      });

      const { data, error } = await supabase
        .from('bookings')
        .update({
          extra_parts: updatedParts,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update extra parts status error:', error);
      return { data: null, error };
    }
  },

  // Process payment
  async processPayment(bookingId, paymentMethod = 'wallet') {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'paid',
          current_stage: 'paid',
          payment_status: 'paid',
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Process payment error:', error);
      return { data: null, error };
    }
  },

  // Forfeit job (return to available pool)
  async forfeitJob(bookingId, reason) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'finding_contractor',
          contractor_id: null,
          forfeit_reason: reason,
          forfeited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Forfeit job error:', error);
      return { data: null, error };
    }
  }
};