import { supabase } from '@/integrations/supabase/client';

export const extraPartsService = {
  // Create a new extra parts request
  async createExtraPartsRequest(requestData) {
    try {
      const extraPart = {
        booking_id: requestData.booking_id,
        part_name: requestData.part_name,
        quantity: requestData.quantity,
        unit_price: requestData.unit_price,
        total_price: requestData.total_price,
        reason: requestData.reason,
        photo_url: requestData.photo_url
      };

      const { data, error } = await supabase
        .from('extra_parts')
        .insert(extraPart)
        .select(`
          *,
          booking:bookings!booking_id(
            customer_id,
            customer_name,
            service_type,
            contractor_id
          )
        `)
        .single();

      if (error) throw error;

      // Create notification for customer
      if (data?.booking?.customer_id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: data.booking.customer_id,
            type: 'extra_parts_added',
            title: 'Additional Parts Required',
            message: `Your contractor has requested additional parts: ${requestData.part_name}`,
            data: {
              booking_id: requestData.booking_id,
              extra_part_id: data.id,
              part_name: requestData.part_name,
              total_price: requestData.total_price
            }
          })
          .select('*');
        
        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Create extra parts request error:', error);
      return { data: null, error };
    }
  },

  // Get extra parts for a booking
  async getExtraPartsForBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('extra_parts')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get extra parts for booking error:', error);
      return { data: null, error };
    }
  },

  // Handle customer action on extra parts using database function
  async handleCustomerAction(extraPartId, customerId, action, notes = null) {
    try {
      const { data, error } = await supabase.rpc('handle_extra_parts_customer_action', {
        part_id_param: extraPartId,
        customer_id_param: customerId,
        action_param: action,
        notes_param: notes
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return { data, error: null };
    } catch (error) {
      console.error('Handle customer action error:', error);
      return { data: null, error };
    }
  },

  // Legacy approve method (kept for compatibility)
  async approveExtraParts(extraPartId, customerId) {
    return this.handleCustomerAction(extraPartId, customerId, 'approved');
  },

  // Legacy reject method (kept for compatibility) 
  async rejectExtraParts(extraPartId, customerId) {
    return this.handleCustomerAction(extraPartId, customerId, 'rejected');
  },

  // Create appeal for disputed extra parts
  async createAppeal(bookingId, customerId, extraPartId, reason, evidencePhotos = []) {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .insert({
          booking_id: bookingId,
          customer_id: customerId,
          extra_part_id: extraPartId,
          appeal_type: 'extra_parts',
          reason: reason,
          evidence_photos: evidencePhotos
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create appeal error:', error);
      return { data: null, error };
    }
  },

  // Check if payment can proceed (no pending extra parts)
  async canProceedWithPayment(bookingId) {
    try {
      const { data, error } = await supabase
        .from('extra_parts')
        .select('id, status, customer_action')
        .eq('booking_id', bookingId)
        .in('status', ['pending']);

      if (error) throw error;
      
      // If there are any pending parts, payment cannot proceed
      const pendingParts = data || [];
      const canProceed = pendingParts.length === 0;
      
      return { 
        data: { 
          canProceed, 
          pendingParts: pendingParts.length,
          blockedReason: !canProceed ? 'Extra parts require customer approval' : null
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Check payment eligibility error:', error);
      return { data: { canProceed: true, pendingParts: 0 }, error };
    }
  },

  // Get contractor's extra parts requests
  async getContractorExtraParts(contractorId) {
    try {
      const { data, error } = await supabase
        .from('extra_parts')
        .select(`
          *,
          booking:bookings!booking_id(
            customer_name,
            service_type,
            address
          )
        `)
        .eq('booking.contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor extra parts error:', error);
      return { data: null, error };
    }
  }
};