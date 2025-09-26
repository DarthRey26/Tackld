import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingPersistence } from '@/hooks/useBookingPersistence';
import { useRealtimeBooking } from '@/hooks/useRealtimeBooking';
import { realtimeService } from '@/lib/services';
import ComprehensiveExtraPartsModal from '@/components/customer/ComprehensiveExtraPartsModal';
import RealTimeBookingStatus from '@/components/customer/RealTimeBookingStatus';
import BookingStatusDisplay from '@/components/customer/BookingStatusDisplay';
import BidAcceptanceFlow from '@/components/customer/BidAcceptanceFlow';
import BookingHistoryComponent from '@/components/customer/BookingHistoryComponent';
import RecentActivityCardEnhanced from '@/components/customer/RecentActivityCardEnhanced';
import EnhancedBookingProgress from '@/components/customer/EnhancedBookingProgress';
import { 
  AirVent, 
  Wrench, 
  Zap, 
  Sparkles, 
  Paintbrush,
  Wallet,
  Clock,
  Star,
  Plus,
  User,
  Play,
  History
} from 'lucide-react';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, userProfile, userType, loading } = useAuth();
  const { bookings, activeBookings, loading: bookingsLoading, refreshBookings } = useBookingPersistence();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [showExtraPartsModal, setShowExtraPartsModal] = useState(false);
  const [selectedBookingForParts, setSelectedBookingForParts] = useState(null);
  
  // Get the first active booking for bid management
  const activeBooking = activeBookings?.[0];
  const { bids } = useRealtimeBooking(activeBooking?.id, authUser?.id, 'customer');
  
  const services = [
    {
      id: "aircon",
      name: "Aircon",
      icon: AirVent,
      description: "Installation, repair & maintenance",
      color: "bg-blue-500",
    },
    {
      id: "plumbing", 
      name: "Plumbing",
      icon: Wrench,
      description: "Pipes, toilets, sinks & water heaters",
      color: "bg-orange-500",
    },
    {
      id: "electrical",
      name: "Electrical", 
      icon: Zap,
      description: "Wiring, switches & electrical repairs",
      color: "bg-yellow-500",
    },
    {
      id: "cleaning",
      name: "Cleaning",
      icon: Sparkles,
      description: "Deep cleaning & maintenance",
      color: "bg-green-500",
    },
    {
      id: "painting",
      name: "Painting",
      icon: Paintbrush,
      description: "Interior & exterior painting",
      color: "bg-purple-500",
    },
  ];

  // Calculate profile completion
  useEffect(() => {
    if (userProfile) {
      const fields = ['full_name', 'phone_number', 'email'];
      const completed = fields.filter(field => userProfile[field]).length;
      setProfileCompletion(Math.round((completed / fields.length) * 100));
    }
  }, [userProfile]);

  // Set up real-time notification subscription
  useEffect(() => {
    if (!authUser?.id || loading) return;

    console.log('🔔 Setting up customer notification subscription for user:', authUser.id);

    const notificationChannel = realtimeService.subscribeToNotifications(authUser.id, (payload) => {
      console.log('🔔 Notification received:', payload);
      
      if (payload.new) {
        const { type, title, message, data: rawData } = payload.new;
        // Parse data field if it's a JSON string
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        
        // Handle notification-based updates
        if (payload.new.type === 'extra_parts_added') {
          // Parse the data properly - it might be stringified JSON
          let extraPartsData;
          try {
            extraPartsData = typeof payload.new.data === 'string' 
              ? JSON.parse(payload.new.data) 
              : payload.new.data;
          } catch (e) {
            extraPartsData = payload.new.data;
          }

          toast({
            title: "Additional Parts Required",
            description: `Your contractor has requested additional parts: ${extraPartsData.part_name}`,
            action: (
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setSelectedBooking(extraPartsData.booking_id)}
              >
                Review
              </Button>
            ),
          });
          refreshBookings();
        } else if (payload.new.type === 'job_progress_update') {
          toast({
            title: "Job Progress Update",
            description: "Your contractor has updated the job progress.",
          });
          refreshBookings();
        } else if (payload.new.type === 'new_bid') {
          const bidData = typeof payload.new.data === 'string' 
            ? JSON.parse(payload.new.data) 
            : payload.new.data;
          toast({
            title: "New Bid Received",
            description: `You received a new bid of $${bidData.bid_amount} for your booking.`,
          });
          refreshBookings();
        }
      }
    });

    // Set up real-time extra parts subscription
    return () => {
      if (notificationChannel) {
        realtimeService.unsubscribe(notificationChannel);
      }
    };
  }, [authUser, loading, refreshBookings, toast]);

  const handleServiceClick = (serviceId) => {
    navigate(`/service-request?service=${serviceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please log in to access your dashboard</h2>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.full_name || 'Customer'}!</h1>
          <p className="text-muted-foreground">Manage your bookings and services</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Active Bookings
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Book a Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {services.map((service) => {
                    const IconComponent = service.icon;
                    return (
                      <Card 
                        key={service.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 border-2 hover:border-primary/20"
                        onClick={() => handleServiceClick(service.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-12 h-12 ${service.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{service.name}</h3>
                          <p className="text-xs text-muted-foreground leading-tight">{service.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivityCardEnhanced 
                bookings={bookings || []} 
                onViewDetails={(booking) => {
                  // Switch to appropriate tab based on booking status
                  if (activeBookings?.some(ab => ab.id === booking.id)) {
                    document.querySelector('[value="active"]')?.click();
                  } else {
                    document.querySelector('[value="history"]')?.click();
                  }
                }}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Account Summary</span>
                    <Badge variant="outline">{profileCompletion}% Complete</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{userProfile?.full_name || 'Set up your profile'}</p>
                      <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{bookings?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{activeBookings?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Active Jobs</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/account')}
                  >
                    Manage Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="active">
            {activeBookings?.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Active Bookings</h2>
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="space-y-4">
                    {/* Show EnhancedBookingProgress for bookings with assigned contractors */}
                    {booking.contractor_id ? (
                      <EnhancedBookingProgress 
                        booking={booking}
                        onStatusUpdate={refreshBookings}
                      />
                    ) : (
                      <>
                        <BookingStatusDisplay 
                          booking={booking}
                          onPaymentClick={(booking) => navigate('/payment', { state: { booking } })}
                          onReviewClick={(booking) => {
                            console.log('Review booking:', booking);
                          }}
                          onBookingUpdate={refreshBookings}
                        />
                        {/* Show bid management only when no contractor is assigned and accepting bids */}
                        {['pending_bids', 'finding_contractor'].includes(booking.current_stage || booking.status) && (
                          <BidAcceptanceFlow
                            booking={booking}
                            onBidAccepted={refreshBookings}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No active bookings</h3>
                  <p className="text-muted-foreground mb-4">Start by booking a service</p>
                  <Button onClick={() => navigate('/service-request')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <BookingHistoryComponent />
          </TabsContent>
        </Tabs>

        {/* Extra Parts Modal */}
        {selectedBookingForParts && (
          <ComprehensiveExtraPartsModal
            booking={selectedBookingForParts}
            isOpen={showExtraPartsModal}
            onClose={() => {
              setShowExtraPartsModal(false);
              setSelectedBookingForParts(null);
            }}
            onUpdate={() => {
              refreshBookings();
              // Check if there are still pending parts
              const stillHasPendingParts = selectedBookingForParts?.extra_parts?.some(
                part => part.status === 'pending'
              );
              if (!stillHasPendingParts) {
                setShowExtraPartsModal(false);
                setSelectedBookingForParts(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;