import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useContractorRealtime } from '@/hooks/useContractorRealtime';
import ContractorStageManager from './ContractorStageManager';
import BidSubmissionForm from '../unified/BidSubmissionForm';
import { Clock, CheckCircle, DollarSign, Star, MapPin, Calendar } from 'lucide-react';

const ContractorJobDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  
  const { 
    activeJob, 
    dashboardData, 
    loading, 
    error, 
    updateJobStatus, 
    completeJob,
    refreshData 
  } = useContractorRealtime();

  const handleStageUpdate = (newStage, updateData) => {
    updateJobStatus(newStage, updateData);
    refreshData();
  };

  const handleBidSubmitted = () => {
    // Refresh data when a new bid is submitted
    refreshData();
    setActiveTab('bids'); // Switch to bids tab to show the submitted bid
  };

  const renderJobCard = (job, showBidButton = false) => (
    <Card key={job.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg capitalize">{job.service_type} Service</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{job.customer_name}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant="secondary">
            ${job.price_range_min} - ${job.price_range_max}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {job.description && (
            <p className="text-sm text-gray-700">{job.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Address:</strong> {job.address?.formatted || 'Address provided'}
            </div>
            <div>
              <strong>Urgency:</strong> 
              <Badge variant={job.urgency === 'urgent' ? 'destructive' : 'secondary'} className="ml-1 text-xs">
                {job.urgency || 'Normal'}
              </Badge>
            </div>
          </div>

          {job.service_answers && Object.keys(job.service_answers).length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Service Details:</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(job.service_answers).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key.replace('_', ' ')}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showBidButton && !job.has_bid && (
            <BidSubmissionForm 
              booking={job}
              onBidSubmitted={handleBidSubmitted}
            />
          )}

          {job.has_bid && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Bid Submitted</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  ${job.bid_amount}
                </Badge>
              </div>
              {job.bid_expires_at && (
                <p className="text-xs text-blue-600 mt-1">
                  Expires: {new Date(job.bid_expires_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderBidCard = (bid) => (
    <Card key={bid.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg capitalize">{bid.booking.service_type} Service</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Customer: {bid.booking.customer_name}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={bid.status === 'accepted' ? 'default' : 'secondary'}>
              {bid.status}
            </Badge>
            <p className="text-lg font-bold mt-1">${bid.amount}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>ETA:</strong> {bid.eta_minutes} minutes
            </div>
            <div>
              <strong>Expires:</strong> {new Date(bid.expires_at).toLocaleString()}
            </div>
          </div>
          
          {bid.note && (
            <div>
              <strong>Your Note:</strong> {bid.note}
            </div>
          )}

          {bid.status === 'accepted' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">🎉 Bid Accepted! You can now manage this job.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  const availableJobs = dashboardData?.available_jobs || [];
  const contractorBids = dashboardData?.contractor_bids || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Contractor Dashboard</h1>
      
      {/* Active Job Section */}
      {activeJob && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Active Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractorStageManager 
              booking={activeJob}
              onStageUpdate={handleStageUpdate}
            />
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            Available Jobs ({availableJobs.length})
          </TabsTrigger>
          <TabsTrigger value="bids">
            My Bids ({contractorBids.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">No available jobs in your service area</p>
              </CardContent>
            </Card>
          ) : (
            availableJobs.map(job => renderJobCard(job, true))
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4">
          {contractorBids.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">You haven't submitted any bids yet</p>
              </CardContent>
            </Card>
          ) : (
            contractorBids.map(renderBidCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractorJobDashboard;