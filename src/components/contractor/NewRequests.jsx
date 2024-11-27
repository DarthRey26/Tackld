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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{request.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{request.hours}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Price Range: ${request.minPrice} - ${request.maxPrice}</span>
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