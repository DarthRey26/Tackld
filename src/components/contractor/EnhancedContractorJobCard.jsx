import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, User, Calendar } from 'lucide-react';
import RescheduleRequest from './RescheduleRequest';
import ExtraPartsRequest from './ExtraPartsRequest';

const EnhancedContractorJobCard = ({ 
  booking, 
  onStageUpdate, 
  onExtraPartsRequest,
  onRescheduleRequest 
}) => {
  const getStageColor = (stage) => {
    const stageColors = {
      'arriving': 'bg-blue-100 text-blue-800',
      'work_started': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'work_completed': 'bg-green-100 text-green-800',
      'awaiting_payment': 'bg-purple-100 text-purple-800'
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date, time) => {
    if (!date) return 'ASAP';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-SG', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg capitalize">{booking.service_type} Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Booking ID: {booking.id.slice(-8)}
            </p>
          </div>
          <Badge className={getStageColor(booking.current_stage)}>
            {booking.current_stage?.replace('_', ' ') || 'Assigned'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{booking.customer_name}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="text-sm">
            <p>{booking.address?.line1}</p>
            {booking.address?.line2 && <p>{booking.address.line2}</p>}
            <p className="text-muted-foreground">Singapore {booking.address?.postal_code}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{formatDate(booking.scheduled_date, booking.scheduled_time)}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">${booking.estimated_price || booking.final_price || 'TBD'}</span>
        </div>

        {/* Description */}
        {booking.description && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm">{booking.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <ExtraPartsRequest 
            booking={booking}
            onRequestSubmitted={onExtraPartsRequest}
          />
          <RescheduleRequest 
            booking={booking}
            onRequestSubmitted={onRescheduleRequest}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedContractorJobCard;