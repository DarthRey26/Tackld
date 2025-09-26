import React, { useState, useEffect } from 'react';
import { reviewService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import ReviewCard from './ReviewCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, MessageSquare, Award } from 'lucide-react';

const ReviewList = () => {
  const { user, userType } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user && userType) {
      fetchReviews();
    }
  }, [user, userType]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      if (userType === 'contractor') {
        // Fetch reviews for this contractor
        const { data: reviewsData, error: reviewsError } = await reviewService.getContractorReviews(user.id);
        if (reviewsError) throw reviewsError;
        
        // Fetch rating summary
        const { data: statsData, error: statsError } = await reviewService.getContractorRatingSummary(user.id);
        if (statsError) throw statsError;
        
        setReviews(reviewsData || []);
        setStats(statsData);
      } else {
        // Fetch reviews left by this customer
        const { data: reviewsData, error: reviewsError } = await reviewService.getCustomerReviews(user.id);
        if (reviewsError) throw reviewsError;
        
        setReviews(reviewsData || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userType === 'contractor' && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rating Summary
            </CardTitle>
            <CardDescription>Your performance ratings from clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.averageRating || 0}</div>
                <div className="text-sm text-muted-foreground">Overall Rating</div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground">{stats.totalReviews}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground">{stats.averageQuality || 0}</div>
                <div className="text-sm text-muted-foreground">Quality Score</div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Star className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground">{stats.averageProfessionalism || 0}</div>
                <div className="text-sm text-muted-foreground">Professionalism</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {userType === 'contractor' ? 'Reviews from Clients' : 'Reviews You\'ve Left'}
          </CardTitle>
          <CardDescription>
            {userType === 'contractor' 
              ? 'Feedback from customers who have used your services'
              : 'Reviews you\'ve submitted for completed services'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  showContractor={userType === 'customer'}
                  showCustomer={userType === 'contractor'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {userType === 'contractor' ? 'No Reviews Yet' : 'No Reviews Submitted'}
              </h3>
              <p className="text-muted-foreground">
                {userType === 'contractor' 
                  ? 'Complete your first job to receive reviews from clients.'
                  : 'You haven\'t left any reviews yet. Complete a service to leave your first review!'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewList;