import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PostPaymentReviewModal from '@/components/unified/PostPaymentReviewModal';
import { 
  Calendar, 
  Star, 
  Image, 
  FileText, 
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  Package,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { reviewService } from '@/lib/services';

const BookingHistoryComponent = () => {
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchBookingHistory();
    }
  }, [user?.id]);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          contractor:profiles!contractor_id(
            full_name,
            profile_photo_url,
            rating
          ),
          extra_parts(
            id,
            part_name,
            quantity,
            unit_price,
            total_price,
            status
          )
        `)
        .eq('customer_id', user.id)
        .in('status', ['completed', 'paid'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch reviews for each booking
      const bookingsWithReviews = await Promise.all(
        data.map(async (booking) => {
          const { data: review } = await reviewService.getReviewByBooking(booking.id);
          return {
            ...booking,
            review: review
          };
        })
      );

      setBookingHistory(bookingsWithReviews);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      toast({
        title: "Error",
        description: "Failed to load booking history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = (booking) => {
    const basePrice = booking.final_price || booking.estimated_price || 0;
    const extraPartsCost = booking.extra_parts
      ?.filter(part => part.status === 'approved')
      ?.reduce((sum, part) => sum + (part.total_price || 0), 0) || 0;
    
    return basePrice + extraPartsCost;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceDisplayName = (serviceType) => {
    const serviceNames = {
      aircon: 'Air Conditioning',
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      cleaning: 'Cleaning',
      painting: 'Painting'
    };
    return serviceNames[serviceType] || serviceType;
  };

  const handleReviewSubmit = () => {
    setShowReviewModal(false);
    fetchBookingHistory(); // Refresh to show updated review
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Booking History</h1>
        <Badge variant="outline">{bookingHistory.length} completed jobs</Badge>
      </div>

      {bookingHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No booking history</h3>
            <p className="text-muted-foreground">Your completed bookings will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookingHistory.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {getServiceDisplayName(booking.service_type)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.updated_at)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatTime(booking.updated_at)}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {booking.payment_status === 'paid' ? 'Paid' : 'Completed'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contractor Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{booking.contractor?.full_name || 'Contractor'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">
                          {booking.contractor?.rating || 'No rating'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${calculateTotalCost(booking).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total paid</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{booking.address?.line1}, {booking.address?.city} {booking.address?.postal_code}</span>
                </div>

                {/* Description */}
                {booking.description && (
                  <div className="text-sm">
                    <strong>Description:</strong> {booking.description}
                  </div>
                )}

                {/* Extra Parts */}
                {booking.extra_parts?.filter(part => part.status === 'approved').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Additional Parts
                    </h4>
                    <div className="space-y-2">
                      {booking.extra_parts.filter(part => part.status === 'approved').map((part) => (
                        <div key={part.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                          <span>{part.part_name} × {part.quantity}</span>
                          <span>${part.total_price?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {(booking.before_photos?.length > 0 || booking.after_photos?.length > 0) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Job Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {booking.before_photos?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Before</p>
                          <div className="grid grid-cols-2 gap-2">
                            {booking.before_photos.slice(0, 4).map((image, idx) => (
                              <img
                                key={idx}
                                src={image}
                                alt={`Before ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(image, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {booking.after_photos?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">After</p>
                          <div className="grid grid-cols-2 gap-2">
                            {booking.after_photos.slice(0, 4).map((image, idx) => (
                              <img
                                key={idx}
                                src={image}
                                alt={`After ${idx + 1}`}
                                className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(image, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Receipt Breakdown */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Receipt
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Service:</span>
                      <span>${(booking.final_price || booking.estimated_price || 0).toFixed(2)}</span>
                    </div>
                    {booking.extra_parts?.filter(part => part.status === 'approved').length > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Parts:</span>
                        <span>+${booking.extra_parts
                          .filter(part => part.status === 'approved')
                          .reduce((sum, part) => sum + (part.total_price || 0), 0)
                          .toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${calculateTotalCost(booking).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Review Section */}
                <div className="flex items-center justify-between pt-2 border-t">
                  {booking.review ? (
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Your Review:</p>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < booking.review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.review.review_date)}
                        </span>
                      </div>
                      {booking.review.review_text && (
                        <p className="text-sm text-muted-foreground italic">
                          "{booking.review.review_text}"
                        </p>
                      )}
                    </div>
                  ) : booking.payment_status === 'paid' ? (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Share your experience with this service provider
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowReviewModal(true);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Leave Review
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Review available after payment completion
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <PostPaymentReviewModal
        booking={selectedBooking}
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedBooking(null);
        }}
        reviewType="customer"
      />
    </div>
  );
};

export default BookingHistoryComponent;