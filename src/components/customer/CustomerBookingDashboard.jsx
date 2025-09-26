import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/lib/services';
import BidAcceptanceFlow from './BidAcceptanceFlow';
import EnhancedBookingProgress from './EnhancedBookingProgress';
import { Clock, CheckCircle, DollarSign, Star } from 'lucide-react';

const CustomerBookingDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user) {
      loadCustomerBookings();
    }
  }, [user]);

  const loadCustomerBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await bookingService.getCustomerBookings(user.id);
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidAccepted = (acceptResult) => {
    // Refresh bookings when a bid is accepted
    loadCustomerBookings();
  };

  const handleStatusUpdate = () => {
    // Refresh bookings when status updates
    loadCustomerBookings();
  };

  const getBookingStatusBadge = (booking) => {
    const statusConfig = {
      'pending_bids': { label: 'Receiving Bids', variant: 'secondary', icon: Clock },
      'finding_contractor': { label: 'Finding Contractor', variant: 'secondary', icon: Clock },
      'assigned': { label: 'Contractor Assigned', variant: 'default', icon: CheckCircle },
      'arriving': { label: 'Contractor Arriving', variant: 'default', icon: Clock },
      'work_started': { label: 'Work Started', variant: 'default', icon: CheckCircle },
      'in_progress': { label: 'In Progress', variant: 'default', icon: CheckCircle },
      'work_completed': { label: 'Work Complete', variant: 'default', icon: CheckCircle },
      'awaiting_payment': { label: 'Payment Due', variant: 'destructive', icon: DollarSign },
      'completed': { label: 'Completed', variant: 'outline', icon: CheckCircle },
      'paid': { label: 'Paid', variant: 'outline', icon: CheckCircle }
    };

    const status = booking.current_stage || booking.status || 'pending_bids';
    const config = statusConfig[status] || statusConfig['pending_bids'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderBookingCard = (booking) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.service_type} Service</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Booking ID: {booking.id.slice(-8)}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(booking.created_at).toLocaleDateString()}
            </p>
          </div>
          {getBookingStatusBadge(booking)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Address and Description */}
          <div>
            <p className="text-sm"><strong>Address:</strong> {booking.address?.formatted || 'Address provided'}</p>
            {booking.description && (
              <p className="text-sm mt-1"><strong>Description:</strong> {booking.description}</p>
            )}
          </div>

          {/* Price Information */}
          <div className="flex justify-between text-sm">
            <span>Estimated Price:</span>
            <span className="font-medium">${booking.estimated_price || booking.final_price}</span>
          </div>

          {/* Bid Acceptance Flow for pending bookings */}
          {(['pending_bids', 'finding_contractor'].includes(booking.status)) && (
            <BidAcceptanceFlow 
              booking={booking} 
              onBidAccepted={handleBidAccepted}
            />
          )}

          {/* Progress Tracking for active bookings */}
          {(['assigned', 'arriving', 'work_started', 'in_progress', 'work_completed', 'awaiting_payment', 'completed'].includes(booking.current_stage || booking.status)) && (
            <EnhancedBookingProgress 
              booking={booking}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );

  const activeBookings = bookings.filter(booking => 
    !['completed', 'cancelled', 'paid'].includes(booking.payment_status || booking.status)
  );

  const completedBookings = bookings.filter(booking => 
    ['completed', 'cancelled', 'paid'].includes(booking.payment_status || booking.status)
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Service Bookings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Bookings ({activeBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">No active bookings found</p>
              </CardContent>
            </Card>
          ) : (
            activeBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">No completed bookings found</p>
              </CardContent>
            </Card>
          ) : (
            completedBookings.map(renderBookingCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerBookingDashboard;