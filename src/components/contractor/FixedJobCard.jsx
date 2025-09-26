import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Calendar,
  Camera,
  AlertTriangle,
  Star,
  Eye,
  X
} from 'lucide-react';

const FixedJobCard = ({ job, onAccept, onDecline, onViewDetails, disabled = false }) => {
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const formatDateTime = (date, time) => {
    if (!date) return 'ASAP';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-SG', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'emergency': 'bg-red-100 text-red-800',
      'urgent': 'bg-orange-100 text-orange-800',
      'normal': 'bg-blue-100 text-blue-800',
      'flexible': 'bg-green-100 text-green-800'
    };
    return colors[urgency] || colors.normal;
  };

  const getBookingTypeDisplay = (bookingType) => {
    return bookingType === 'tacklers_choice' ? "Tackler's Choice" : 
           bookingType === 'saver' ? 'Saver Option' : 
           'Open Tender';
  };

  const getBookingTypeBadge = (bookingType) => {
    if (bookingType === 'tacklers_choice') {
      return <Badge className="bg-purple-100 text-purple-800">⭐ Tackler's Choice</Badge>;
    }
    return <Badge variant="secondary">{getBookingTypeDisplay(bookingType)}</Badge>;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">
              {job.service_type || job.serviceType} Service
            </CardTitle>
            <div className="flex items-center gap-2">
              {getBookingTypeBadge(job.booking_type || job.bookingType)}
              <Badge className={getUrgencyColor(job.urgency)}>
                {job.urgency || 'Normal'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Job Description */}
            <div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {job.description || 'Service required - details will be provided upon assignment'}
              </p>
              {job.notes && (
                <p className="text-gray-600 text-xs mt-1 italic">
                  Additional notes: {job.notes}
                </p>
              )}
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Scheduled</p>
                  <p className="font-medium">
                    {formatDateTime(job.scheduled_date || job.scheduledDate, job.scheduled_time || job.scheduledTime)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Price Range</p>
                  <p className="font-medium text-green-600">
                    {job.price_range_min || job.priceRangeMin ? 
                      `$${job.price_range_min || job.priceRangeMin} - $${job.price_range_max || job.priceRangeMax}` : 
                      'Open to offers'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Location (Hidden until accepted) */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="font-medium text-sm text-gray-400">
                  📍 Address revealed after bid acceptance
                </p>
                <p className="text-xs text-gray-500">
                  General area: Singapore
                </p>
              </div>
            </div>

            {/* Customer Info (Limited until accepted) */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600 text-sm">Customer</p>
                <p className="font-medium text-sm">
                  {job.customer_name ? `${job.customer_name.charAt(0)}***` : 'Customer'} 
                  <span className="text-xs text-gray-500 ml-1">
                    (Full details after acceptance)
                  </span>
                </p>
              </div>
            </div>

            {/* Images Preview */}
            {(job.uploaded_images || job.uploadedImages) && (job.uploaded_images || job.uploadedImages).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Customer Photos</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowImagesModal(true)}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    View All ({(job.uploaded_images || job.uploadedImages).length})
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(job.uploaded_images || job.uploadedImages).slice(0, 3).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Job photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsModal(true)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDecline?.(job)}
                disabled={disabled}
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => onAccept?.(job)}
                disabled={disabled}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {job.booking_type === 'tacklers_choice' || job.bookingType === 'tacklers_choice' ? 
                  'Accept Job' : 'Submit Bid'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Modal */}
      <Dialog open={showImagesModal} onOpenChange={setShowImagesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Photos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {(job.uploaded_images || job.uploadedImages || []).map((image, index) => (
              <div key={index} className="aspect-video bg-gray-100 rounded overflow-hidden">
                <img 
                  src={image} 
                  alt={`Job photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Service Type</h4>
              <p className="text-sm text-gray-600 capitalize">
                {job.service_type || job.serviceType} Service
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-600">
                {job.description || 'Service details will be provided upon job acceptance'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Booking Type</h4>
              <p className="text-sm text-gray-600">
                {getBookingTypeDisplay(job.booking_type || job.bookingType)}
              </p>
              {(job.booking_type === 'tacklers_choice' || job.bookingType === 'tacklers_choice') && (
                <p className="text-xs text-purple-600 mt-1">
                  ⭐ Premium job with guaranteed assignment
                </p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Timeline</h4>
              <p className="text-sm text-gray-600">
                {formatDateTime(job.scheduled_date || job.scheduledDate, job.scheduled_time || job.scheduledTime)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Urgency: {job.urgency || 'Normal'}
              </p>
            </div>
            
            {(job.price_range_min || job.priceRangeMin) && (
              <div>
                <h4 className="font-medium mb-2">Budget Range</h4>
                <p className="text-sm text-gray-600">
                  ${job.price_range_min || job.priceRangeMin} - ${job.price_range_max || job.priceRangeMax}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This is the customer's expected budget range
                </p>
              </div>
            )}
            
            {job.service_questions && Object.keys(job.service_questions).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Additional Requirements</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(job.service_questions).map(([question, answer]) => (
                    <div key={question}>
                      <p className="font-medium">{question}:</p>
                      <p className="text-gray-600 ml-2">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Full customer contact details available after bid acceptance</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FixedJobCard;