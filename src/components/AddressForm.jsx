import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Star, Trash2, MapPin } from "lucide-react";
import api from "@/lib/api";

const AddressForm = ({ onAddressSelect, selectedAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    line1: '',
    line2: '',
    city: 'Singapore',
    postal_code: '',
    building_name: '',
    unit_number: '',
    floor_number: '',
    access_instructions: '',
    contact_person: { name: '', phone: '' }
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await api.addresses.getAll();
      setAddresses(response.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast({
        title: "Error",
        description: "Failed to load saved addresses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateAddress = () => {
    const newErrors = {};
    
    if (!newAddress.label.trim()) {
      newErrors.label = 'Address label is required';
    }
    
    if (!newAddress.line1.trim()) {
      newErrors.line1 = 'Address line 1 is required';
    }
    
    if (!newAddress.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    } else if (!/^\d{6}$/.test(newAddress.postal_code)) {
      newErrors.postal_code = 'Invalid Singapore postal code (6 digits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    
    if (!validateAddress()) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.addresses.create({
        ...newAddress,
        is_primary: addresses.length === 0 // First address is primary
      });
      
      const createdAddress = response.address;
      setAddresses(prev => [createdAddress, ...prev]);
      setNewAddress({
        label: '',
        line1: '',
        line2: '',
        city: 'Singapore',
        postal_code: '',
        building_name: '',
        unit_number: '',
        floor_number: '',
        access_instructions: '',
        contact_person: { name: '', phone: '' }
      });
      setShowAddForm(false);
      
      toast({
        title: "Address Added",
        description: "Your address has been saved successfully",
        variant: "default"
      });
      
      // Auto-select the new address
      onAddressSelect(createdAddress);
      
    } catch (error) {
      console.error('Failed to create address:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await api.addresses.delete(addressId);
      setAddresses(prev => prev.filter(addr => addr._id !== addressId));
      
      toast({
        title: "Address Deleted",
        description: "Address has been removed",
        variant: "default"
      });
      
      // If deleted address was selected, clear selection
      if (selectedAddress?._id === addressId) {
        onAddressSelect(null);
      }
      
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.addresses.setDefault(addressId);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_primary: addr._id === addressId
      })));
      
      toast({
        title: "Default Updated",
        description: "Default address has been updated",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to set default:', error);
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading addresses...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Saved Addresses */}
      {addresses.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Select a saved address</h3>
          <div className="space-y-2">
            {addresses.map((address) => (
              <Card
                key={address._id}
                className={`cursor-pointer transition-all ${
                  selectedAddress?._id === address._id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onAddressSelect(address)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{address.label}</h4>
                        {address.is_primary && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {[
                          address.line1,
                          address.line2,
                          address.building_name,
                          address.unit_number && `#${address.unit_number}`,
                          address.city,
                          address.postal_code
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!address.is_primary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(address._id);
                          }}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Address Button */}
      {!showAddForm && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      )}

      {/* Add New Address Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Add New Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAddress} className="space-y-4">
              {/* Address Label */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Label *
                </label>
                <Input
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Home, Office, Mom's Place"
                  className={errors.label ? 'border-red-500' : ''}
                />
                {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address Line 1 *
                </label>
                <Input
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, line1: e.target.value }))}
                  placeholder="Street address, building number"
                  className={errors.line1 ? 'border-red-500' : ''}
                />
                {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
              </div>

              {/* Building Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Building Name
                  </label>
                  <Input
                    value={newAddress.building_name}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, building_name: e.target.value }))}
                    placeholder="Building name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Floor
                  </label>
                  <Input
                    value={newAddress.floor_number}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, floor_number: e.target.value }))}
                    placeholder="Floor number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Unit Number
                  </label>
                  <Input
                    value={newAddress.unit_number}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, unit_number: e.target.value }))}
                    placeholder="Unit/Apt number"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Postal Code *
                </label>
                <Input
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="6-digit postal code"
                  maxLength={6}
                  className={errors.postal_code ? 'border-red-500' : ''}
                />
                {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
              </div>

              {/* Access Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Instructions (Optional)
                </label>
                <Input
                  value={newAddress.access_instructions}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, access_instructions: e.target.value }))}
                  placeholder="Gate code, special instructions, etc."
                  maxLength={500}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressForm;