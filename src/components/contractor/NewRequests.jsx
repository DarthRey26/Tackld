import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Eye } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const NewRequests = ({ requests, onAccept, onViewDetails }) => {
  const { toast } = useToast();

  const handleAccept = (request) => {
    onAccept(request);
    toast({
      title: "Request Accepted",
      description: `You've accepted the request at ${request.name}`,
    });
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl font-bold text-blue-600">New Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className={`p-4 hover:shadow-md transition-shadow ${
                request.status === 'submitted' ? 'border-2 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {request.service_id?.name || request.serviceType || 'Service Request'}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{request.bookingType || 'Standard'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {request.preferred_start ? 
                          new Date(request.preferred_start).toLocaleDateString('en-SG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'ASAP'
                        }
                      </span>
                    </div>
                  </div>

                  {request.customer_notes && (
                    <div className="bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium">Issue:</span> {request.customer_notes}
                    </div>
                  )}

                  {request.images && request.images.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-sm font-medium">Images:</span>
                      <div className="flex gap-1">
                        {request.images.slice(0, 3).map((image, idx) => (
                          <div key={idx} className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
                            {idx + 1}
                          </div>
                        ))}
                        {request.images.length > 3 && (
                          <span className="text-xs text-gray-500">+{request.images.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address provided after acceptance
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(request)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                  <Button 
                    onClick={() => handleAccept(request)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewRequests;