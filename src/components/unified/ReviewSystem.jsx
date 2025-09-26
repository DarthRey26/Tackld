import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Star, StarOff, User, Calendar } from 'lucide-react';
import { reviewService } from '@/lib/services';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const starSize = size === 'large' ? 'w-8 h-8' : size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            className={`${starSize} transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            onClick={() => !readonly && onRatingChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly}
          >
            {filled ? (
              <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
            ) : (
              <StarOff className={`${starSize} text-gray-300`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

const ReviewForm = ({ booking, contractor, onSubmit, onCancel }) => {
  const [reviewData, setReviewData] = useState({
    rating: 0,
    review: '',
    categories: {
      punctuality: 0,
      quality: 0,
      professionalism: 0,
      cleanliness: 0,
      communication: 0
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reviewData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await reviewService.submitReview(booking.id, {
        contractorId: contractor.id,
        customerId: booking.customerId,
        rating: reviewData.rating,
        review: reviewData.review,
        categories: reviewData.categories,
        serviceType: booking.serviceType,
        submittedAt: new Date().toISOString()
      });
      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!"
      });
      
      onSubmit(response);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCategoryRating = (category, rating) => {
    setReviewData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overall Rating */}
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Overall Rating</h3>
        <StarRating
          rating={reviewData.rating}
          onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
          size="large"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {reviewData.rating === 0 && "Click to rate"}
          {reviewData.rating === 1 && "Poor"}
          {reviewData.rating === 2 && "Fair"}
          {reviewData.rating === 3 && "Good"}
          {reviewData.rating === 4 && "Very Good"}
          {reviewData.rating === 5 && "Excellent"}
        </p>
      </div>

      {/* Category Ratings */}
      <div className="space-y-4">
        <h4 className="font-medium">Rate specific aspects:</h4>
        
        {[
          { key: 'punctuality', label: 'Punctuality' },
          { key: 'quality', label: 'Quality of Work' },
          { key: 'professionalism', label: 'Professionalism' },
          { key: 'cleanliness', label: 'Cleanliness' },
          { key: 'communication', label: 'Communication' }
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <StarRating
              rating={reviewData.categories[key]}
              onRatingChange={(rating) => updateCategoryRating(key, rating)}
              size="small"
            />
          </div>
        ))}
      </div>

      {/* Written Review */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Write a review (optional)
        </label>
        <Textarea
          value={reviewData.review}
          onChange={(e) => setReviewData(prev => ({ ...prev, review: e.target.value }))}
          placeholder="Share your experience with other customers..."
          rows={4}
          maxLength={1000}
        />
        <div className="text-xs text-muted-foreground mt-1">
          {reviewData.review.length}/1000 characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || reviewData.rating === 0}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
};

const ReviewDisplay = ({ review, showContractor = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const averageCategoryRating = () => {
    const categories = Object.values(review.categories || {});
    if (categories.length === 0) return review.rating;
    return categories.reduce((a, b) => a + b, 0) / categories.length;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium">
                {showContractor ? review.contractorName : review.customerName || 'Anonymous'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(review.submittedAt)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StarRating rating={review.rating} readonly size="small" />
            <div className="text-xs text-muted-foreground mt-1">
              {review.serviceType} service
            </div>
          </div>
        </div>
        
        {review.review && (
          <p className="text-sm text-gray-700 mb-3">"{review.review}"</p>
        )}
        
        {review.categories && Object.keys(review.categories).length > 0 && (
          <div className="text-xs text-muted-foreground">
            Detailed ratings: {Object.entries(review.categories).map(([key, value]) => 
              `${key}: ${value}/5`
            ).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewModal = ({ isOpen, onClose, booking, contractor }) => {
  const handleReviewSubmit = (review) => {
    onClose();
    // Could trigger a refresh of reviews or update parent state
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Your Service</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm">
            <strong>Service:</strong> {booking?.serviceType}
          </div>
          <div className="text-sm">
            <strong>Contractor:</strong> {contractor?.name}
          </div>
          <div className="text-sm">
            <strong>Date:</strong> {booking?.scheduledDate}
          </div>
        </div>
        <ReviewForm
          booking={booking}
          contractor={contractor}
          onSubmit={handleReviewSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export { StarRating, ReviewForm, ReviewDisplay, ReviewModal };
export default ReviewSystem;