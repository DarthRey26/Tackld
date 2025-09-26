import { supabase } from '@/integrations/supabase/client';

export const bidService = {
  // Use RPC function for atomic bid submission
  async submitBidAtomic(bidData) {
    try {
      const { data, error } = await supabase.rpc('submit_bid_atomic', {
        booking_id_param: bidData.booking_id,
        contractor_id_param: bidData.contractor_id,
        amount_param: bidData.amount,
        eta_minutes_param: bidData.eta_minutes,
        note_param: bidData.note,
        materials_param: bidData.included_materials || []
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('❌ RPC bid submission error:', error);
      return { data: null, error };
    }
  },
  async createBid(bidData) {
    try {
      console.log('Creating bid with data:', bidData);
      
      // Check if contractor can bid on this booking
      const eligibilityCheck = await this.canContractorBid(bidData.booking_id, bidData.contractor_id);
      if (!eligibilityCheck.canBid) {
        console.error('❌ Contractor cannot bid:', eligibilityCheck.reason);
        return { data: null, error: { message: eligibilityCheck.reason } };
      }

      const bid = {
        booking_id: bidData.booking_id,
        contractor_id: bidData.contractor_id,
        amount: bidData.amount,
        eta_minutes: bidData.eta_minutes,
        note: bidData.note || null,
        proposed_start_time: bidData.proposed_start_time || null,
        proposed_end_time: bidData.proposed_end_time || null,
        included_materials: bidData.included_materials || [],
        terms: bidData.terms || {
          warranty_days: 30,
          payment_terms: 'upon_completion'
        },
        expires_at: bidData.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'pending' // Use valid status from constraint
      };

      const { data, error } = await supabase
        .from('bids')
        .insert(bid)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Bid created successfully:', data);

      // Update contractor stats - get current value and increment
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_bids_submitted')
        .eq('id', bidData.contractor_id)
        .single();

      if (currentProfile) {
        await supabase
          .from('profiles')
          .update({
            total_bids_submitted: (currentProfile.total_bids_submitted || 0) + 1
          })
          .eq('id', bidData.contractor_id);
        
        console.log('✅ Updated contractor bid count');
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Create bid error:', error);
      return { data: null, error };
    }
  },

  // Get bids for a specific booking (for customers to view) - enhanced with booking details
  async getBidsForBooking(bookingId) {
    try {
      console.log('🔍 Fetching bids for booking:', bookingId);
      
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles!bids_contractor_id_fkey (
            full_name,
            rating,
            total_reviews,
            total_jobs_completed,
            profile_photo_url,
            contractor_type,
            company_name,
            phone_number,
            email,
            account_type,
            bio,
            years_experience,
            is_verified
          ),
          bookings!bids_booking_id_fkey (
            id,
            customer_id,
            photos,
            uploaded_images,
            service_questions,
            additional_parts,
            description,
            notes
          )
        `)
        .eq('booking_id', bookingId)
        .in('status', ['pending', 'accepted'])
        .gt('expires_at', new Date().toISOString()) // Only get non-expired bids
        .order('amount', { ascending: true });

      console.log('📊 Raw bid data from Supabase:', { data, error, bookingId });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }
      
      // Check if we got any data
      if (!data || data.length === 0) {
        console.log('⚠️ No bids found for booking:', bookingId);
        return { data: [], error: null };
      }

      // Map contractor data properly for backwards compatibility
      const mappedData = data?.map(bid => {
        console.log('🔄 Processing bid:', bid.id, 'contractor:', bid.profiles?.full_name);
        return {
          ...bid,
          contractor: bid.profiles,
          booking: bid.bookings
        };
      }) || [];

      console.log('✅ Successfully mapped bid data:', mappedData.length, 'bids');
      return { data: mappedData, error: null };
    } catch (error) {
      console.error('❌ Get bids error:', error);
      return { data: null, error };
    }
  },

  // Get contractor's bids (OPTIMIZED)
  async getContractorBids(contractorId, status = null) {
    try {
      let query = supabase
        .from('bids')
        .select(`
          *,
          bookings!bids_booking_id_fkey (
            service_type,
            customer_name,
            address,
            status,
            scheduled_date,
            scheduled_time,
            description
          )
        `)
        .eq('contractor_id', contractorId)
        .in('status', ['pending', 'accepted']); // Only show pending and accepted bids, exclude rejected/expired

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Clean up expired bids automatically
      await this.cleanupExpiredBids();
      
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor bids error:', error);
      return { data: null, error };
    }
  },

  // Accept a bid using atomic RPC function
  async acceptBid(bidId, customerId) {
    try {
      const { data, error } = await supabase.rpc('accept_bid_atomic', {
        bid_id_param: bidId,
        customer_id_param: customerId
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept bid');
      }

      return { data: data, error: null };
    } catch (error) {
      console.error('Accept bid error:', error);
      return { data: null, error };
    }
  },

  // Reject a bid using atomic RPC function
  async rejectBid(bidId, customerId, reason = '') {
    try {
      const { data, error } = await supabase.rpc('reject_bid_atomic', {
        bid_id_param: bidId,
        customer_id_param: customerId,
        reason_param: reason
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to reject bid');
      }

      return { data: data, error: null };
    } catch (error) {
      console.error('Reject bid error:', error);
      return { data: null, error };
    }
  },

  // Get bid by ID (FIXED FOREIGN KEY)
  async getBidById(bidId) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles!bids_contractor_id_fkey (
            full_name,
            rating,
            total_reviews,
            profile_photo_url,
            contractor_type,
            company_name
          ),
          bookings!bids_booking_id_fkey (
            service_type,
            customer_name,
            address,
            description,
            customer_id
          )
        `)
        .eq('id', bidId)
        .single();

      if (error) throw error;
      
      // Map contractor data properly for backwards compatibility
      const bidWithContractor = {
        ...data,
        contractor: data.profiles,
        booking: data.bookings
      };
      
      return { data: bidWithContractor, error: null };
    } catch (error) {
      console.error('Get bid by ID error:', error);
      return { data: null, error };
    }
  },

  // Submit a bid using atomic RPC function
  async submitBid(bidData) {
    console.log('📝 Submitting bid with data:', bidData);
    
    // Validate required fields
    if (!bidData.booking_id || !bidData.contractor_id || !bidData.amount || !bidData.eta_minutes) {
      console.error('❌ Missing required bid data:', { bidData });
      return { data: null, error: { message: 'Missing required bid data' } };
    }

    // Ensure amount is a number
    const amount = parseFloat(bidData.amount);
    const eta_minutes = parseInt(bidData.eta_minutes);
    
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid bid amount:', amount);
      return { data: null, error: { message: 'Invalid bid amount' } };
    }

    if (isNaN(eta_minutes) || eta_minutes <= 0) {
      console.error('❌ Invalid ETA minutes:', eta_minutes);
      return { data: null, error: { message: 'Invalid ETA minutes' } };
    }

    try {
      console.log('🔧 Calling submit_bid_atomic RPC with validated data:', {
        booking_id_param: bidData.booking_id,
        contractor_id_param: bidData.contractor_id,
        amount_param: amount,
        eta_minutes_param: eta_minutes,
        note_param: bidData.note || null,
        materials_param: bidData.included_materials || []
      });
      
      const { data, error } = await supabase.rpc('submit_bid_atomic', {
        booking_id_param: bidData.booking_id,
        contractor_id_param: bidData.contractor_id,
        amount_param: amount,
        eta_minutes_param: eta_minutes,
        note_param: bidData.note || null,
        materials_param: bidData.included_materials || []
      });

      if (error) {
        console.error('❌ RPC submit_bid_atomic error:', error);
        // Check for specific RPC errors
        if (error.code === 'PGRST202') {
          console.error('❌ RPC function not found or permissions issue');
          return { data: null, error: { message: 'RPC function not available. Please contact support.' } };
        } else if (error.code === 'PGRST301') {
          console.error('❌ RLS policy violation');
          return { data: null, error: { message: 'Permission denied. Please check your contractor status.' } };
        }
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from RPC');
        return { data: null, error: { message: 'No response from server' } };
      }

      if (!data.success) {
        console.error('❌ RPC returned failure:', data.error);
        throw new Error(data.error || 'Failed to submit bid');
      }

      console.log('✅ Bid submission successful:', data);
      return { data: data.bid, error: null };
    } catch (error) {
      console.error('❌ Submit bid error:', error);
      
      // Enhanced error handling
      let errorMessage = error.message || 'Failed to submit bid';
      
      if (error.message?.includes('duplicate')) {
        errorMessage = 'You have already submitted a bid for this booking';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Booking not found or no longer accepting bids';
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage = 'Permission denied. Please check your contractor status.';
      }
      
      return { data: null, error: { ...error, message: errorMessage } };
    }
  },

  // Check if contractor can bid on booking
  async canContractorBid(bookingId, contractorId) {
    try {
      // Check if contractor already has an active bid for this booking (exclude expired)
      const { data: existingBid, error: bidError } = await supabase
        .from('bids')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('contractor_id', contractorId)
        .in('status', ['pending', 'accepted', 'rejected'])
        .single();

      if (bidError && bidError.code !== 'PGRST116') throw bidError;

      if (existingBid) {
        return { canBid: false, reason: 'You have already submitted a bid for this booking' };
      }

      // Check if booking is still accepting bids
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('status, service_type')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      if (!['finding_contractor', 'pending_bids'].includes(booking.status)) {
        return { canBid: false, reason: 'This booking is no longer accepting bids' };
      }

      // Check if contractor serves this service type
      const { data: contractor, error: contractorError } = await supabase
        .from('profiles')
        .select('service_type, is_available')
        .eq('id', contractorId)
        .eq('account_type', 'contractor')
        .single();

      if (contractorError) throw contractorError;

      if (contractor.service_type !== booking.service_type) {
        return { canBid: false, reason: 'This booking is not for your service type' };
      }

      if (!contractor.is_available) {
        return { canBid: false, reason: 'Your account is currently unavailable for new bookings' };
      }

      return { canBid: true, reason: null };
    } catch (error) {
      console.error('Can contractor bid error:', error);
      return { canBid: false, reason: 'Error checking bid eligibility' };
    }
  },

  // Get enhanced contractor dashboard data
  async getEnhancedContractorDashboard(contractorId) {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_contractor_dashboard', {
        contractor_id_param: contractorId
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to get contractor dashboard');
      }

      return { data: data, error: null };
    } catch (error) {
      console.error('Get enhanced contractor dashboard error:', error);
      return { data: null, error };
    }
  },

  // Clean up expired bids
  async cleanupExpiredBids() {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_bids');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Cleanup expired bids error:', error);
      return { data: null, error };
    }
  }
};