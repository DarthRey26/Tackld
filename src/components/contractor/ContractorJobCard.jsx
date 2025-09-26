import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, DollarSign, User, X, Check } from 'lucide-react';

const ContractorJobCard = ({ job, onAccept, onReject, disabled }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold capitalize">{job.serviceType} Service</h3>
            <Badge variant={job.bookingType === 'tacklers_choice' ? 'default' : 'secondary'}>
              {job.bookingType === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
            </Badge>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-600">${job.estimatedPrice}</p>
            <p className="text-xs text-gray-500">Estimated</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{job.address?.street}, Singapore {job.address?.postalCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{job.asap ? 'ASAP' : new Date(job.preferredDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Customer: {job.customerName || 'Anonymous'}</span>
          </div>
        </div>

        {job.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Notes:</strong> {job.notes}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => onAccept(job)}
            className="flex-1"
            disabled={disabled}
          >
            <Check className="w-4 h-4 mr-2" />
            {disabled ? 'Complete Current Job First' : 'Accept Job'}
          </Button>
          
          <Button 
            onClick={() => onReject(job)}
            variant="outline"
            className="px-3"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorJobCard;