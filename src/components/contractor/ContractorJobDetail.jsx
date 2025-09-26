import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ContractorJobDetail = ({ job, onBid, onDecline, disabled }) => {
  // Memoized job details to prevent re-renders
  const jobDetails = useMemo(() => {
    if (!job) return null;
    
    return {
      id: job.id,
      serviceType: job.service_type,
      customerName: job.customer_name,
      customerPhone: job.customer_phone,
      customerEmail: job.customer_email,
      address: job.address,
      description: job.description,
      notes: job.notes,
      urgency: job.urgency,
      priceRangeMin: job.price_range_min,
      priceRangeMax: job.price_range_max,
      scheduledDate: job.scheduled_date,
      scheduledTime: job.scheduled_time,
      asap: job.asap,
      bookingType: job.booking_type,
      // Enhanced fields
      photos: job.photos || { before: [], during: [], after: [] },
      uploadedImages: job.uploaded_images || [],
      serviceQuestions: job.service_questions || {},
      additionalParts: job.additional_parts || [],
      totalBids: job.total_bids || 0,
      hasBid: job.has_bid || false
    };
  }, [job]);

  const formatScheduledDateTime = (date, time) => {
    if (!date) return 'Schedule TBD';
    
    try {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const parsedDate = parseISO(dateStr);
      const formattedDate = format(parsedDate, 'dd MMM yyyy');
      
      if (time) {
        const timeStr = time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
        return `${formattedDate}, ${timeStr}`;
      }
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date && time ? `${date} at ${time}` : date || 'Schedule TBD';
    }
  };

  const ImageModal = ({ images, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="w-4 h-4 mr-1" />
          View {title} ({images.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <img
              key={idx}
              src={image}
              alt={`${title} ${idx + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!jobDetails) return null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="capitalize text-lg">
              {jobDetails.serviceType} Service
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={jobDetails.bookingType === 'tacklers_choice' ? 'default' : 'secondary'}>
                {jobDetails.bookingType === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
              </Badge>
              {jobDetails.urgency === 'urgent' && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
              {jobDetails.hasBid && (
                <Badge variant="outline">Bid Submitted</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-green-600 text-lg">
              ${jobDetails.priceRangeMin} - ${jobDetails.priceRangeMax}
            </div>
            <p className="text-xs text-gray-500">Price Range</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location and Schedule */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-gray-500" />
            <div className="text-sm">
              <p className="font-medium">{jobDetails.address?.line1}</p>
              {jobDetails.address?.line2 && <p>{jobDetails.address.line2}</p>}
              <p className="text-gray-600">
                {jobDetails.address?.city} {jobDetails.address?.postal_code}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              {jobDetails.asap ? 'ASAP' : formatScheduledDateTime(jobDetails.scheduledDate, jobDetails.scheduledTime)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{jobDetails.customerName}</span>
          </div>
          
          {jobDetails.customerPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{jobDetails.customerPhone}</span>
            </div>
          )}
          
          {jobDetails.customerEmail && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{jobDetails.customerEmail}</span>
            </div>
          )}
        </div>

        {/* Job Description */}
        {jobDetails.description && (
          <div>
            <h4 className="font-medium text-sm mb-1">Description:</h4>
            <p className="text-sm text-gray-600">{jobDetails.description}</p>
          </div>
        )}

        {/* Customer Notes */}
        {jobDetails.notes && (
          <div>
            <h4 className="font-medium text-sm mb-1">Customer Notes:</h4>
            <p className="text-sm text-gray-600">{jobDetails.notes}</p>
          </div>
        )}

        {/* Service Questions */}
        {Object.keys(jobDetails.serviceQuestions).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Service Details:</h4>
            <div className="space-y-1">
              {Object.entries(jobDetails.serviceQuestions).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="ml-2 text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {(jobDetails.uploadedImages.length > 0 || 
          jobDetails.photos.before.length > 0 || 
          jobDetails.photos.during.length > 0 || 
          jobDetails.photos.after.length > 0) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Images:</h4>
            <div className="flex gap-2 flex-wrap">
              {jobDetails.uploadedImages.length > 0 && (
                <ImageModal images={jobDetails.uploadedImages} title="Uploaded Images" />
              )}
              {jobDetails.photos.before.length > 0 && (
                <ImageModal images={jobDetails.photos.before} title="Before Photos" />
              )}
              {jobDetails.photos.during.length > 0 && (
                <ImageModal images={jobDetails.photos.during} title="During Photos" />
              )}
              {jobDetails.photos.after.length > 0 && (
                <ImageModal images={jobDetails.photos.after} title="After Photos" />
              )}
            </div>
          </div>
        )}

        {/* Additional Parts */}
        {jobDetails.additionalParts.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Required Parts:</h4>
            <div className="space-y-1">
              {jobDetails.additionalParts.map((part, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  • {part.name} {part.quantity && `(Qty: ${part.quantity})`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competition Info */}
        {jobDetails.totalBids > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {jobDetails.totalBids} other contractor{jobDetails.totalBids !== 1 ? 's have' : ' has'} bid on this job
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onBid(job)}
            className="flex-1"
            disabled={disabled || jobDetails.hasBid}
          >
            {disabled ? 'Complete Current Job First' : 
             jobDetails.hasBid ? 'Bid Already Submitted' : 'Submit Bid'}
          </Button>
          
          <Button 
            onClick={() => onDecline(job)}
            variant="outline"
            disabled={disabled}
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorJobDetail;