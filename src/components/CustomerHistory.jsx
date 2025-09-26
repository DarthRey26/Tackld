import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Star, 
  Image, 
  FileText, 
  DollarSign, 
  User,
  MessageSquare,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CustomerHistory = () => {
  const [bookingHistory, setBookingHistory] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { toast } = useToast();

  // Load booking history from localStorage/API
  useEffect(() => {
    // TODO: Replace with actual API call to fetch booking history
    setHistory([]);
    setLoading(false);
  }, []);

  const handleSubmitReview = async (booking) => {
    try {
      // Submit review to API
      const response = await fetch(`/api/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: reviewData.rating,
          comment: reviewData.comment,
          contractorId: booking.contractor.id
        })
      });

      if (response.ok) {
        // Update local state
        setBookingHistory(prev => prev.map(b => 
          b.id === booking.id 
            ? { ...b, reviewLeft: { ...reviewData, date: new Date().toISOString() } }
            : b
        ));

        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });

        setShowReviewModal(false);
        setReviewData({ rating: 5, comment: '' });
      }
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Booking History</h1>
        <Badge variant="outline">{bookingHistory.length} completed jobs</Badge>
      </div>

      {bookingHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No booking history</h3>
            <p className="text-gray-600">Your completed bookings will appear here</p>
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
                      {getServiceDisplayName(booking.serviceType)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.date)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatTime(booking.completedAt)}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contractor Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{booking.contractor.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{booking.contractor.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${booking.totalAmount}</p>
                    <p className="text-sm text-gray-600">Total paid</p>
                  </div>
                </div>

                {/* Address */}
                <div className="text-sm text-gray-600">
                  <strong>Address:</strong> {booking.address}
                </div>

                {/* Images */}
                {booking.images && (booking.images.before.length > 0 || booking.images.after.length > 0) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Job Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {booking.images.before.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Before</p>
                          <div className="grid grid-cols-2 gap-2">
                            {booking.images.before.map((image, idx) => (
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
                      {booking.images.after.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">After</p>
                          <div className="grid grid-cols-2 gap-2">
                            {booking.images.after.map((image, idx) => (
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

                {/* Receipt */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Receipt
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Service:</span>
                      <span>${booking.receipt.baseService}</span>
                    </div>
                    {booking.receipt.additionalParts > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Parts:</span>
                        <span>+${booking.receipt.additionalParts}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${booking.receipt.total}</span>
                    </div>
                  </div>
                </div>

                {/* Review Section */}
                <div className="flex items-center justify-between pt-2 border-t">
                  {booking.reviewLeft ? (
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Your Review:</p>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < booking.reviewLeft.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(booking.reviewLeft.date)}
                        </span>
                      </div>
                      {booking.reviewLeft.comment && (
                        <p className="text-sm text-gray-600 italic">
                          "{booking.reviewLeft.comment}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Share your experience with this contractor
                      </p>
                      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Leave Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate Your Experience</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Rating</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-8 h-8 cursor-pointer transition-colors ${
                                      star <= reviewData.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Comment (Optional)</p>
                              <Textarea
                                value={reviewData.comment}
                                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Share your experience..."
                                rows={4}
                                maxLength={500}
                              />
                            </div>
                            
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleSubmitReview(selectedBooking)}>
                                Submit Review
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerHistory;