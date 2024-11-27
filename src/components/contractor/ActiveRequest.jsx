import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from 'lucide-react';

const ActiveRequest = ({ request, onUpdateProgress }) => {
  const progressSteps = [0, 25, 50, 75, 100];

  return (
    <Card className="bg-blue-50 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-blue-600">Active Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{request.service}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{request.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Started: {new Date(request.submittedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{request.progress}%</span>
          </div>
          <Progress value={request.progress} className="w-full" />
          <div className="flex justify-between gap-2 mt-4">
            {progressSteps.map((step) => (
              <Button
                key={step}
                onClick={() => onUpdateProgress(request.id, step)}
                variant={request.progress >= step ? "default" : "outline"}
                size="sm"
              >
                {step}%
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveRequest;