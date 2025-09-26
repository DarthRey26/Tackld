import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, Calculator, Plus, Minus, DollarSign, Clock, Shield } from "lucide-react";
import { bidService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { showToastForRpcError } from '@/utils/rpcErrorHandler';

const BidSubmissionForm = ({ 
  booking, 
  onBidSubmitted, 
  onCancel, 
  isSubmitting = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bidData, setBidData] = useState({
    amount: '',
    eta: '60',
    warranty: '30',
    note: '',
    materials: []
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load saved draft on mount with cross-tab sync
  useEffect(() => {
    if (booking?.id) {
      const loadDraft = () => {
        const draft = localStorage.getItem(`bid_draft_${booking.id}`);
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            setBidData(prev => ({ ...prev, ...parsedDraft }));
          } catch (error) {
            console.error('Error loading bid draft:', error);
          }
        }
      };

      loadDraft();

      // Cross-tab synchronization
      const handleStorageChange = (e) => {
        if (e.key === `bid_draft_${booking.id}` && e.newValue) {
          try {
            const parsedDraft = JSON.parse(e.newValue);
            setBidData(prev => ({ ...prev, ...parsedDraft }));
          } catch (error) {
            console.error('Error syncing draft across tabs:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [booking?.id]);

  // Save draft on data change with debouncing
  useEffect(() => {
    if (booking?.id && bidData.amount) {
      const debounceTimer = setTimeout(() => {
        localStorage.setItem(`bid_draft_${booking.id}`, JSON.stringify(bidData));
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimer);
    }
  }, [bidData, booking?.id]);

  const validateBid = () => {
    const newErrors = {};
    
    if (!bidData.amount || parseFloat(bidData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!bidData.eta || parseInt(bidData.eta) < 15) {
      newErrors.eta = 'ETA must be at least 15 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔥 BID SUBMISSION START');
    console.log('📊 Form Data:', bidData);
    console.log('👤 User:', user);
    console.log('📋 Booking:', booking);
    
    // Prevent multiple submissions
    if (isLoading) {
      console.log('⚠️ Already submitting, ignoring...');
      return;
    }
    
    if (!validateBid()) {
      console.log('❌ VALIDATION FAILED:', errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ VALIDATION PASSED');
    setIsLoading(true);
    
    try {
      const bidSubmission = {
        booking_id: booking.id,
        contractor_id: user.id,
        amount: parseFloat(bidData.amount),
        eta_minutes: parseInt(bidData.eta),
        note: bidData.note,
        included_materials: bidData.materials || [],
        terms: {
          warranty_days: parseInt(bidData.warranty) || 30,
          payment_terms: 'upon_completion'
        }
      };

      console.log('🚀 SUBMITTING BID:', bidSubmission);
      const { data: submittedBid, error } = await bidService.submitBid(bidSubmission);
      
      if (error) {
        console.error('❌ BID SERVICE ERROR:', error);
        throw error;
      }
      
      console.log('✅ BID SUBMITTED SUCCESSFULLY:', submittedBid);
      
      // Clear draft on successful submission
      localStorage.removeItem(`bid_draft_${booking.id}`);
      
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully!",
      });
      
      onBidSubmitted(submittedBid);
    } catch (error) {
      console.error('Bid submission error:', error);
      
      // Handle specific duplicate bid error
      let errorMessage = error.message || "Failed to submit bid";
      let errorTitle = "Submission Failed";
      
      if (error.message && (
        error.message.includes('already submitted a bid') ||
        error.message.includes('You have already submitted a bid for this booking') ||
        error.message.includes('duplicate key value')
      )) {
        errorTitle = "Bid Already Submitted";
        errorMessage = "You have already submitted a bid for this booking. Please check your bids list or wait for the customer's response.";
      } else if (error.code === '23505') {
        errorTitle = "Duplicate Bid";
        errorMessage = "You have already submitted a bid for this booking. Please refresh the page and check your bids.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMaterial = () => {
    setBidData(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', cost: '' }]
    }));
  };

  const updateMaterial = (index, field, value) => {
    setBidData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeMaterial = (index) => {
    setBidData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // Memoized calculation to prevent unnecessary re-renders
  const calculateTotal = React.useMemo(() => {
    const baseAmount = parseFloat(bidData.amount) || 0;
    const materialsCost = bidData.materials.reduce((total, material) => {
      return total + (parseFloat(material.cost) || 0);
    }, 0);
    return baseAmount + materialsCost;
  }, [bidData.amount, bidData.materials]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Submit Your Bid
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Service: {booking?.serviceType}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {booking?.urgency === 'urgent' ? 'ASAP' : 'Scheduled'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Service Price ($) *
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={bidData.amount}
              onChange={(e) => setBidData(prev => ({ ...prev, amount: e.target.value }))}
              className={errors.amount ? 'border-red-500' : ''}
              placeholder="Enter your service price"
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* ETA */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Estimated Arrival Time (minutes) *
            </label>
            <select
              value={bidData.eta}
              onChange={(e) => setBidData(prev => ({ ...prev, eta: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md ${errors.eta ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
              <option value="480">Today</option>
            </select>
            {errors.eta && (
              <p className="text-red-500 text-xs mt-1">{errors.eta}</p>
            )}
          </div>

          {/* Warranty */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Warranty Period (days)
            </label>
            <select
              value={bidData.warranty}
              onChange={(e) => setBidData(prev => ({ ...prev, warranty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="0">No warranty</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          {/* Additional Materials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Additional Materials</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Material
              </Button>
            </div>
            
            {bidData.materials.map((material, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Material name"
                  value={material.name}
                  onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Cost"
                  value={material.cost}
                  onChange={(e) => updateMaterial(index, 'cost', e.target.value)}
                  className="w-24"
                  min="0"
                  step="0.01"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMaterial(index)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <Textarea
              value={bidData.note}
              onChange={(e) => setBidData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Any additional information about your service..."
              rows={3}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {bidData.note.length}/1000 characters
            </div>
          </div>

          {/* Bid Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Bid Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Service Cost:</span>
                <span>${parseFloat(bidData.amount || 0).toFixed(2)}</span>
              </div>
              {bidData.materials.map((material, index) => (
                material.name && material.cost && (
                  <div key={index} className="flex justify-between">
                    <span>{material.name}:</span>
                    <span>${parseFloat(material.cost).toFixed(2)}</span>
                  </div>
                )
              ))}
              <div className="border-t pt-1 font-medium flex justify-between">
                <span>Total:</span>
                <span>${calculateTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || isSubmitting}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Bid
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BidSubmissionForm;