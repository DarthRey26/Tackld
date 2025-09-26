import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerBookingTracker from './CustomerBookingTracker';
import PaymentSimulator from './PaymentSimulator';
import PostPaymentReviewModal from './unified/PostPaymentReviewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const BookingSuccess = ({ booking }) => {
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(booking);

  useEffect(() => {
    // Get the most up-to-date booking from session storage
    const activeBooking = sessionStorage.getItem('activeBooking');
    if (activeBooking) {
      try {
        const bookingData = JSON.parse(activeBooking);
        setCurrentBooking(bookingData);
        
        // Show payment if job is completed
        if (bookingData.status === 'job_completed') {
          setShowPayment(true);
        }
      } catch (error) {
        console.error('Error parsing active booking:', error);
      }
    }
  }, []);

  const handlePaymentComplete = (updatedBooking) => {
    setCurrentBooking(updatedBooking);
    setShowPayment(false);
    
    // Show review modal after payment
    setTimeout(() => {
      setShowReview(true);
    }, 1000);
  };

  const handleReviewSubmit = (review) => {
    console.log('Review submitted:', review);
    
    // Update booking with review
    const reviewedBooking = {
      ...currentBooking,
      customer_rating: review.rating,
      customer_review: review.comment,
      review_date: new Date().toISOString()
    };
    
    setCurrentBooking(reviewedBooking);
    sessionStorage.setItem('activeBooking', JSON.stringify(reviewedBooking));
    setShowReview(false);
  };

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Required</h1>
            <p className="text-gray-600">Your job has been completed successfully!</p>
          </div>
          
          <PaymentSimulator
            booking={currentBooking}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setShowPayment(false)}
          />
          
          <div className="text-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPayment(false)}
              className="mr-4"
            >
              Back to Tracking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              Your {currentBooking?.serviceType || 'service'} booking has been submitted successfully.
            </p>
            <p className="text-sm text-green-600">
              Booking ID: {currentBooking?.id || 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Booking Tracker */}
        <div className="mb-8">
          <CustomerBookingTracker booking={currentBooking} />
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={() => navigate('/customer-dashboard')}
          >
            View All Bookings
          </Button>
        </div>

        {/* Review Modal */}
        <PostPaymentReviewModal
          booking={currentBooking}
          isOpen={showReview}
          onClose={() => setShowReview(false)}
        />
      </div>
    </div>
  );
};

export default BookingSuccess;