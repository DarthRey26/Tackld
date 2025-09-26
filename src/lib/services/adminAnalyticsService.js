import { supabase } from '@/integrations/supabase/client';

export const adminAnalyticsService = {
  /**
   * Get business analytics dashboard data
   */
  async getBusinessAnalytics() {
    try {
      // Get total orders (bookings)
      const { data: totalOrders, error: ordersError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' });

      if (ordersError) throw ordersError;

      // Get paid bookings for cash flow calculation - using payment_status consistently
      const { data: paidBookings, error: paidError } = await supabase
        .from('bookings')
        .select('final_price, estimated_price, created_at')
        .eq('payment_status', 'paid');

      if (paidError) throw paidError;

      // Calculate total cash flow
      const totalCashFlow = paidBookings.reduce((sum, booking) => {
        const amount = booking.final_price || booking.estimated_price || 0;
        return sum + parseFloat(amount);
      }, 0);

      // Calculate platform fee (5% of cash flow)
      const platformFee = totalCashFlow * 0.05;

      // Get monthly orders data for chart - only paid bookings for consistency
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('bookings')
        .select('created_at, final_price, estimated_price, payment_status')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true });

      if (monthlyError) throw monthlyError;

      // Process monthly data
      const monthlyStats = this.processMonthlyData(monthlyData);

      return {
        success: true,
        data: {
          totalOrders: totalOrders?.length || 0,
          totalCashFlow: totalCashFlow,
          platformFee: platformFee,
          monthlyStats: monthlyStats
        }
      };
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Process bookings data into monthly statistics
   */
  processMonthlyData(bookings) {
    const monthlyStats = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          orders: 0,
          revenue: 0
        };
      }
      
      monthlyStats[monthKey].orders += 1;
      const amount = booking.final_price || booking.estimated_price || 0;
      monthlyStats[monthKey].revenue += parseFloat(amount);
    });

    // Convert to array and sort by month
    return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
  },

  /**
   * Get contractor statistics
   */
  async getContractorStats() {
    try {
      const { data: contractors, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone_number,
          service_type,
          contractor_type,
          rating,
          total_reviews,
          total_jobs_completed,
          total_jobs,
          earnings_total,
          is_verified,
          is_available,
          created_at
        `)
        .eq('account_type', 'contractor')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: contractors || []
      };
    } catch (error) {
      console.error('Error fetching contractor stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};