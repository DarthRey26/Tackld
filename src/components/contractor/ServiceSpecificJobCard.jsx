import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, MapPin, User, Phone, Mail, Camera, 
  ArrowRight, AlertCircle, CheckCircle, Timer,
  Upload, X, Eye, Wrench, Home, Zap, Paintbrush, Sparkles
} from 'lucide-react';
import PhotoCarousel from '@/components/contractor/PhotoCarousel';
import BidSubmittedIndicator from '@/components/contractor/BidSubmittedIndicator';
import { serviceFormConfig } from '@/config/serviceFormConfig';

const ServiceSpecificJobCard = ({ job, onBidSubmit, onDecline, canBid = true, bidStatus = 'none', bidAmount, bidExpiresAt }) => {
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Get service configuration
  const serviceConfig = serviceFormConfig[job.service_type] || {};
  const serviceQuestions = serviceConfig.questions || [];

  // Service-specific icons
  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'aircon': return <Wrench className="w-5 h-5" />;
      case 'plumbing': return <Home className="w-5 h-5" />;
      case 'electrical': return <Zap className="w-5 h-5" />;
      case 'painting': return <Paintbrush className="w-5 h-5" />;
      case 'cleaning': return <Sparkles className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  // Format service answers for display
  const formatServiceAnswers = () => {
    if (!job.service_answers && !job.service_questions) return [];
    
    const answers = job.service_answers || job.service_questions || {};
    
    if (serviceQuestions.length === 0) {
      // Fallback: display raw answers
      return Object.entries(answers).map(([key, value]) => ({
        question: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        answer: Array.isArray(value) ? value.join(', ') : String(value || 'Not specified'),
        type: 'text'
      }));
    }
    
    return serviceQuestions.map(q => {
      const answer = answers[q.id] || answers[q.name] || 'Not specified';
      return {
        question: q.label,
        answer: Array.isArray(answer) ? answer.join(', ') : String(answer),
        type: q.type || 'text',
        id: q.id
      };
    }).filter(item => item.answer !== 'Not specified');
  };

  // Get urgency styling
  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'urgent':
      case 'asap':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {urgency === 'asap' ? 'ASAP' : 'Urgent'}
        </Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  // Service-specific template rendering
  const renderServiceSpecificDetails = () => {
    const serviceAnswers = formatServiceAnswers();

    switch (job.service_type) {
      case 'aircon':
        return (
          <AirconJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
      case 'plumbing':
        return (
          <PlumbingJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
      case 'electrical':
        return (
          <ElectricalJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
      case 'cleaning':
        return (
          <CleaningJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
      case 'painting':
        return (
          <PaintingJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
      default:
        return (
          <GeneralJobDetails 
            answers={serviceAnswers} 
            job={job}
          />
        );
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getServiceIcon(job.service_type)}
                <h3 className="font-semibold text-lg capitalize">
                  {job.service_type} Service
                </h3>
                <Badge variant={job.booking_type === 'tacklers_choice' ? 'default' : 'secondary'}>
                  {job.booking_type === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                {getUrgencyBadge(job.urgency)}
                {job.current_stage && (
                  <Badge variant="outline" className="capitalize">
                    {job.current_stage.replace('_', ' ')}
                  </Badge>
                )}
                {bidStatus !== 'none' && (
                  <BidStatusBadge 
                    status={bidStatus} 
                    amount={bidAmount} 
                    expiresAt={bidExpiresAt} 
                  />
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                ${job.price_range_min} - ${job.price_range_max}
              </p>
              <p className="text-xs text-muted-foreground">Budget Range</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Service-Specific Details */}
          {renderServiceSpecificDetails()}

          {/* Location & Schedule */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {job.address?.city || 'Singapore'}, {job.address?.postal_code ? `S${job.address.postal_code}` : 'Area'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {job.asap ? 'ASAP' : 
                 job.scheduled_date ? 
                   new Date(job.scheduled_date).toLocaleDateString() : 
                   'Flexible'}
              </span>
            </div>
          </div>

          {/* Customer Images */}
          {job.uploaded_images && job.uploaded_images.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-sm mb-2">Customer Photos ({job.uploaded_images.length})</h4>
              <div className="grid grid-cols-3 gap-2">
                {job.uploaded_images.slice(0, 3).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Job image ${index + 1}`}
                    className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => setShowImageCarousel(true)}
                  />
                ))}
                {job.uploaded_images.length > 3 && (
                  <div 
                    className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200"
                    onClick={() => setShowImageCarousel(true)}
                  >
                    <span className="text-xs text-gray-600">+{job.uploaded_images.length - 3} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Privacy Protection</p>
                <p>Customer details (name, phone, exact address) remain hidden until your bid is accepted.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button 
              onClick={() => setShowFullDetails(true)}
              variant="outline" 
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            
            {canBid && bidStatus === 'none' && (
              <Button 
                onClick={() => onBidSubmit(job)}
                className="flex-1"
              >
                Place Bid
              </Button>
            )}
            
            {bidStatus === 'pending' && (
              <Button 
                disabled
                className="flex-1"
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Bid Submitted
              </Button>
            )}
            
            {bidStatus === 'accepted' && (
              <Button 
                disabled
                className="flex-1 bg-green-100 text-green-700 border-green-300"
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Bid Accepted
              </Button>
            )}
            
            {canBid && bidStatus === 'none' && (
              <Button 
                onClick={() => onDecline(job)}
                variant="outline"
                className="px-4"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Image Carousel */}
      <PhotoCarousel
        images={job.uploaded_images}
        title={`${job.service_type} Service`}
        isOpen={showImageCarousel}
        onClose={() => setShowImageCarousel(false)}
      />

      {/* Full Details Modal */}
      <Dialog open={showFullDetails} onOpenChange={setShowFullDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              {getServiceIcon(job.service_type)}
              {job.service_type} Service - Complete Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Complete Service Details */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Service Requirements
              </h4>
              {renderServiceSpecificDetails()}
            </div>

            {/* Description */}
            {job.description && (
              <div>
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-muted-foreground bg-muted/50 p-3 rounded">{job.description}</p>
              </div>
            )}

            {/* All Customer Images */}
            {job.uploaded_images && job.uploaded_images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Customer Images ({job.uploaded_images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {job.uploaded_images.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Job image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Schedule & Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h5 className="font-medium mb-2">Schedule</h5>
                <p className="text-sm text-muted-foreground">
                  {job.asap ? 'ASAP - Customer needs immediate service' : 
                   job.scheduled_date ? 
                     `${new Date(job.scheduled_date).toLocaleDateString()}${job.scheduled_time ? ` at ${job.scheduled_time}` : ''}` : 
                     'Flexible scheduling'}
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Service Area</h5>
                <p className="text-sm text-muted-foreground">
                  {job.address?.city || 'Singapore'}, {job.address?.postal_code ? `Postal ${job.address.postal_code}` : 'Central Area'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Service-specific detail components
const AirconJobDetails = ({ answers, job }) => (
  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
      <Wrench className="w-4 h-4" />
      Aircon Service Details
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-blue-700 font-medium">{item.question}:</span>
          <span className="text-blue-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

const PlumbingJobDetails = ({ answers, job }) => (
  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
    <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
      <Home className="w-4 h-4" />
      Plumbing Service Details
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-indigo-700 font-medium">{item.question}:</span>
          <span className="text-indigo-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

const ElectricalJobDetails = ({ answers, job }) => (
  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
    <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
      <Zap className="w-4 h-4" />
      Electrical Service Details
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-yellow-700 font-medium">{item.question}:</span>
          <span className="text-yellow-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
    {answers.some(a => a.id === 'powerStatus' && a.answer.includes('power loss')) && (
      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-800 text-sm">
        <AlertCircle className="w-4 h-4 inline mr-1" />
        <strong>Safety Alert:</strong> Power issues detected - prioritize safety checks
      </div>
    )}
  </div>
);

const CleaningJobDetails = ({ answers, job }) => (
  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
      <Sparkles className="w-4 h-4" />
      Cleaning Service Details
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-green-700 font-medium">{item.question}:</span>
          <span className="text-green-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

const PaintingJobDetails = ({ answers, job }) => (
  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
      <Paintbrush className="w-4 h-4" />
      Painting Service Details
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-purple-700 font-medium">{item.question}:</span>
          <span className="text-purple-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

const GeneralJobDetails = ({ answers, job }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <h4 className="font-medium text-gray-800 mb-3">Service Details</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {answers.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-gray-700 font-medium">{item.question}:</span>
          <span className="text-gray-900 text-right">{item.answer}</span>
        </div>
      ))}
    </div>
  </div>
);

// Bid Status Badge Component
const BidStatusBadge = ({ status, amount, expiresAt }) => {
  const getExpiryTime = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.max(0, expiry - now);
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (diff <= 0) return 'Expired';
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  switch (status) {
    case 'pending':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
          <Timer className="w-3 h-3 mr-1" />
          Bid: ${amount} • {getExpiryTime()}
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted: ${amount}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
          <X className="w-3 h-3 mr-1" />
          Not selected
        </Badge>
      );
    default:
      return null;
  }
};

export default ServiceSpecificJobCard;