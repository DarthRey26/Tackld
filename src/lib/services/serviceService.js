import { supabase } from '@/integrations/supabase/client';

export const serviceService = {
  // Get all active services
  async getAllServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get all services error:', error);
      return { data: null, error };
    }
  },

  // Get service by category
  async getServiceByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get service by category error:', error);
      return { data: null, error };
    }
  },

  // Get service by ID
  async getServiceById(serviceId) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get service by ID error:', error);
      return { data: null, error };
    }
  },

  // Get services with booking count
  async getServicesWithStats() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings:bookings(count)
        `)
        .eq('is_active', true)
        .order('total_bookings', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get services with stats error:', error);
      return { data: null, error };
    }
  },

  // Search services
  async searchServices(query) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Search services error:', error);
      return { data: null, error };
    }
  },

  // Get popular services
  async getPopularServices(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('total_bookings', { ascending: false })
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get popular services error:', error);
      return { data: null, error };
    }
  },

  // Update service stats after booking
  async updateServiceStats(serviceId, bookingCompleted = false, rating = null) {
    try {
      const updates = {
        total_bookings: supabase.raw('total_bookings + 1')
      };

      if (bookingCompleted && rating) {
        // Calculate new average rating
        const { data: service } = await supabase
          .from('services')
          .select('average_rating, total_reviews')
          .eq('id', serviceId)
          .single();

        if (service) {
          const newTotalReviews = service.total_reviews + 1;
          const newAverageRating = ((service.average_rating * service.total_reviews) + rating) / newTotalReviews;
          
          updates.total_reviews = newTotalReviews;
          updates.average_rating = Math.round(newAverageRating * 100) / 100;
        }
      }

      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update service stats error:', error);
      return { data: null, error };
    }
  },

  // Get service questions
  async getServiceQuestions(category) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('questions')
        .eq('category', category)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { data: data?.questions || [], error: null };
    } catch (error) {
      console.error('Get service questions error:', error);
      return { data: [], error };
    }
  },

  // Get service pricing info
  async getServicePricing(category) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('default_price_min, default_price_max, estimated_duration_min, estimated_duration_max')
        .eq('category', category)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get service pricing error:', error);
      return { data: null, error };
    }
  }
};