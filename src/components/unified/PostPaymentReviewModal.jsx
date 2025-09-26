import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Star, User } from 'lucide-react';
import { reviewService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

const PostPaymentReviewModal = ({ booking, isOpen, onClose, reviewType = 'customer' }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // All hooks must be called before any conditional logic
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    if (booking?.id && isOpen) {
      checkExistingReview();
    }
  }, [booking?.id, isOpen]);

  const checkExistingReview = async () => {
    try {
      const { data } = await reviewService.getReviewByBooking(booking.id);
      setExistingReview(data);
      
      if (data) {
        if (reviewType === 'customer') {
          setRating(data.rating || 0);
          setComment(data.review_text || '');
        } else {
          // Contractor reviewing customer - we'd need a contractor_rating field
          // For now, we'll skip contractor reviews of customers
          onClose();
          toast({
            title: "Review Complete",
            description: "Customer review system is active. Contractor reviews coming soon.",
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        booking_id: booking.id,
        customer_id: booking.customer_id,
        contractor_id: booking.contractor_id,
        rating,
        review_text: comment
      };

      let result;
      if (existingReview) {
        result = await reviewService.updateReview(existingReview.id, user.id, {
          rating,
          review_text: comment
        });
      } else {
        result = await reviewService.createReview(reviewData);
      }
      
      if (result.error) throw result.error;

      toast({
        title: existingReview ? "Review Updated!" : "Review Submitted!",
        description: "Thank you for your feedback.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen && !!booking} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview && reviewType === 'customer' ? 'Your Review' : 'Rate Your Experience'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Show existing review in read-only mode if already submitted */}
        {existingReview && reviewType === 'customer' ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= (existingReview.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(existingReview.review_date).toLocaleDateString()}
              </p>
            </div>

            {existingReview.review_text && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{existingReview.review_text}</p>
              </div>
            )}

            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Service Provider Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium">{booking?.contractor_name || booking?.contractor?.full_name || 'Service Provider'}</p>
              <p className="text-sm text-muted-foreground capitalize">{booking?.service_type} Service</p>
            </div>

            {/* Star Rating */}
            <div className="text-center">
              <p className="mb-3 font-medium">How was your experience?</p>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1 transition-colors"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Comments (Optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostPaymentReviewModal;