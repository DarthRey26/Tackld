import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SimpleAddressForm = ({ formData, setFormData, errors }) => {
  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Street Address *</label>
          <Input
            value={formData.address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="123 Main Street"
            className={errors.street ? 'border-red-500' : ''}
          />
          {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Unit/Apt Number</label>
          <Input
            value={formData.address.unit}
            onChange={(e) => handleAddressChange('unit', e.target.value)}
            placeholder="Unit #12-34"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Postal Code *</label>
          <Input
            value={formData.address.postalCode}
            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            placeholder="123456"
            maxLength={6}
            className={errors.postalCode ? 'border-red-500' : ''}
          />
          {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Type *</label>
          <select
            value={formData.address.type || 'HDB'}
            onChange={(e) => handleAddressChange('type', e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="HDB">HDB</option>
            <option value="Condo">Condo</option>
            <option value="Landed">Landed Property</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Access Instructions (Optional)</label>
        <Textarea
          value={formData.address.instructions}
          onChange={(e) => handleAddressChange('instructions', e.target.value)}
          placeholder="Gate code, parking instructions, etc."
          rows={3}
          maxLength={300}
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.address.instructions?.length || 0}/300 characters
        </div>
      </div>
    </div>
  );
};

export default SimpleAddressForm;