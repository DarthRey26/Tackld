import React, { useState, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, MapPin, Camera, AlertCircle, CheckCircle, 
  Eye, X, Wrench, Home, Zap, Paintbrush, Sparkles,
  Wifi, RefreshCcw, Info
} from 'lucide-react';
import PhotoCarousel from '@/components/contractor/PhotoCarousel';
import BidSubmittedIndicator from '@/components/contractor/BidSubmittedIndicator';
import { serviceFormConfig } from '@/config/serviceFormConfig';
import { filterBookingForContractor, formatServiceAnswersForDisplay, validateContractorBookingData } from '@/utils/contractorDataFilter';

const EnhancedJobCard = ({ 
  job, 
  onBidSubmit, 
  onDecline, 
  canBid = true, 
  bidStatus = 'none',
  bidAmount,
  bidExpiresAt,
  className = ""
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Filter booking data for contractor view (privacy protection)
  const filteredJob = useMemo(() => filterBookingForContractor(job), [job]);
  
  // Validate booking data and get service configuration
  const validation = useMemo(() => validateContractorBookingData(filteredJob), [filteredJob]);
  const serviceConfig = serviceFormConfig[filteredJob?.service_type] || {};
  
  // Format service answers with graceful fallback
  const serviceAnswers = useMemo(() => {
    try {
      if (!filteredJob?.service_answers) return [];
      return formatServiceAnswersForDisplay(filteredJob.service_answers, serviceConfig);
    } catch (error) {
      console.error('Error formatting service answers:', error);
      return [];
    }
  }, [filteredJob?.service_answers, serviceConfig]);

  // Service-specific icons
  const getServiceIcon = (serviceType) => {
    const icons = {
      aircon: Wrench,
      plumbing: Home,
      electrical: Zap,
      painting: Paintbrush,
      cleaning: Sparkles
    };
    const IconComponent = icons[serviceType] || Wrench;
    return <IconComponent className="w-5 h-5" />;
  };

  // Urgency badge with proper styling
  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'urgent':
      case 'asap':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {urgency === 'asap' ? 'ASAP' : 'Urgent'}
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  // Handle missing or malformed data gracefully
  if (!filteredJob) {
    return (
      <Card className={`border-l-4 border-l-destructive ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load job details. Please refresh or contact support.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`hover:shadow-lg transition-all border-l-4 border-l-primary ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getServiceIcon(filteredJob.service_type)}
                <h3 className="font-semibold text-lg capitalize">
                  {filteredJob.service_type} Service
                </h3>
                <Badge variant={filteredJob.booking_type === 'tacklers_choice' ? 'default' : 'secondary'}>
                  {filteredJob.booking_type === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {getUrgencyBadge(filteredJob.urgency)}
                {filteredJob.current_stage && (
                  <Badge variant="outline" className="capitalize">
                    {filteredJob.current_stage.replace('_', ' ')}
                  </Badge>
                )}
                {bidStatus !== 'none' && (
                  <BidSubmittedIndicator 
                    status={bidStatus} 
                    amount={bidAmount} 
                    expiresAt={bidExpiresAt} 
                  />
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                ${filteredJob.price_range_min} - ${filteredJob.price_range_max}
              </p>
              <p className="text-xs text-muted-foreground">Budget Range</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Service-Specific Details */}
          <ServiceDetailsSection 
            serviceAnswers={serviceAnswers}
            serviceType={filteredJob.service_type}
            showFallback={!validation.hasServiceAnswers}
          />

          {/* Location & Schedule */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{filteredJob.service_area}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {filteredJob.asap ? 'ASAP' : 
                 filteredJob.scheduled_date ? 
                   new Date(filteredJob.scheduled_date).toLocaleDateString() : 
                   'Flexible'}
              </span>
            </div>
          </div>

          {/* Customer Images with Lazy Loading */}
          {validation.hasImages && (
            <ImagePreviewSection
              images={filteredJob.uploaded_images}
              onViewAll={() => setShowImageCarousel(true)}
            />
          )}

          {/* Privacy Notice */}
          <PrivacyNotice />

          {/* Actions */}
          <ActionButtons
            job={filteredJob}
            canBid={canBid}
            bidStatus={bidStatus}
            onViewDetails={() => setShowFullDetails(true)}
            onBidSubmit={() => onBidSubmit(job)}
            onDecline={() => onDecline(job)}
          />
        </CardContent>
      </Card>

      {/* Image Carousel */}
      <PhotoCarousel
        images={filteredJob.uploaded_images || []}
        title={`${filteredJob.service_type} Service Photos`}
        isOpen={showImageCarousel}
        onClose={() => setShowImageCarousel(false)}
      />

      {/* Full Details Modal */}
      <FullDetailsModal
        job={filteredJob}
        serviceAnswers={serviceAnswers}
        serviceIcon={getServiceIcon(filteredJob.service_type)}
        isOpen={showFullDetails}
        onClose={() => setShowFullDetails(false)}
      />
    </>
  );
};

// Service Details Section Component
const ServiceDetailsSection = ({ serviceAnswers, serviceType, showFallback }) => {
  if (showFallback || serviceAnswers.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground border border-dashed">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>More details available upon opening booking. Please refresh or contact support.</span>
        </div>
      </div>
    );
  }

  return (
    <ServiceSpecificTemplate 
      serviceType={serviceType}
      answers={serviceAnswers.slice(0, 4)}
    />
  );
};

// Service-Specific Template Renderer
const ServiceSpecificTemplate = ({ serviceType, answers }) => {
  const templates = {
    aircon: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'text-blue-800' },
    plumbing: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', label: 'text-indigo-800' },
    electrical: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'text-yellow-800' },
    cleaning: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'text-green-800' },
    painting: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', label: 'text-purple-800' },
    default: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: 'text-gray-800' }
  };

  const template = templates[serviceType] || templates.default;

  return (
    <div className={`${template.bg} rounded-lg p-4 border ${template.border}`}>
      <h4 className={`font-medium ${template.label} mb-3 capitalize`}>
        {serviceType} Service Details
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {answers.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className={`${template.text} font-medium`}>{item.question}:</span>
            <span className={`${template.label} text-right`}>{item.answer}</span>
          </div>
        ))}
      </div>
      
      {/* Safety alerts for electrical */}
      {serviceType === 'electrical' && answers.some(a => 
        a.id === 'powerStatus' && a.answer?.includes('power loss')
      ) && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          <strong>Safety Alert:</strong> Power issues detected - prioritize safety checks
        </div>
      )}
    </div>
  );
};

// Image Preview with Lazy Loading and Thumbnails
const ImagePreviewSection = ({ images, onViewAll }) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  
  const handleImageLoad = (index) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  return (
    <div className="border-t pt-3">
      <h4 className="font-medium text-sm mb-2 flex items-center justify-between">
        <span>Customer Photos ({images?.length || 0})</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}
          className="h-auto p-1 text-primary"
        >
          View All
        </Button>
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {images?.slice(0, 3).map((imageUrl, index) => (
          <div key={index} className="relative">
            {!loadedImages.has(index) && (
              <Skeleton className="w-full h-16 rounded" />
            )}
            <img
              src={imageUrl}
              alt={`Job image ${index + 1}`}
              className={`w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity ${
                !loadedImages.has(index) ? 'absolute inset-0' : ''
              }`}
              onClick={onViewAll}
              onLoad={() => handleImageLoad(index)}
              onError={() => handleImageLoad(index)}
              loading="lazy"
            />
          </div>
        ))}
        {(images?.length || 0) > 3 && (
          <div 
            className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={onViewAll}
          >
            <span className="text-xs text-gray-600">+{images.length - 3} more</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Privacy Notice Component
const PrivacyNotice = () => (
  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground">Privacy Protection</p>
        <p>Customer details (name, phone, exact address) remain hidden until your bid is accepted.</p>
      </div>
    </div>
  </div>
);

// Action Buttons Component
const ActionButtons = ({ 
  job, 
  canBid, 
  bidStatus, 
  onViewDetails, 
  onBidSubmit, 
  onDecline 
}) => (
  <div className="flex gap-3 pt-3">
    <Button 
      onClick={onViewDetails}
      variant="outline" 
      className="flex-1"
    >
      <Eye className="w-4 h-4 mr-2" />
      View Full Details
    </Button>
    
    {canBid && bidStatus === 'none' && (
      <Button 
        onClick={onBidSubmit}
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
        onClick={onDecline}
        variant="outline"
        className="px-4"
      >
        <X className="w-4 h-4" />
      </Button>
    )}
  </div>
);

// Full Details Modal Component
const FullDetailsModal = ({ 
  job, 
  serviceAnswers, 
  serviceIcon, 
  isOpen, 
  onClose 
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 capitalize">
          {serviceIcon}
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
          <ServiceSpecificTemplate 
            serviceType={job.service_type}
            answers={serviceAnswers}
          />
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
            <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-32 rounded" />
              ))}
            </div>}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {job.uploaded_images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Job image ${index + 1}`}
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => window.open(imageUrl, '_blank')}
                    loading="lazy"
                  />
                ))}
              </div>
            </Suspense>
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
            <p className="text-sm text-muted-foreground">{job.service_area}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default EnhancedJobCard;