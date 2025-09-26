import { supabase } from '@/integrations/supabase/client';

export const bookingDataCleanup = {
  // Clean up booking stage inconsistencies
  async fixBookingStageConsistency() {
    try {
      console.log('🔧 Starting booking stage consistency cleanup...');
      
      // Get all bookings with potential inconsistencies
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, current_stage, status, progress, payment_status')
        .neq('status', 'cancelled');
      
      if (error) throw error;
      
      const updates = [];
      
      for (const booking of bookings) {
        let needsUpdate = false;
        const updateData = {};
        
        // Fix status based on current_stage
        const statusMap = {
          'pending_bids': 'pending_bids',
          'finding_contractor': 'finding_contractor', 
          'assigned': 'assigned',
          'arriving': 'assigned',
          'work_started': 'work_started',
          'in_progress': 'in_progress',
          'work_completed': 'completed',
          'awaiting_payment': 'completed',
          'paid': 'paid'
        };
        
        const correctStatus = statusMap[booking.current_stage];
        if (correctStatus && booking.status !== correctStatus) {
          updateData.status = correctStatus;
          needsUpdate = true;
        }
        
        // Remove redundant progress.current_stage if it exists
        if (booking.progress && booking.progress.current_stage) {
          const cleanProgress = { ...booking.progress };
          delete cleanProgress.current_stage;
          updateData.progress = cleanProgress;
          needsUpdate = true;
        }
        
        // Special case for payment status
        if (booking.payment_status === 'paid' && booking.current_stage !== 'paid') {
          updateData.current_stage = 'paid';
          updateData.status = 'paid';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updates.push({
            id: booking.id,
            updates: updateData
          });
        }
      }
      
      console.log(`🔧 Found ${updates.length} bookings that need cleanup`);
      
      // Apply updates in batches
      for (const update of updates) {
        await supabase
          .from('bookings')
          .update(update.updates)
          .eq('id', update.id);
        
        console.log(`✅ Updated booking ${update.id}`);
      }
      
      console.log('✅ Booking stage consistency cleanup completed');
      return { success: true, updatedCount: updates.length };
    } catch (error) {
      console.error('❌ Booking cleanup error:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up expired bids and update booking statuses
  async cleanupExpiredBidsAndBookings() {
    try {
      console.log('🔧 Cleaning up expired bids...');
      
      // Use the existing RPC function
      const { data, error } = await supabase.rpc('cleanup_expired_bids');
      
      if (error) throw error;
      
      console.log('✅ Expired bids cleanup completed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Expired bids cleanup error:', error);
      return { success: false, error: error.message };
    }
  },

  // Run all cleanup functions
  async runFullCleanup() {
    console.log('🚀 Starting comprehensive booking data cleanup...');
    
    const results = {
      stageConsistency: await this.fixBookingStageConsistency(),
      expiredBids: await this.cleanupExpiredBidsAndBookings()
    };
    
    console.log('🏁 Comprehensive cleanup completed:', results);
    return results;
  }
};