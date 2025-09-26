import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';

const ContractorBidRestrictions = ({ job, hasBid, bidStatus }) => {
  // Don't show sensitive customer information until bid is accepted
  const showCustomerDetails = bidStatus === 'accepted';
  const showCustomerPhotos = bidStatus === 'accepted';

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Shield className="w-5 h-5" />
          Bidding Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-700">
            <p className="font-medium mb-1">Privacy Protection Active</p>
            <p>Customer contact details and photos are protected until your bid is accepted.</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-600" />
            <span className="text-green-700">You can see: Job requirements, location area, schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-red-600" />
            <span className="text-red-700">Protected: Customer name, phone, exact address, photos</span>
          </div>
        </div>

        {hasBid && (
          <div className="pt-2 border-t border-orange-200">
            <Badge 
              variant={bidStatus === 'accepted' ? 'default' : 'secondary'}
              className="text-xs"
            >
              Your bid status: {bidStatus || 'pending'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractorBidRestrictions;