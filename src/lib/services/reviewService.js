import { supabase } from '@/integrations/supabase/client';

// Helper function to enrich review data with profile information
async function enrichReviewWithProfiles(review) {
  if (!review) return review;
  
  const profiles = {};
  
  // Fetch contractor profile if needed (handle RLS permissions gracefully)
  if (review.contractor_id) {
    try {
      const { data: contractor, error } = await supabase
        .from('profiles')
        .select('full_name, profile_photo_url')
        .eq('id', review.contractor_id)
        .maybeSingle();
      
      if (!error && contractor) {
        profiles.contractor = contractor;
      }
    } catch (error) {
      // RLS permission error - skip contractor profile enrichment
      console.log('Cannot access contractor profile (RLS):', error.code);
    }
  }
  
  // Fetch customer profile if needed (handle RLS permissions gracefully)
  if (review.customer_id) {
    try {
      const { data: customer, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.customer_id)
        .maybeSingle();
      
      if (!error && customer) {
        profiles.customer = customer;
      }
    } catch (error) {
      // RLS permission error - skip customer profile enrichment
      console.log('Cannot access customer profile (RLS):', error.code);
    }
  }
  
  return { ...review, ...profiles };
}

// Helper function to enrich multiple reviews with profile information
async function enrichReviewsWithProfiles(reviews) {
  if (!reviews || reviews.length === 0) return reviews;
  
  return Promise.all(reviews.map(review => enrichReviewWithProfiles(review)));
}

export const reviewService = {
  // Create a new review
  async createReview(reviewData) {
    try {
      const review = {
        booking_id: reviewData.booking_id,
        customer_id: reviewData.customer_id,
        contractor_id: reviewData.contractor_id,
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        punctuality_rating: reviewData.punctuality_rating,
        quality_rating: reviewData.quality_rating,
        professionalism_rating: reviewData.professionalism_rating
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select('*')
        .single();

      if (error) throw error;
      
      // Enrich with profile data
      const enrichedData = await enrichReviewWithProfiles(data);
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Create review error:', error);
      return { data: null, error };
    }
  },

  // Get reviews for a contractor
  async getContractorReviews(contractorId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('review_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Enrich with profile data
      const enrichedData = await enrichReviewsWithProfiles(data);
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Get contractor reviews error:', error);
      return { data: null, error };
    }
  },

  // Get review by booking ID
  async getReviewByBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      
      // Enrich with profile data if review exists
      const enrichedData = data ? await enrichReviewWithProfiles(data) : data;
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Get review by booking error:', error);
      return { data: null, error };
    }
  },

  // Update review
  async updateReview(reviewId, customerId, updates) {
    try {
      // Verify ownership
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('customer_id')
        .eq('id', reviewId)
        .single();

      if (reviewError) throw reviewError;

      if (review.customer_id !== customerId) {
        throw new Error('Unauthorized: You can only update your own reviews');
      }

      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select('*')
        .single();

      if (error) throw error;
      
      // Enrich with profile data
      const enrichedData = await enrichReviewWithProfiles(data);
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Update review error:', error);
      return { data: null, error };
    }
  },

  // Add contractor response to review
  async addContractorResponse(reviewId, contractorId, response) {
    try {
      // Verify ownership
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('contractor_id')
        .eq('id', reviewId)
        .single();

      if (reviewError) throw reviewError;

      if (review.contractor_id !== contractorId) {
        throw new Error('Unauthorized: You can only respond to your own reviews');
      }

      const { data, error } = await supabase
        .from('reviews')
        .update({
          contractor_response: response,
          contractor_response_date: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select('*')
        .single();

      if (error) throw error;
      
      // Enrich with profile data
      const enrichedData = await enrichReviewWithProfiles(data);
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Add contractor response error:', error);
      return { data: null, error };
    }
  },

  // Get customer's reviews
  async getCustomerReviews(customerId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_id', customerId)
        .order('review_date', { ascending: false });

      if (error) throw error;
      
      // Enrich with profile data
      const enrichedData = await enrichReviewsWithProfiles(data);
      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Get customer reviews error:', error);
      return { data: null, error };
    }
  },

  // Check if customer can review booking
  async canCustomerReview(bookingId, customerId) {
    try {
      // Check if booking exists and belongs to customer
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('customer_id, status, payment_status')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      if (booking.customer_id !== customerId) {
        return { canReview: false, reason: 'This booking does not belong to you' };
      }

      if (booking.status !== 'completed') {
        return { canReview: false, reason: 'You can only review completed bookings' };
      }

      if (booking.payment_status !== 'paid') {
        return { canReview: false, reason: 'Payment must be completed before reviewing' };
      }

      // Check if review already exists
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (reviewError && reviewError.code !== 'PGRST116') throw reviewError;

      if (existingReview) {
        return { canReview: false, reason: 'You have already reviewed this booking' };
      }

      return { canReview: true, reason: null };
    } catch (error) {
      console.error('Can customer review error:', error);
      return { canReview: false, reason: 'Error checking review eligibility' };
    }
  },

  // Get contractor rating summary
  async getContractorRatingSummary(contractorId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, punctuality_rating, quality_rating, professionalism_rating')
        .eq('contractor_id', contractorId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          data: {
            averageRating: 0,
            totalReviews: 0,
            averagePunctuality: 0,
            averageQuality: 0,
            averageProfessionalism: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          error: null
        };
      }

      const totalReviews = data.length;
      const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      const averagePunctuality = data
        .filter(r => r.punctuality_rating)
        .reduce((sum, review) => sum + review.punctuality_rating, 0) / totalReviews;
      
      const averageQuality = data
        .filter(r => r.quality_rating)
        .reduce((sum, review) => sum + review.quality_rating, 0) / totalReviews;
      
      const averageProfessionalism = data
        .filter(r => r.professionalism_rating)
        .reduce((sum, review) => sum + review.professionalism_rating, 0) / totalReviews;

      const ratingDistribution = data.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      return {
        data: {
          averageRating: Math.round(averageRating * 100) / 100,
          totalReviews,
          averagePunctuality: Math.round(averagePunctuality * 100) / 100,
          averageQuality: Math.round(averageQuality * 100) / 100,
          averageProfessionalism: Math.round(averageProfessionalism * 100) / 100,
          ratingDistribution
        },
        error: null
      };
    } catch (error) {
      console.error('Get contractor rating summary error:', error);
      return { data: null, error };
    }
  }
};