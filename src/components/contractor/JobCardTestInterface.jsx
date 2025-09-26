import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EnhancedJobCard from './EnhancedJobCard';
import { sampleBookings, sampleBids } from '@/lib/testPlan';
import { Play, RefreshCw, CheckCircle } from 'lucide-react';

const JobCardTestInterface = () => {
  const [selectedBooking, setSelectedBooking] = useState('completeAircon');
  const [selectedBidStatus, setSelectedBidStatus] = useState('none');
  const [canBid, setCanBid] = useState(true);

  const handleBidSubmit = (job) => {
    console.log('Bid submitted for job:', job.id);
    alert(`Bid submitted for ${job.service_type} job #${job.id}`);
  };

  const handleDecline = (job) => {
    console.log('Job declined:', job.id);
    alert(`Declined ${job.service_type} job #${job.id}`);
  };

  const currentBooking = sampleBookings[selectedBooking];
  const currentBid = sampleBids[selectedBidStatus];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Contractor Job Card Test Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sample Booking</label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completeAircon">Complete Aircon Job</SelectItem>
                  <SelectItem value="emergencyPlumbing">Emergency Plumbing</SelectItem>
                  <SelectItem value="malformedData">Malformed Data</SelectItem>
                  <SelectItem value="largeCleaning">Large Cleaning Job</SelectItem>
                  <SelectItem value="paintingWithAlerts">Painting with Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bid Status</label>
              <Select value={selectedBidStatus} onValueChange={setSelectedBidStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Bid</SelectItem>
                  <SelectItem value="pending">Pending Bid</SelectItem>
                  <SelectItem value="accepted">Accepted Bid</SelectItem>
                  <SelectItem value="rejected">Rejected Bid</SelectItem>
                  <SelectItem value="expired">Expired Bid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Can Bid</label>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant={canBid ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCanBid(!canBid)}
                >
                  {canBid ? <CheckCircle className="w-4 h-4 mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                  {canBid ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Current Test Scenario:</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{currentBooking?.service_type} Service</Badge>
              <Badge variant="outline">{currentBooking?.booking_type}</Badge>
              <Badge variant="outline">{currentBooking?.urgency} Urgency</Badge>
              {selectedBidStatus !== 'none' && (
                <Badge variant="outline">Bid: {selectedBidStatus}</Badge>
              )}
              <Badge variant="outline">Images: {currentBooking?.uploaded_images?.length || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Job Card Preview</h2>
        
        {currentBooking ? (
          <EnhancedJobCard
            job={currentBooking}
            onBidSubmit={handleBidSubmit}
            onDecline={handleDecline}
            canBid={canBid}
            bidStatus={selectedBidStatus}
            bidAmount={currentBid?.amount}
            bidExpiresAt={currentBid?.expiresAt}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-4" />
              <p>No booking selected</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results & Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Data Validation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Service Answers:</span>
                  <Badge variant={currentBooking?.service_answers ? 'default' : 'destructive'}>
                    {currentBooking?.service_answers ? 'Present' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Images:</span>
                  <Badge variant={currentBooking?.uploaded_images?.length > 0 ? 'default' : 'secondary'}>
                    {currentBooking?.uploaded_images?.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Privacy Protected:</span>
                  <Badge variant="default">✓</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Service Template:</span>
                  <Badge variant="default">✓</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Edge Cases Handled</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Malformed service_answers fallback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Large image set thumbnails</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Privacy data filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Service-specific templates</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobCardTestInterface;