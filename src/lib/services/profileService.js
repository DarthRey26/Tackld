import { supabase } from '@/integrations/supabase/client';

export const profileService = {
  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { data: null, error };
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  },

  // Get contractors by service type
  async getContractorsByService(serviceType, contractorType = null) {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'contractor')
        .eq('service_type', serviceType)
        .eq('is_available', true);

      if (contractorType) {
        query = query.eq('contractor_type', contractorType);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractors error:', error);
      return { data: null, error };
    }
  },

  // Update contractor stats
  async updateContractorStats(contractorId, stats) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(stats)
        .eq('id', contractorId)
        .eq('account_type', 'contractor')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update contractor stats error:', error);
      return { data: null, error };
    }
  },

  // Get contractor profile with stats
  async getContractorProfile(contractorId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          reviews:reviews!contractor_id(
            rating,
            review_text,
            review_date,
            customer_id
          )
        `)
        .eq('id', contractorId)
        .eq('account_type', 'contractor')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get contractor profile error:', error);
      return { data: null, error };
    }
  }
};