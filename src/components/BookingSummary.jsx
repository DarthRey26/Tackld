import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  DollarSign,
  Star,
  FileText,
  Camera,
  CheckCircle,
  Edit,
  Loader2
} from 'lucide-react';

const BookingSummary = ({ formData, config, onConfirm, onEdit, isSubmitting }) => {
  const selectedBookingType = formData.bookingType === 'tacklers_choice' 
    ? "Tackler's Choice" 
    : 'Saver Option';

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timePreference) => {
    const timeMap = {
      morning: 'Morning (8AM - 12PM)',
      afternoon: 'Afternoon (12PM - 6PM)',
      evening: 'Evening (6PM - 10PM)'
    };
    return timeMap[timePreference] || timePreference;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Booking</h2>
        <p className="text-gray-600">Please review all details before confirming your booking</p>
      </div>

      {/* Service Details */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Service Type</p>
              <p className="font-medium">{config?.title || 'Service'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Booking Option</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedBookingType}</span>
                <Badge 
                  variant={formData.bookingType === 'tacklers_choice' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {formData.bookingType === 'tacklers_choice' ? 'PREMIUM' : 'BUDGET'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Service-specific answers */}
          {Object.keys(formData.serviceQuestions).length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600 mb-2">Service Requirements</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(formData.serviceQuestions).map(([key, value]) => {
                  const question = config?.questions?.find(q => q.id === key);
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{question?.label || key}:</span>
                      <span className="text-sm font-medium">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer & Address Details */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Location & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.bookingForOther && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-medium">{formData.customerInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{formData.customerInfo.phone}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Service Address</p>
            <p className="font-medium">
              {[
                formData.address.street,
                formData.address.unit,
                'Singapore',
                formData.address.postalCode
              ].filter(Boolean).join(', ')}
            </p>
            {formData.address.instructions && (
              <p className="text-sm text-gray-500 mt-1">{formData.address.instructions}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Preferred Date</p>
              <p className="font-medium">
                {formData.isASAP ? (
                  <Badge variant="destructive" className="bg-orange-500">
                    ASAP (Within 2 hours)
                  </Badge>
                ) : (
                  formatDate(formData.preferredDate)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preferred Time</p>
              <p className="font-medium">{formData.preferredTime || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {formData.images.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5" />
              Uploaded Images ({formData.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {formData.images.map((image, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={image}
                    alt={`Service image ${idx + 1}`}
                    className="w-full h-16 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {formData.notes && (
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{formData.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Booking Type:</span>
              <span className="font-semibold">{selectedBookingType}</span>
            </div>
            {formData.bookingType === 'tacklers_choice' && (
              <p className="text-sm text-blue-600 font-medium">
                ✓ Pre-vetted contractors, instant assignment, quality guaranteed
              </p>
            )}
            {formData.bookingType === 'saver' && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Multiple contractors bid on your job for competitive pricing
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="flex-1 flex items-center gap-2"
          disabled={isSubmitting}
        >
          <Edit className="w-4 h-4" />
          Edit Details
        </Button>
        
        <Button
          onClick={onConfirm}
          className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>

      {/* Terms */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>
          By confirming this booking, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default BookingSummary;