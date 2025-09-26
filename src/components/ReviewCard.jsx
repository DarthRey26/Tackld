import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Clock, User } from 'lucide-react';

const ReviewCard = ({ review, showContractor = false, showCustomer = false }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const averageRating = review.punctuality_rating && review.quality_rating && review.professionalism_rating
    ? ((review.punctuality_rating + review.quality_rating + review.professionalism_rating) / 3).toFixed(1)
    : review.rating;

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={(showContractor ? review.contractor?.profile_photo_url : review.customer?.profile_photo_url) || ''} 
                alt="Profile" 
              />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Review Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-foreground">
                  {showContractor ? review.contractor?.full_name || 'Anonymous Contractor' : 
                   showCustomer ? review.customer?.full_name || 'Anonymous Customer' :
                   'Anonymous'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">{renderStars(Math.round(averageRating))}</div>
                  <span className="text-sm font-medium">{averageRating}/5</span>
                  <span className="text-sm text-muted-foreground">
                    • {new Date(review.review_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Overall: {review.rating}/5
              </Badge>
            </div>

            {/* Detailed Ratings */}
            {(review.punctuality_rating || review.quality_rating || review.professionalism_rating) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {review.punctuality_rating && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Punctuality: {review.punctuality_rating}/5</span>
                  </div>
                )}
                {review.quality_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>Quality: {review.quality_rating}/5</span>
                  </div>
                )}
                {review.professionalism_rating && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Professionalism: {review.professionalism_rating}/5</span>
                  </div>
                )}
              </div>
            )}

            {/* Review Text */}
            {review.review_text && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-foreground leading-relaxed">{review.review_text}</p>
              </div>
            )}

            {/* Contractor Response */}
            {review.contractor_response && (
              <div className="bg-primary/5 border-l-4 border-primary p-3 rounded-r-lg mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Contractor Response</span>
                  {review.contractor_response_date && (
                    <span className="text-xs text-muted-foreground">
                      • {new Date(review.contractor_response_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-foreground">{review.contractor_response}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;