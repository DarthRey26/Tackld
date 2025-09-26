import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { storageService } from "@/lib/services";
import { bookingService } from "@/lib/services";
import { Calendar, Clock, Upload, MapPin } from 'lucide-react';

const BookingForm = ({ serviceType, onBookingCreated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    postalCode: '',
    scheduledDate: '',
    scheduledTime: '',
    description: '',
    priceRangeMin: 50,
    priceRangeMax: 300,
    bookingType: 'open_tender'
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceQuestions = {
    aircon: [
      { key: 'unit_type', label: 'Aircon Unit Type', type: 'select', options: ['Window Unit', 'Split Unit', 'Ceiling Cassette', 'Central AC'] },
      { key: 'issue_type', label: 'Issue Type', type: 'select', options: ['Not Cooling', 'Water Leaking', 'Strange Noise', 'General Servicing', 'Installation'] },
      { key: 'unit_age', label: 'Unit Age (Years)', type: 'number' }
    ],
    plumbing: [
      { key: 'issue_type', label: 'Plumbing Issue', type: 'select', options: ['Pipe Leak', 'Toilet Issue', 'Sink/Tap Problem', 'Water Heater', 'Installation'] },
      { key: 'urgency', label: 'Urgency Level', type: 'select', options: ['Emergency', 'Same Day', 'Within 3 Days', 'Flexible'] },
      { key: 'affected_areas', label: 'Affected Areas', type: 'text' }
    ],
    electrical: [
      { key: 'issue_type', label: 'Electrical Issue', type: 'select', options: ['Power Outage', 'Faulty Wiring', 'Light Installation', 'Socket Problems', 'Circuit Breaker'] },
      { key: 'safety_concern', label: 'Safety Concern', type: 'select', options: ['Yes - Urgent', 'Minor Issue', 'Routine Work'] },
      { key: 'affected_rooms', label: 'Affected Rooms', type: 'text' }
    ],
    cleaning: [
      { key: 'cleaning_type', label: 'Cleaning Type', type: 'select', options: ['Deep Cleaning', 'Regular Cleaning', 'Move-in/out', 'Post-renovation'] },
      { key: 'property_size', label: 'Property Size', type: 'select', options: ['1-2 Rooms', '3-4 Rooms', '5+ Rooms', 'Condo/Landed'] },
      { key: 'special_requirements', label: 'Special Requirements', type: 'text' }
    ],
    painting: [
      { key: 'paint_area', label: 'Area to Paint', type: 'select', options: ['Single Room', 'Multiple Rooms', 'Whole House', 'Exterior'] },
      { key: 'paint_type', label: 'Paint Type Preference', type: 'select', options: ['No Preference', 'Eco-friendly', 'Premium', 'Budget'] },
      { key: 'current_condition', label: 'Current Wall Condition', type: 'select', options: ['Good', 'Needs Repair', 'Wallpaper Removal Required'] }
    ]
  };

  const [serviceAnswers, setServiceAnswers] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceAnswerChange = (key, value) => {
    setServiceAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const result = await storageService.uploadJobImages(files, `bookings/${Date.now()}`);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      const uploadedImages = result.data.map(item => ({
        name: item.path.split('/').pop(),
        url: item.publicUrl,
        path: item.path
      }));

      setImages(prev => [...prev, ...uploadedImages]);
      
      toast({
        title: "Images uploaded successfully",
        description: `${uploadedImages.length} image(s) uploaded`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of the site/issue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const bookingData = {
        customerId: `customer_${Date.now()}`, // In real app, get from auth
        customerEmail: formData.customerEmail,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        serviceType: serviceType,
        bookingType: formData.bookingType,
        address: `${formData.address}, Singapore ${formData.postalCode}`,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        description: formData.description,
        serviceQuestions: serviceAnswers,
        uploadedImages: images,
        priceRangeMin: formData.priceRangeMin,
        priceRangeMax: formData.priceRangeMax
      };

      const result = await bookingService.createBooking(bookingData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Booking created successfully!",
        description: "Contractors will start bidding on your job",
      });

      // Store booking in session for tracking
      sessionStorage.setItem('activeBooking', JSON.stringify(result.data));
      
      if (onBookingCreated) {
        onBookingCreated(result.data);
      }

    } catch (error) {
      console.error('Booking submission error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestions = serviceQuestions[serviceType] || [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Book {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Service Location</h3>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Block/Unit Number, Street Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* Service-Specific Questions */}
          {currentQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Details</h3>
              {currentQuestions.map((question) => (
                <div key={question.key}>
                  <Label htmlFor={question.key}>{question.label}</Label>
                  {question.type === 'select' ? (
                    <Select onValueChange={(value) => handleServiceAnswerChange(question.key, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${question.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : question.type === 'number' ? (
                    <Input
                      id={question.key}
                      type="number"
                      min="0"
                      onChange={(e) => handleServiceAnswerChange(question.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={question.key}
                      onChange={(e) => handleServiceAnswerChange(question.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferred Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Preferred Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Preferred Time</Label>
                <Select onValueChange={(value) => handleInputChange('scheduledTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue or requirements in detail..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Images *</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <label htmlFor="images" className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Click to upload images or drag and drop
                </span>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Budget Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceMin">Min Budget (SGD)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={formData.priceRangeMin}
                  onChange={(e) => handleInputChange('priceRangeMin', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="priceMax">Max Budget (SGD)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={formData.priceRangeMax}
                  onChange={(e) => handleInputChange('priceRangeMax', Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Booking Type */}
          <div>
            <Label htmlFor="bookingType">Contractor Selection</Label>
            <Select onValueChange={(value) => handleInputChange('bookingType', value)} defaultValue="open_tender">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tacklers_choice">Tackler's Choice (Auto-assign trusted contractor)</SelectItem>
                <SelectItem value="saver_option">Saver Option (Lowest bids shown first)</SelectItem>
                <SelectItem value="open_tender">Open Tender (You choose from all bids)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
            {isSubmitting ? 'Creating Booking...' : 'Submit Booking Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;