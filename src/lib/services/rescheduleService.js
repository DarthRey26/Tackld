import { supabase } from '@/integrations/supabase/client';

export const rescheduleService = {
  // Create a reschedule request
  async createRescheduleRequest(requestData) {
    try {
      const rescheduleRequest = {
        booking_id: requestData.booking_id,
        new_date: requestData.new_date,
        new_time: requestData.new_time,
        reason: requestData.reason
      };

      const { data, error } = await supabase
        .from('reschedule_requests')
        .insert(rescheduleRequest)
        .select(`
          *,
          booking:bookings!booking_id(
            customer_name,
            service_type,
            contractor_id
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create reschedule request error:', error);
      return { data: null, error };
    }
  },

  // Get reschedule requests for a booking
  async getRescheduleRequestsForBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('reschedule_requests')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get reschedule requests for booking error:', error);
      return { data: null, error };
    }
  },

  // Approve reschedule request
  async approveRescheduleRequest(requestId, customerId) {
    try {
      // Get the reschedule request with booking info
      const { data: rescheduleRequest, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select(`
          *,
          booking:bookings!booking_id(customer_id, id)
        `)
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Verify customer owns the booking
      if (rescheduleRequest.booking.customer_id !== customerId) {
        throw new Error('Unauthorized: You can only approve reschedule requests for your own bookings');
      }

      // Update reschedule request status
      const { data: updatedRequest, error: updateRequestError } = await supabase
        .from('reschedule_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
        .select()
        .single();

      if (updateRequestError) throw updateRequestError;

      // Update the booking with new date and time
      const { data: updatedBooking, error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          scheduled_date: rescheduleRequest.new_date,
          scheduled_time: rescheduleRequest.new_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', rescheduleRequest.booking_id)
        .select()
        .single();

      if (updateBookingError) throw updateBookingError;

      return { 
        data: { 
          rescheduleRequest: updatedRequest, 
          booking: updatedBooking 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Approve reschedule request error:', error);
      return { data: null, error };
    }
  },

  // Reject reschedule request
  async rejectRescheduleRequest(requestId, customerId) {
    try {
      // Get the reschedule request with booking info
      const { data: rescheduleRequest, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select(`
          *,
          booking:bookings!booking_id(customer_id)
        `)
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Verify customer owns the booking
      if (rescheduleRequest.booking.customer_id !== customerId) {
        throw new Error('Unauthorized: You can only reject reschedule requests for your own bookings');
      }

      const { data, error } = await supabase
        .from('reschedule_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reject reschedule request error:', error);
      return { data: null, error };
    }
  },

  // Get contractor's reschedule requests
  async getContractorRescheduleRequests(contractorId) {
    try {
      const { data, error } = await supabase
        .from('reschedule_requests')
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
      console.error('Get contractor reschedule requests error:', error);
      return { data: null, error };
    }
  }
};