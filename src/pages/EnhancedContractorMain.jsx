import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, bidService, profileService, jobProgressService } from '@/lib/services';
import BidSubmissionFormModal from '@/components/unified/BidSubmissionFormModal';
import EnhancedContractorJobCard from '@/components/contractor/EnhancedContractorJobCard';
import ServiceSpecificJobCard from '@/components/contractor/ServiceSpecificJobCard';
import EnhancedJobProgressTracker from '@/components/contractor/EnhancedJobProgressTracker';
import ContractorStats from '@/components/contractor/ContractorStats';
import ContractorBids from '@/components/contractor/ContractorBids';
import EnhancedJobDetails from '@/components/contractor/EnhancedJobDetails';
import StageUpdateModal from '@/components/contractor/StageUpdateModal';
import { useContractorRealtime } from '@/hooks/useContractorRealtime';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Star, 
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Settings,
  Briefcase
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const EnhancedContractorMain = () => {
  const { toast } = useToast();
  const { user: authUser, userProfile, userType, loading } = useAuth();
  const [contractorProfile, setContractorProfile] = useState(null);
  const [showBidForm, setShowBidForm] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null);
  const [rejectedJobs, setRejectedJobs] = useState(new Set());
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showStageUpdate, setShowStageUpdate] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    forfeitedJobs: 0,
    totalBids: 0,
    acceptedJobs: 0,
    successRate: 0
  });

  // Use real-time contractor hook
  const { activeJob, dashboardData, loading: realtimeLoading, error: realtimeError, updateJobStatus, completeJob, refreshData } = useContractorRealtime();

  // Memoized contractor profile to prevent flashing
  const memoizedContractorProfile = useMemo(() => {
    if (!contractorProfile || !userProfile) return null;
    
    return {
      name: contractorProfile.full_name || userProfile.full_name || 'Contractor',
      rating: contractorProfile.rating || 5.0,
      jobs: contractorProfile.total_jobs_completed || 0,
      specialties: contractorProfile.service_type || userProfile.service_type,
      contact: contractorProfile.phone_number || userProfile.phone_number || 'N/A',
      email: contractorProfile.email || userProfile.email || 'N/A',
      company: contractorProfile.company_name || 'Independent Contractor',
      bio: contractorProfile.bio || 'Professional contractor'
    };
  }, [contractorProfile, userProfile]);

  // Get service and contractor type for filtering
  const serviceType = userProfile?.service_type || 'aircon';
  const contractorType = userProfile?.contractor_type || 'saver';
  
  // Derived state for backward compatibility
  const contractorBids = dashboardData.contractorBids || [];

  // Load contractor profile and stats
  useEffect(() => {
    if (!authUser || loading || userType !== 'contractor') return;

    const loadContractorProfile = async () => {
      try {
        // Load contractor profile from Supabase
        const { data: profile, error: profileError } = await profileService.getUserProfile(authUser.id);
        if (!profileError && profile) {
          setContractorProfile(profile);

          // Load contractor stats
          setStats({
            totalJobs: profile.total_jobs || 0,
            completedJobs: profile.total_jobs_completed || 0,
            forfeitedJobs: profile.total_jobs_forfeited || 0,
            successRate: profile.success_rate || 0,
            earningsTotal: profile.earnings_total || 0,
            rating: profile.rating || 5.0,
            totalReviews: profile.total_reviews || 0
          });
        }

        // Load rejected jobs from localStorage
        const rejectedJobIds = JSON.parse(localStorage.getItem('rejectedJobs') || '[]');
        setRejectedJobs(new Set(rejectedJobIds));

      } catch (error) {
        console.error('Error loading contractor profile:', error);
        toast({
          title: "Error",
          description: "Failed to load contractor profile",
          variant: "destructive",
        });
      }
    };

    loadContractorProfile();
  }, [authUser, userType, loading, toast]);

  const handleShowBidForm = (job) => {
    if (activeJob) {
      toast({
        title: "Cannot Bid on Job",
        description: "Please complete your current job before accepting a new one.",
        variant: "destructive",
      });
      return;
    }
    setShowBidForm(job);
  };

  const handleBidSubmitted = async (bid) => {
    if (!showBidForm) return;
    
    try {
      setShowBidForm(null);
      
      // For "Tackler's Choice" bookings, auto-accept the contractor
      if (showBidForm.bookingType === 'tacklers_choice') {
        const { data: acceptedBid, error } = await bidService.acceptBid(bid.id, showBidForm.customer_id);
        if (!error && acceptedBid) {
          setActiveJob(acceptedBid.booking);
        }
        
        toast({
          title: "Job Assigned!",
          description: "You've been assigned this Tackler's Choice job.",
        });
      } else {
        toast({
          title: 'Bid Submitted Successfully! ✅',
          description: `Your bid of $${bid.amount} has been submitted. The customer will review it within 30 minutes.`,
          variant: 'default',
        });
      }

      // Refresh dashboard data
      refreshData();

    } catch (error) {
      console.error('Error processing bid:', error);
      toast({
        title: "Error",
        description: "Failed to process bid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineJob = async (job) => {
    // Add to rejected jobs set to persist across refreshes
    setRejectedJobs(prev => new Set([...prev, job.id]));
    
    // Store rejection in localStorage for persistence
    const rejected = JSON.parse(localStorage.getItem('rejectedJobs') || '[]');
    rejected.push(job.id);
    localStorage.setItem('rejectedJobs', JSON.stringify(rejected));
    
    toast({
      title: "Job Declined",
      description: "Job removed from your available list permanently.",
    });

    // Refresh dashboard data to remove the declined job
    refreshData();
  };

  // Handle job stage updates
  const handleStageUpdate = async (newStage, updateData) => {
    try {
      if (activeJob) {
        // Update the active job with new stage
        setActiveJob(prev => ({
          ...prev,
          current_stage: newStage,
          status: newStage === 'awaiting_payment' ? 'completed' : prev.status
        }));
        
        // Refresh dashboard data
        refreshData();
      }
    } catch (error) {
      console.error('Error handling stage update:', error);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  const handleUpdateStage = () => {
    if (activeJob) {
      setShowStageUpdate(true);
    }
  };

  // Format scheduled date and time for display
  const formatScheduledDateTime = (date, time) => {
    if (!date) return 'Schedule TBD';
    
    try {
      // Handle both date string and ISO string formats
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const parsedDate = parseISO(dateStr);
      const formattedDate = format(parsedDate, 'dd MMM yyyy');
      
      if (time) {
        // Handle time format (e.g., "14:30:00" or "2:30 PM")
        const timeStr = time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
        return `${formattedDate}, ${timeStr}`;
      }
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date && time ? `${date} at ${time}` : date || 'Schedule TBD';
    }
  };

  if (loading || realtimeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!authUser || userType !== 'contractor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
          <p className="text-gray-600">You need contractor access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {memoizedContractorProfile?.name || authUser?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                Service Type: {serviceType?.charAt(0).toUpperCase() + serviceType?.slice(1)} | 
                Type: {contractorType === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
              </p>
              {memoizedContractorProfile?.contact && (
                <p className="text-sm text-gray-500 mt-1">
                  Contact: {memoizedContractorProfile.contact} | {memoizedContractorProfile.company}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Earnings</p>
                <p className="font-semibold">${stats.earningsTotal || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mt-1">Rating</p>
                <p className="font-semibold">{stats.rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <ContractorStats stats={stats} profile={contractorProfile} />

        {/* Active Job */}
        {activeJob && (
          <EnhancedJobProgressTracker 
            booking={activeJob}
            onStatusUpdate={(updatedJob) => {
              // Update is handled by real-time hook
              if (!updatedJob) {
                // Job was forfeited or completed
                refreshData();
              }
            }}
          />
        )}

        {/* Available Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={activeTab === 'jobs' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('jobs')}
                    className="px-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Available Jobs ({dashboardData.availableJobs.length})
                  </Button>
                  <Button
                    variant={activeTab === 'bids' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('bids')}
                    className="px-4"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    My Bids
                  </Button>
                </div>
              </div>
              {realtimeError && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Error Loading Jobs
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'jobs' ? (
              realtimeLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available jobs...</p>
                </div>
              ) : dashboardData.availableJobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs available at the moment</p>
                  <p className="text-sm text-gray-500 mt-1">
                    New jobs will appear here automatically when posted
                  </p>
                  <Button variant="outline" onClick={refreshData} className="mt-4">
                    Refresh Jobs
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData.availableJobs.map((job) => (
                    <ServiceSpecificJobCard
                      key={job.id}
                      job={job}
                      onBidSubmit={handleShowBidForm}
                      onDecline={handleDeclineJob}
                      canBid={!activeJob && !job.has_bid}
                      bidStatus={job.bid_status || 'none'}
                      bidAmount={job.bid_amount}
                      bidExpiresAt={job.bid_expires_at}
                    />
                  ))}
                </div>
              )
            ) : (
              <ContractorBids />
            )}
          </CardContent>
        </Card>

        {/* Image Modal */}
        {showImageModal && (
          <Dialog open={!!showImageModal} onOpenChange={() => setShowImageModal(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Job Images</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showImageModal.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Job image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Bid Submission Form */}
        <BidSubmissionFormModal
          isOpen={!!showBidForm}
          onClose={() => setShowBidForm(null)}
          booking={showBidForm}
          contractorId={authUser?.id}
          onBidSubmitted={handleBidSubmitted}
        />
      </div>
    </div>
  );
};

export default EnhancedContractorMain;