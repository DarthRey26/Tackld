import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  AlertTriangle,
  Eye,
  Zap,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

const JobCard = ({ job, onBid, onDecline, onViewImages }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Check if contractor has already bid on this job using the enhanced data
  const hasBid = job.has_bid === true;
  const bidStatus = job.bid_status || 'none';
  const bidAmount = job.bid_amount;
  const totalBids = job.total_bids || 0;

  const formatScheduledDateTime = (date, time) => {
    if (!date) return 'Schedule TBD';
    
    try {
      const jobDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(jobDate.getTime())) {
        return 'Schedule TBD';
      }
      
      const formattedDate = format(jobDate, 'dd MMM yyyy');
      const formattedTime = time || '10:00';
      
      // Convert 24hr to 12hr format for display
      const [hours, minutes] = formattedTime.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      
      return `${formattedDate}, ${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Schedule TBD';
    }
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'urgent') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Emergency
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Normal Priority
      </Badge>
    );
  };

  const getPriceRangeDisplay = () => {
    if (job.price_range_min && job.price_range_max) {
      return `$${job.price_range_min} - $${job.price_range_max}`;
    }
    return 'Quote required';
  };

  const getBookingTypeBadge = (bookingType) => {
    switch (bookingType) {
      case 'tacklers_choice':
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-300">
            <Zap className="w-3 h-3 mr-1" />
            Tackler's Choice
          </Badge>
        );
      case 'saver':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
            Saver
          </Badge>
        );
      case 'open_tender':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Open Tender
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${hasBid ? 'border-green-300 bg-green-50/30' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg capitalize">
              {job.service_type} Service
            </span>
            <div className="flex gap-2">
              {hasBid && bidStatus === 'pending' && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  Bid Pending: ${bidAmount}
                </Badge>
              )}
              {hasBid && bidStatus === 'accepted' && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Bid Accepted: ${bidAmount}
                </Badge>
              )}
              {hasBid && bidStatus === 'rejected' && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  Bid Rejected
                </Badge>
              )}
              {totalBids > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {totalBids} bid{totalBids !== 1 ? 's' : ''}
                </Badge>
              )}
              {getBookingTypeBadge(job.booking_type)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Urgency */}
            <div className="flex items-center justify-between">
              {getUrgencyBadge(job.urgency)}
              <span className="text-xs text-gray-500">
                ID: {job.id.slice(-6)}
              </span>
            </div>

            {/* Scheduled Date & Time */}
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatScheduledDateTime(job.scheduled_date, job.scheduled_time)}</span>
            </div>

            {/* Price Range */}
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>{getPriceRangeDisplay()}</span>
            </div>

            {/* Address (hidden) */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Address provided after acceptance</span>
            </div>

            {/* Customer Description */}
            {job.description && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Customer Issue:</h4>
                <p className="text-sm text-gray-600 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {job.description}
                </p>
              </div>
            )}

            {/* Uploaded Images */}
            {job.uploaded_images && job.uploaded_images.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {job.uploaded_images.length} image{job.uploaded_images.length !== 1 ? 's' : ''} attached
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewImages(job.uploaded_images)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Details
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDecline(job)}
                className="px-3"
              >
                Decline
              </Button>
              {hasBid ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 cursor-not-allowed ${
                    bidStatus === 'accepted' ? 'bg-green-100 text-green-700 border-green-300' :
                    bidStatus === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-orange-100 text-orange-700 border-orange-300'
                  }`}
                  disabled
                >
                  {bidStatus === 'accepted' ? 'Bid Accepted' :
                   bidStatus === 'rejected' ? 'Bid Rejected' :
                   'Bid Submitted'}
                </Button>
              ) : (
                <Button
                  onClick={() => onBid(job)}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Bid
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="capitalize">{job.service_type} Service Request</span>
              {getBookingTypeBadge(job.booking_type)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Schedule</h4>
                <p className="text-sm">{formatScheduledDateTime(job.scheduledDate, job.scheduledTime)}</p>
                {getUrgencyBadge(job.urgency)}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                <p className="text-sm">{getPriceRangeDisplay()}</p>
              </div>
            </div>

            {job.description && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Customer Description</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{job.description}</p>
                </div>
              </div>
            )}

            {job.uploadedImages && job.uploadedImages.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Uploaded Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {job.uploadedImages.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Job image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetails(false);
                  onDecline(job);
                }}
                className="px-6"
              >
                Decline Job
              </Button>
              {hasBid ? (
                <Button
                  variant="outline"
                  className="flex-1 cursor-not-allowed"
                  disabled
                >
                  Bid Already Submitted
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setShowDetails(false);
                    onBid(job);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Bid
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;