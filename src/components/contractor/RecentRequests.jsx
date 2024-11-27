import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

const RecentRequests = ({ requests, onUpdateProgress }) => {
  return (
    <Card>
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl font-bold text-blue-600">Recent Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="space-y-2 border-b pb-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{request.service}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{request.date}</span>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    request.status === "Completed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {request.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{request.progress}%</span>
                </div>
                <Slider
                  value={[request.progress]}
                  onValueChange={(value) => onUpdateProgress(request.id, value[0])}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecentRequests;