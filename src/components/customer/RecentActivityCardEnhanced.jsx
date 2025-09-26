import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Timer,
  Loader2,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RecentActivityCardEnhanced = ({ bookings = [], onViewDetails }) => {
  // Get user-friendly status labels without exposing sensitive info
  const getStatusLabel = (booking) => {
    const statusLabels = {
      'pending_bids': 'Waiting for contractors',
      'finding_contractor': 'Finding contractors', 
      'assigned': 'Contractor assigned',
      'arriving': 'Contractor arriving',
      'work_started': 'Work in progress',
      'in_progress': 'Work in progress',
      'work_completed': 'Awaiting payment',
      'completed': booking.payment_status === 'paid' ? 'Completed' : 'Payment needed',
      'paid': 'Completed',
      'cancelled': 'Cancelled'
    };

    return statusLabels[booking.status] || booking.status;
  };

  const getStatusVariant = (booking) => {
    const variants = {
      'pending_bids': 'secondary',
      'finding_contractor': 'secondary', 
      'assigned': 'default',
      'arriving': 'default',
      'work_started': 'default',
      'in_progress': 'default', 
      'work_completed': 'outline',
      'completed': booking.payment_status === 'paid' ? 'default' : 'destructive',
      'paid': 'default',
      'cancelled': 'destructive'
    };

    return variants[booking.status] || 'secondary';
  };

  const getStatusIcon = (booking) => {
    const icons = {
      'pending_bids': <Timer className="w-3 h-3" />,
      'finding_contractor': <Loader2 className="w-3 h-3 animate-spin" />,
      'assigned': <CheckCircle className="w-3 h-3" />,
      'arriving': <Clock className="w-3 h-3" />,
      'work_started': <Clock className="w-3 h-3" />,
      'in_progress': <Clock className="w-3 h-3" />,
      'work_completed': <DollarSign className="w-3 h-3" />,
      'completed': booking.payment_status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />,
      'paid': <CheckCircle className="w-3 h-3" />,
      'cancelled': <AlertCircle className="w-3 h-3" />
    };

    return icons[booking.status] || <Clock className="w-3 h-3" />;
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (!address) return 'Address not provided';
    
    const street = address.street || address.line1 || '';
    const postal = address.postalCode || address.postal_code || '';
    return `${street}, S${postal}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM dd');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateTotalPrice = (booking) => {
    const basePrice = parseFloat(booking.final_price || booking.estimated_price) || 0;
    const extraPartsTotal = (booking.extra_parts || []).reduce((total, part) => {
      return total + (parseFloat(part.total_price) || 0);
    }, 0);
    return (basePrice + extraPartsTotal).toFixed(2);
  };

  // Sort bookings by most recent first
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  // Show most recent 5 bookings
  const recentBookings = sortedBookings.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          {bookings.length > 5 && (
            <span className="text-sm text-muted-foreground">
              Showing {recentBookings.length} of {bookings.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your recent activity will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium capitalize truncate">
                        {booking.service_type} Service
                      </h4>
                      <Badge variant={getStatusVariant(booking)} className="text-xs shrink-0">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(booking)}
                          {getStatusLabel(booking)}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatAddress(booking.address)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {booking.scheduled_date 
                            ? `${formatDate(booking.scheduled_date)} ${booking.scheduled_time || ''}`.trim()
                            : 'Schedule flexible'
                          }
                        </span>
                      </div>
                      
                      {booking.urgency === 'urgent' && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-medium">Urgent</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-3">
                    <div className="font-semibold text-primary">
                      ${calculateTotalPrice(booking)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.payment_status === 'paid' ? 'Paid' : 'Total'}
                    </div>
                  </div>
                </div>
                
                {/* Action button */}
                <div className="mt-2 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails?.(booking)}
                    className="w-full justify-start"
                  >
                    <Eye className="w-3 h-3 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCardEnhanced;