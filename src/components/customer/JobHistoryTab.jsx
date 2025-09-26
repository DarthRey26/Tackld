import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/lib/services';
import ReviewModal from '@/components/ReviewModal';
import { 
  Calendar, 
  Star, 
  DollarSign, 
  User, 
  Eye,
  MessageCircle,
  CheckCircle,
  Clock,
  MapPin,
  Image as ImageIcon,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';

const JobHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const loadBookingHistory = async () => {
      try {
        setLoading(true);
        const { data: allBookings, error } = await bookingService.getCustomerBookings(user.id);
        
        if (error) throw error;
        
        // Filter for completed bookings and sort by most recent
        const completedBookings = (allBookings || [])
          .filter(booking => ['completed', 'paid'].includes(booking.payment_status) || booking.status === 'completed')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setBookings(completedBookings);
      } catch (error) {
        console.error('Error loading booking history:', error);
        toast({
          title: "Error",
          description: "Failed to load booking history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBookingHistory();
  }, [user, toast]);

  const getStatusBadge = (booking) => {
    if (booking.payment_status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (booking.status === 'completed') {
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    }
    return <Badge variant="secondary">{booking.status}</Badge>;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Date not available';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a');
    } catch {
      return 'Date not available';
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleLeaveReview = (booking) => {
    setReviewBooking(booking);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = (review) => {
    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback.",
    });
    
    // Update booking to show review has been left
    setBookings(prev => prev.map(booking => 
      booking.id === reviewBooking.id 
        ? { ...booking, has_review: true }
        : booking
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading your job history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Job History Yet</h3>
          <p className="text-gray-600">
            Your completed jobs will appear here once you've used our services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Job History</h2>
        <Badge variant="outline">{bookings.length} completed jobs</Badge>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold capitalize">
                      {booking.service_type} Service
                    </h3>
                    {getStatusBadge(booking)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {typeof booking.address === 'string' 
                          ? booking.address.slice(0, 30) + '...'
                          : `${booking.address?.line1 || 'Address'}, ${booking.address?.postal_code || ''}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>${booking.final_price || booking.estimated_price || 'N/A'}</span>
                    </div>
                    
                    {booking.contractor_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{booking.contractor_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(booking)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  
                  {!booking.has_review && booking.payment_status === 'paid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveReview(booking)}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Leave Review
                    </Button>
                  )}
                </div>
              </div>
              
              {booking.description && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                  {booking.description.length > 100 
                    ? booking.description.slice(0, 100) + '...'
                    : booking.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Job Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold capitalize mb-2">
                    {selectedBooking.service_type} Service
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedBooking)}
                    <Badge variant="outline">
                      {selectedBooking.booking_type === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${selectedBooking.final_price || selectedBooking.estimated_price}
                  </p>
                  <p className="text-sm text-gray-500">Total paid</p>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Service Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date Booked</p>
                      <p className="text-sm">{formatDateTime(selectedBooking.created_at)}</p>
                    </div>
                    
                    {selectedBooking.scheduled_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Scheduled Date</p>
                        <p className="text-sm">
                          {formatDate(selectedBooking.scheduled_date)}
                          {selectedBooking.scheduled_time && ` at ${selectedBooking.scheduled_time}`}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Urgency</p>
                      <p className="text-sm capitalize">{selectedBooking.urgency || 'Normal'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {typeof selectedBooking.address === 'string' 
                        ? selectedBooking.address
                        : `${selectedBooking.address?.line1 || ''}\n${selectedBooking.address?.line2 || ''}\nSingapore ${selectedBooking.address?.postal_code || ''}`.trim()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {selectedBooking.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Contractor Information */}
              {selectedBooking.contractor_name && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contractor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedBooking.contractor_name}</h3>
                        <p className="text-sm text-gray-600">Professional Contractor</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Images */}
              {selectedBooking.uploaded_images && selectedBooking.uploaded_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Service Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedBooking.uploaded_images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Service image ${index + 1}`}
                          className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {!selectedBooking.has_review && selectedBooking.payment_status === 'paid' && (
                  <Button
                    onClick={() => {
                      setShowBookingModal(false);
                      handleLeaveReview(selectedBooking);
                    }}
                    className="flex-1"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Leave Review
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <ReviewModal
        booking={reviewBooking}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmitted}
      />
    </div>
  );
};

export default JobHistoryTab;