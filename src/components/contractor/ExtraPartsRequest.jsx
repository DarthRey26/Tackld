import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { extraPartsService, storageService } from '@/lib/services';
import { validateExtraPartsForm } from '@/lib/validation/bookingValidation';
import ImageUpload from '@/components/unified/ImageUpload';
import { Plus, Package, DollarSign, Camera } from 'lucide-react';

const ExtraPartsRequest = ({ booking, onRequestSubmitted }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    part_name: '',
    quantity: 1,
    unit_price: 0,
    reason: '',
    photo_url: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Handle numeric fields properly
    if (field === 'quantity') {
      processedValue = parseInt(value) || 1;
    } else if (field === 'unit_price') {
      processedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageUpload = async (files) => {
    try {
      const file = files[0];
      if (!file) return;

      const uploadResult = await storageService.uploadFile(file, 'job-images');
      
      if (uploadResult.data) {
        setFormData(prev => ({
          ...prev,
          photo_url: uploadResult.data.publicUrl
        }));
        
        toast({
          title: "Image Uploaded",
          description: "Part image uploaded successfully",
        });
      } else {
        throw new Error(uploadResult.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate total price
    const totalPrice = parseFloat(formData.unit_price) * parseInt(formData.quantity);
    
    const requestData = {
      booking_id: booking.id,
      part_name: formData.part_name,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      total_price: totalPrice,
      reason: formData.reason,
      photo_url: formData.photo_url
    };

    // Validate form data
    const validation = validateExtraPartsForm(requestData);
    if (validation.error) {
      const formErrors = {};
      validation.error.forEach(error => {
        formErrors[error.path[0]] = error.message;
      });
      setErrors(formErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await extraPartsService.createExtraPartsRequest(requestData);
      
      if (error) {
        throw new Error(error.message || 'Failed to submit extra parts request');
      }

      toast({
        title: "Extra Parts Requested",
        description: "Your request has been sent to the customer for approval.",
      });

      // Reset form and close dialog
      setFormData({
        part_name: '',
        quantity: 1,
        unit_price: 0,
        reason: '',
        photo_url: ''
      });
      setErrors({});
      setIsOpen(false);
      
      // Notify parent component
      onRequestSubmitted?.(data);

    } catch (error) {
      console.error('Error submitting extra parts request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Request Extra Parts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Request Additional Parts
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="part_name">Part Name *</Label>
            <Input
              id="part_name"
              value={formData.part_name}
              onChange={(e) => handleInputChange('part_name', e.target.value)}
              placeholder="e.g., Air filter, Pipe fitting, etc."
              className={errors.part_name ? 'border-red-500' : ''}
            />
            {errors.part_name && (
              <p className="text-red-500 text-xs mt-1">{errors.part_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="unit_price">Unit Price (SGD) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', e.target.value)}
                  className={`pl-10 ${errors.unit_price ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.unit_price && (
                <p className="text-red-500 text-xs mt-1">{errors.unit_price}</p>
              )}
            </div>
          </div>

          {/* Total Price Display */}
          {formData.unit_price > 0 && formData.quantity > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${(formData.unit_price * formData.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason for Additional Parts *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Explain why these additional parts are needed..."
              rows={3}
              maxLength={500}
              className={errors.reason ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.reason && (
                <p className="text-red-500 text-xs">{errors.reason}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.reason.length}/500
              </p>
            </div>
          </div>

          <div>
            <Label>Part Photo (Optional)</Label>
            <div className="mt-2">
              {formData.photo_url ? (
                <div className="relative">
                  <img 
                    src={formData.photo_url} 
                    alt="Part" 
                    className="w-full h-32 object-cover rounded-lg border" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleInputChange('photo_url', '')}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload a photo of the part</p>
                  <ImageUpload onImageUpload={handleImageUpload} accept="image/*" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExtraPartsRequest;