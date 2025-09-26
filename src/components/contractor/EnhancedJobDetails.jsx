import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  FileText,
  Camera,
  User,
  Phone,
  Mail,
  Calendar,
  Timer,
  Info
} from 'lucide-react';
import PhotoCarousel from './PhotoCarousel';
import { format, parseISO } from 'date-fns';

const EnhancedJobDetails = ({ booking, onBidSubmit }) => {
  const [showImages, setShowImages] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState('uploaded');

  if (!booking) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Select a job to view details</p>
        </CardContent>
      </Card>
    );
  }

  const formatDateTime = (date, time) => {
    if (!date) return 'ASAP';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const formattedDate = format(dateObj, 'EEEE, MMMM dd, yyyy');
      return time ? `${formattedDate} at ${time}` : formattedDate;
    } catch (error) {
      return 'ASAP';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriceRangeDisplay = () => {
    if (booking.price_range_min && booking.price_range_max) {
      return `$${booking.price_range_min} - $${booking.price_range_max}`;
    } else if (booking.estimated_price) {
      return `~$${booking.estimated_price}`;
    }
    return 'Price to be determined';
  };

  const handleViewImages = (imageType) => {
    setSelectedImageType(imageType);
    setShowImages(true);
  };

  const getImagesToShow = () => {
    switch (selectedImageType) {
      case 'uploaded':
        return booking.uploaded_images || [];
      case 'before':
        return booking.before_photos || booking.stage_photos?.before_photos || [];
      case 'during':
        return booking.during_photos || booking.stage_photos?.during_photos || [];
      case 'after':
        return booking.after_photos || booking.stage_photos?.after_photos || [];
      default:
        return booking.uploaded_images || [];
    }
  };

  const getImageTitle = () => {
    switch (selectedImageType) {
      case 'uploaded': return 'Customer Uploaded Images';
      case 'before': return 'Before Work Photos';
      case 'during': return 'Progress Photos';
      case 'after': return 'Completed Work Photos';
      default: return 'Photos';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="capitalize text-xl">
                {booking.service_type} Service
              </CardTitle>
              <p className="text-muted-foreground">
                Booking ID: {booking.id?.slice(0, 8)}...
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={getUrgencyColor(booking.urgency)}>
                {booking.urgency || 'Normal'} Priority
              </Badge>
              <Badge variant="outline" className="capitalize">
                {booking.booking_type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Scheduling Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduling
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{formatDateTime(booking.scheduled_date, booking.scheduled_time)}</span>
              </div>
              {booking.asap && (
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">ASAP Request</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Service Location
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              {booking.address ? (
                typeof booking.address === 'string' ? (
                  <p>{booking.address}</p>
                ) : (
                  <div className="space-y-1">
                    <p>{booking.address.line1}</p>
                    {booking.address.line2 && <p>{booking.address.line2}</p>}
                    <p>{booking.address.city} {booking.address.postal_code}</p>
                    {booking.address.unit_number && (
                      <p className="text-sm text-gray-600">
                        Unit: {booking.address.unit_number}
                      </p>
                    )}
                  </div>
                )
              ) : (
                <p className="text-gray-500">Address not provided</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Budget Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Budget Range
            </h3>
            <div className="text-lg font-medium text-green-600">
              {getPriceRangeDisplay()}
            </div>
          </div>

          <Separator />

          {/* Problem Description */}
          {booking.description && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Problem Description
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="whitespace-pre-wrap">{booking.description}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Service-Specific Answers */}
          {booking.service_answers && Object.keys(booking.service_answers).length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Service Details
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  {Object.entries(booking.service_answers).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Customer Images */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Customer Images
            </h3>
            {booking.uploaded_images && booking.uploaded_images.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {booking.uploaded_images.length} image(s) uploaded
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => handleViewImages('uploaded')}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  View Customer Images
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No images uploaded by customer</p>
            )}
          </div>

          {/* Contact Information Notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <User className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Customer Contact</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Customer contact information will be revealed after your bid is accepted.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Bid Button */}
          <Button 
            onClick={() => onBidSubmit(booking)}
            className="w-full"
            size="lg"
          >
            Submit Bid for This Job
          </Button>
        </CardContent>
      </Card>

      {/* Photo Carousel Modal */}
      <PhotoCarousel
        images={getImagesToShow()}
        title={getImageTitle()}
        isOpen={showImages}
        onClose={() => setShowImages(false)}
      />
    </div>
  );
};

export default EnhancedJobDetails;