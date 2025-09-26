import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Star, 
  Clock, 
  MapPin, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Shield,
  DollarSign,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { serviceFormConfig } from '@/config/serviceFormConfig';
import BookingSummary from './BookingSummary';
import SimpleAddressForm from './SimpleAddressForm';
import ErrorBoundary from './ErrorBoundary';
import { storageService, bookingService } from '@/lib/services';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/unified/ImageUpload';
import { validateBookingData } from '@/components/unified/ServiceValidation';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';

const BOOKING_TYPES = {
  saver: {
    label: 'Saver',
    description: 'Multiple contractors bid on your job',
    icon: DollarSign,
    features: ['Competitive pricing', 'Multiple quotes', 'You choose contractor']
  },
  tacklers_choice: {
    label: "Tackler's Choice",
    description: 'We assign a vetted contractor',
    icon: Shield,
    features: ['Pre-vetted contractors', 'Instant assignment', 'Quality guaranteed']
  }
};

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

// Service Question Component
const ServiceQuestion = ({ question, value, onChange, error }) => {
  const renderInput = () => {
    switch (question.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Choose an option...</option>
            {question.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((option) => {
              const checked = (value || []).includes(option);
              return (
                <label key={option} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const newValue = value || [];
                      if (e.target.checked) {
                        onChange([...newValue, option]);
                      } else {
                        onChange(newValue.filter(v => v !== option));
                      }
                    }}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || '')}
            min={question.min}
            max={question.max}
            className={`${error ? 'border-red-500' : ''}`}
            placeholder={`Enter a number${question.min ? ` (min: ${question.min})` : ''}${question.max ? ` (max: ${question.max})` : ''}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'Enter details...'}
            rows={4}
            maxLength={question.maxLength || 500}
            className={`${error ? 'border-red-500' : ''}`}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'Enter your answer...'}
            className={`${error ? 'border-red-500' : ''}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {question.label} {question.required && '*'}
      </label>
      {renderInput()}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

// Helper function to convert time format from "10:00 AM" to "10:00"
const convertTimeToHHMM = (timeString) => {
  if (!timeString) return '10:00';
  
  // If already in HH:mm format, return as is
  if (timeString.match(/^\d{1,2}:\d{2}$/)) {
    return timeString;
  }
  
  // Convert from "10:00 AM/PM" format to "10:00"
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours);
  
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

const BookingFlow = ({ serviceType: propServiceType }) => {
  const { serviceType: paramServiceType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use prop serviceType first, then URL param as fallback
  const serviceType = propServiceType || paramServiceType;
  const config = serviceFormConfig[serviceType];

  // Get user and profile from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState({
    bookingForOther: false,
    customerInfo: {
      name: userProfile.fullName || userProfile.full_name || user.email?.split('@')[0] || '',
      phone: userProfile.phoneNumber || userProfile.phone_number || user.phone || '',
      email: userProfile.email || user.email || ''
    },
    address: {
      type: 'manual',
      street: userProfile.address?.street || '',
      unit: '',
      postalCode: userProfile.address?.postalCode || '',
      instructions: '',
      housingType: userProfile.address?.housingType || 'HDB'
    },
    serviceQuestions: {},
    preferredDate: null,
    preferredTime: '',
    isASAP: false,
    bookingType: '',
    images: [],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  // Save to localStorage on formData change
  useEffect(() => {
    if (serviceType) {
      localStorage.setItem(`booking_draft_${serviceType}`, JSON.stringify(formData));
    }
  }, [formData, serviceType]);

  // Load draft on component mount
  useEffect(() => {
    if (serviceType) {
      const draft = localStorage.getItem(`booking_draft_${serviceType}`);
      if (draft) {
        setFormData(prev => ({ ...prev, ...JSON.parse(draft) }));
      }
    }
  }, [serviceType]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (files) => {
    const fileArray = Array.from(files);
    
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const uploadResult = await storageService.uploadFile(file, 'job-images');
        
        if (uploadResult.data) {
          return uploadResult.data.publicUrl;
        } else {
          throw new Error(uploadResult.error?.message || 'Upload failed');
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      
      toast({
        title: "Images Uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.customerInfo.name) newErrors.name = 'Name is required';
        if (!formData.customerInfo.phone) newErrors.phone = 'Phone is required';
        if (!formData.customerInfo.email) newErrors.email = 'Email is required';
        break;
      case 2:
        if (formData.address.type === 'manual') {
          if (!formData.address.street) newErrors.street = 'Street address is required';
          if (!formData.address.postalCode) newErrors.postalCode = 'Postal code is required';
        }
        break;
      case 3:
        if (config?.questions) {
          config.questions.forEach(q => {
            if (q.required && !formData.serviceQuestions[q.id]) {
              newErrors[q.id] = `${q.label} is required`;
            }
          });
        }
        if (!formData.isASAP && (!formData.preferredDate || !formData.preferredTime)) {
          newErrors.schedule = 'Please select a date and time or choose ASAP';
        }
        break;
      case 4:
        if (!formData.bookingType) newErrors.bookingType = 'Please select a booking type';
        if (formData.images.length === 0) newErrors.images = 'At least one image is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step === 4) {
        setShowSummary(true);
      } else {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting booking:', formData);
      
      // Get current authenticated user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to create a booking');
      }
      
      // Build Supabase booking data according to spec.md
      const bookingData = {
        customer_id: user.id, // Supabase user ID
        customer_name: formData.customerInfo.name,
        customer_email: formData.customerInfo.email,
        customer_phone: formData.customerInfo.phone,
        
        service_type: serviceType,
        booking_type: formData.bookingType || 'saver',
        description: formData.notes || '', // Customer-provided description
        uploaded_images: uploadedImages, // Supabase URLs
        service_answers: formData.serviceQuestions || {}, // Include detailed service responses for contractors
        
        address: {
          fullAddress: `${formData.address.street} ${formData.address.unit}`.trim(),
          postalCode: formData.address.postalCode,
          type: formData.address.type || 'HDB'
        },
        
        scheduled_date: formData.preferredDate ? formData.preferredDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // YYYY-MM-DD
        scheduled_time: formData.preferredTime ? convertTimeToHHMM(formData.preferredTime) : '10:00', // HH:mm
        urgency: formData.isASAP ? 'urgent' : 'normal',
        asap: formData.isASAP || false,
        
        status: 'finding_contractor' // Will be set by backend after creation
      };
      
      // Store in session for UI tracking
      sessionStorage.setItem('activeBooking', JSON.stringify(bookingData));
      
      // Save to Supabase using bookingService
      const { data: booking, error } = await bookingService.createBooking(bookingData);
      
      if (error) {
        throw new Error(error.message || 'Failed to create booking');
      }
      
      console.log('✅ Booking saved to Supabase:', booking.id);
      
      // Update session storage with Supabase ID
      const updatedBooking = { ...bookingData, id: booking.id };
      sessionStorage.setItem('activeBooking', JSON.stringify(updatedBooking));
      
      // Clear draft
      localStorage.removeItem(`booking_draft_${serviceType}`);
      
      toast({
        title: "Booking Submitted!",
        description: "Your booking request has been submitted successfully.",
        variant: "default"
      });
      
      // Navigate to booking success page
      navigate('/booking-success', { state: { booking: updatedBooking } });
    } catch (error) {
      console.error('Booking submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle page exit warning
  const handleExitAttempt = () => {
    const hasFormData = Object.values(formData).some(value => {
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== '' && v !== null);
      }
      return value !== '' && value !== null;
    });

    if (hasFormData && !isSubmitting) {
      setShowExitWarning(true);
      return false;
    }
    return true;
  };

  const confirmExit = () => {
    localStorage.removeItem(`booking_draft_${serviceType}`);
    setShowExitWarning(false);
    navigate('/');
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Service Not Found</h2>
            <p className="text-gray-600">This service is not available.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary onRestore={(data) => setFormData(prev => ({ ...prev, ...data }))}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={handleExitAttempt}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services
              </Button>
              
              <div className="text-right">
                <h1 className="text-2xl font-bold capitalize">
                  {config.title}
                </h1>
                <p className="text-gray-600">
                  {showSummary ? 'Please review your booking details' : `Step ${step} of 4`}
                </p>
              </div>
            </div>
          </div>

          <Card className="animate-fade-in">
            <CardContent className="p-6">
              {/* Booking Summary */}
              {showSummary && (
                <BookingSummary
                  formData={formData}
                  config={config}
                  onConfirm={submitBooking}
                  onEdit={() => setShowSummary(false)}
                  isSubmitting={isSubmitting}
                />
              )}

              {!showSummary && (
                <>
                  {/* Step 1: Customer Details */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Customer Details</h2>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Booking for yourself</p>
                            <p className="text-sm text-gray-600">Using your account details</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputChange('', 'bookingForOther', !formData.bookingForOther)}
                          >
                            {formData.bookingForOther ? 'Book for myself' : 'Book for someone else'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name *</label>
                          <Input
                            value={formData.customerInfo.name}
                            onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                            placeholder="Enter full name"
                            className={errors.name ? 'border-red-500' : ''}
                          />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Phone Number *</label>
                          <Input
                            value={formData.customerInfo.phone}
                            onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                            placeholder="+65 8123 4567"
                            className={errors.phone ? 'border-red-500' : ''}
                          />
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">Email Address *</label>
                          <Input
                            type="email"
                            value={formData.customerInfo.email}
                            onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                            placeholder="your.email@example.com"
                            className={errors.email ? 'border-red-500' : ''}
                          />
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Address */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Service Address</h2>
                      <SimpleAddressForm
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* Step 3: Service Details & Schedule */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Service Details & Schedule</h2>
                      
                      {/* Service-specific questions */}
                      {config.questions && config.questions.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Service Information</h3>
                          {config.questions.map((question) => (
                            <ServiceQuestion
                              key={question.id}
                              question={question}
                              value={formData.serviceQuestions[question.id]}
                              onChange={(value) => {
                                setFormData(prev => ({
                                  ...prev,
                                  serviceQuestions: {
                                    ...prev.serviceQuestions,
                                    [question.id]: value
                                  }
                                }));
                              }}
                              error={errors[question.id]}
                            />
                          ))}
                        </div>
                      )}

                      {/* Schedule selection */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Preferred Schedule</h3>
                        
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={formData.isASAP}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  isASAP: true,
                                  preferredDate: null,
                                  preferredTime: ''
                                }));
                              }}
                              className="text-blue-500"
                            />
                            <span className="font-medium">ASAP (Within 2 hours)</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={!formData.isASAP}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  isASAP: false
                                }));
                              }}
                              className="text-blue-500"
                            />
                            <span className="font-medium">Schedule for later</span>
                          </label>
                        </div>

                        {!formData.isASAP && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Preferred Date</label>
                              <Calendar
                                mode="single"
                                selected={formData.preferredDate}
                                onSelect={(date) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferredDate: date
                                  }));
                                }}
                                disabled={(date) => date < new Date()}
                                className="rounded-md border"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Preferred Time</label>
                              <div className="grid grid-cols-2 gap-2">
                                {TIME_SLOTS.map((time) => (
                                  <Button
                                    key={time}
                                    type="button"
                                    variant={formData.preferredTime === time ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        preferredTime: time
                                      }));
                                    }}
                                    className="justify-center"
                                  >
                                    {time}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {errors.schedule && <p className="text-red-500 text-xs">{errors.schedule}</p>}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Booking Type & Final Details */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Choose Your Booking Type</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(BOOKING_TYPES).map(([key, type]) => {
                          const Icon = type.icon;
                          const isSelected = formData.bookingType === key;
                          return (
                            <Card
                              key={key}
                              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                isSelected 
                                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg transform scale-105' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                handleInputChange('', 'bookingType', key);
                                toast({
                                  title: "Booking Type Selected",
                                  description: `${type.label} selected`,
                                  variant: "default"
                                });
                              }}
                            >
                              <CardContent className="p-6 text-center relative">
                                <div className="absolute top-3 right-3">
                                  <Badge 
                                    variant={key === 'tacklers_choice' ? 'default' : 'secondary'}
                                    className={`text-xs ${
                                      key === 'tacklers_choice' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {key === 'tacklers_choice' ? 'Premium' : 'Budget'}
                                  </Badge>
                                </div>
                                
                                <Icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                                <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                                <p className="text-gray-600 mb-4">{type.description}</p>
                                
                                <div className="space-y-2">
                                  {type.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center justify-center text-sm text-gray-600">
                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                      {feature}
                                    </div>
                                  ))}
                                </div>
                                
                                {isSelected && (
                                  <div className="absolute top-3 left-3">
                                    <CheckCircle className="w-6 h-6 text-blue-500 animate-bounce" />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Upload Images *</label>
                        <p className="text-xs text-gray-500 mb-3">
                          Upload photos of the area or issue that needs attention. This helps contractors understand your needs better.
                        </p>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files)}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                              Click to upload images
                            </p>
                            <p className="text-sm text-gray-500">
                              Supports: JPG, PNG, GIF (Max 10MB each)
                            </p>
                          </label>
                        </div>

                        {formData.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Uploaded Images ({formData.images.length})</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {formData.images.map((image, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={image}
                                    alt={`Upload ${idx + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        images: prev.images.filter((_, i) => i !== idx)
                                      }));
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => handleInputChange('', 'notes', e.target.value)}
                          placeholder="Any specific requirements, access instructions, or details about the job..."
                          rows={3}
                          maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.notes.length}/500 characters
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={step === 1}
                      className="flex items-center gap-2"
                    >
                      ← Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {step}/4 steps completed
                      </span>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2"
                      >
                        {step === 4 ? 'Review Booking' : 'Next'}
                        {step < 4 && '→'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BookingFlow;