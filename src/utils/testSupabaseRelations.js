import { supabase } from '@/integrations/supabase/client';

/**
 * Test function to check Supabase foreign key relationships
 */
export const testSupabaseRelations = async () => {
  console.log('🔍 Testing Supabase foreign key relationships...');
  
  try {
    // Test 1: Simple bid query with contractor profile
    console.log('Test 1: Simple bid query...');
    const { data: bids1, error: error1 } = await supabase
      .from('bids')
      .select('*')
      .limit(1);
    
    if (error1) {
      console.error('❌ Simple bid query failed:', error1);
    } else {
      console.log('✅ Simple bid query successful:', bids1?.length || 0, 'results');
    }

    // Test 2: Bid query with explicit join
    console.log('Test 2: Bid with profiles join...');
    const { data: bids2, error: error2 } = await supabase
      .from('bids')
      .select(`
        *,
        profiles!contractor_id (
          full_name,
          rating
        )
      `)
      .limit(1);
    
    if (error2) {
      console.error('❌ Bid with profiles join failed:', error2);
    } else {
      console.log('✅ Bid with profiles join successful:', bids2?.length || 0, 'results');
    }

    // Test 3: Check foreign key constraints
    console.log('Test 3: Checking foreign key constraints...');
    const { data: constraints, error: error3 } = await supabase
      .rpc('get_foreign_keys'); // This might not exist, just testing
    
    if (error3) {
      console.log('ℹ️ RPC get_foreign_keys not available (expected)');
    }

    console.log('🎯 Supabase relation tests completed');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
};