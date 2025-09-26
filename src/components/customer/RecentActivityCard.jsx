import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AirVent, 
  Wrench, 
  Zap, 
  Sparkles, 
  Paintbrush,
  Clock,
  User,
  Star,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RecentActivityCard = ({ bookings, onViewDetails }) => {
  const serviceIcons = {
    aircon: AirVent,
    plumbing: Wrench,
    electrical: Zap,
    cleaning: Sparkles,
    painting: Paintbrush
  };

  // Map internal statuses to user-friendly ones
  const getStatusInfo = (booking) => {
    const stage = booking.current_stage || booking.status;
    
    const statusMap = {
      'pending_bids': { 
        label: 'Waiting for contractors', 
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Finding contractors to bid on your job'
      },
      'finding_contractor': { 
        label: 'Contractor being assigned', 
        color: 'bg-blue-100 text-blue-800',
        description: 'Assigning the best contractor for your job'
      },
      'assigned': { 
        label: 'Contractor assigned', 
        color: 'bg-green-100 text-green-800',
        description: 'Your contractor has been selected'
      },
      'arriving': { 
        label: 'Contractor arriving', 
        color: 'bg-purple-100 text-purple-800',
        description: 'Your contractor is on the way'
      },
      'work_started': { 
        label: 'Work in progress', 
        color: 'bg-indigo-100 text-indigo-800',
        description: 'Work has started on your service'
      },
      'in_progress': { 
        label: 'Work ongoing', 
        color: 'bg-indigo-100 text-indigo-800',
        description: 'Your service is being completed'
      },
      'work_completed': { 
        label: 'Completed - awaiting payment', 
        color: 'bg-orange-100 text-orange-800',
        description: 'Work is done, payment required'
      },
      'awaiting_payment': { 
        label: 'Completed - awaiting payment', 
        color: 'bg-orange-100 text-orange-800',
        description: 'Work is done, payment required'
      },
      'paid': { 
        label: 'Completed', 
        color: 'bg-emerald-100 text-emerald-800',
        description: 'Service completed successfully'
      }
    };

    return statusMap[stage] || { 
      label: 'In progress', 
      color: 'bg-gray-100 text-gray-800',
      description: 'Your booking is being processed'
    };
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'ASAP';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const formattedDate = format(dateObj, 'MMM dd');
      return time ? `${formattedDate} at ${time}` : formattedDate;
    } catch (error) {
      return 'ASAP';
    }
  };

  const getContractorInfo = (booking) => {
    if (!booking.contractor_id) return null;
    
    return {
      name: booking.contractor_name || 'Assigned Contractor',
      rating: booking.contractor_rating || 5.0
    };
  };

  const recentBookings = bookings
    .filter(booking => booking.status !== 'cancelled')
    .slice(0, 3);

  if (recentBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No recent bookings</h3>
            <p className="text-gray-500 mb-4">Book a service to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentBookings.map((booking) => {
          const ServiceIcon = serviceIcons[booking.service_type] || Wrench;
          const statusInfo = getStatusInfo(booking);
          const contractorInfo = getContractorInfo(booking);
          
          return (
            <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ServiceIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium capitalize">{booking.service_type}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(booking.scheduled_date, booking.scheduled_time)}
                    </p>
                  </div>
                </div>
                <Badge className={`${statusInfo.color} border-0`}>
                  {statusInfo.label}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{statusInfo.description}</p>
              
              {contractorInfo && (
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{contractorInfo.name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">{contractorInfo.rating}</span>
                  </div>
                </div>
              )}
              
              {booking.final_price && (
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">${booking.final_price}</span>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails(booking)}
                className="w-full"
              >
                View Details
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;