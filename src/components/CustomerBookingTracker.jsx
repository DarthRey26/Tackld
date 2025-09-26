import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Star,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const CustomerBookingTracker = ({ booking }) => {
  const { toast } = useToast();

  // Format scheduled date and time for display
  const formatScheduledDateTime = (date, time) => {
    if (!date) return 'Date not set at Time not set';
    
    try {
      // Handle both date string and ISO string formats
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const parsedDate = parseISO(dateStr);
      const formattedDate = format(parsedDate, 'dd MMM yyyy');
      
      if (time) {
        // Handle time format (e.g., "14:30:00" or "2:30 PM")
        const timeStr = time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
        return `${formattedDate} at ${timeStr}`;
      }
      
      return `${formattedDate} at Time not set`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date && time ? `${date} at ${time}` : 'Date not set at Time not set';
    }
  };

  const handleCancelBooking = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to cancel bookings');
      }

      // Cancel the booking
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by customer',
          cancelled_by: 'customer',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)
        .eq('customer_id', user.id);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled and contractors have been notified.",
      });

      // Refresh the page or navigate back
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusDisplay = () => {
    switch (booking.status) {
      case 'finding_contractor':
      case 'pending_bids':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Finding Contractors',
          icon: AlertCircle
        };
      case 'assigned':
      case 'contractor_found':
        return {
          color: 'bg-blue-100 text-blue-800',
          text: 'Contractor Assigned',
          icon: CheckCircle
        };
      case 'arriving':
        return {
          color: 'bg-purple-100 text-purple-800',
          text: 'Contractor Arriving',
          icon: Clock
        };
      case 'job_started':
      case 'in_progress':
        return {
          color: 'bg-orange-100 text-orange-800',
          text: 'Work In Progress',
          icon: Clock
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800',
          text: 'Completed',
          icon: CheckCircle
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: booking.status,
          icon: AlertCircle
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section with Status */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {booking.service_type || 'Service Request'}
            </h2>
            <Badge className={`${statusDisplay.color} inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}>
              <StatusIcon className="w-4 h-4" />
              {statusDisplay.text}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground">Budget</p>
            <p className="text-3xl font-bold text-primary">${booking.estimated_price || booking.final_price || '0'}</p>
          </div>
        </div>
      </div>

      {/* Booking Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Location & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof booking.address === 'string' 
                      ? booking.address || 'Address not provided'
                      : `${booking.address?.street || ''} ${booking.address?.unit || ''}, ${booking.address?.postalCode || 'Address not provided'}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    {formatScheduledDateTime(booking.scheduled_date, booking.scheduled_time)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-primary" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.description ? (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {booking.description}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <p className="text-sm text-muted-foreground text-center">
                  No additional details provided
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Estimated Cost</span>
              </div>
              <span className="text-lg font-bold text-primary">${booking.estimated_price || booking.final_price || '0'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Booking Button - Only show when finding contractors */}
      {(booking.status === 'finding_contractor' || booking.status === 'pending_bids') && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancelBooking}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Booking
          </Button>
        </div>
      )}

      {/* Contractor Info - Show when contractor is assigned */}
      {(booking.status === 'assigned' || booking.status === 'contractor_found' || booking.status === 'arriving' || booking.status === 'in_progress' || booking.status === 'job_started' || booking.status === 'completed') && booking.contractor && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-6 h-6 text-primary" />
              Your Assigned Contractor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-xl font-bold text-foreground">{booking.contractor.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-foreground">{booking.contractor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{booking.contractor.reviews} reviews</span>
                  </div>
                </div>
                {booking.contractor.experience && (
                  <p className="text-muted-foreground leading-relaxed">{booking.contractor.experience}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" variant="outline" className="hover:bg-primary/10 hover:border-primary/30">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicators */}
      {booking.status === 'completed' && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Job Completed!</h3>
            <p className="text-green-700">Your service has been completed successfully.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerBookingTracker;