import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, profileService } from '@/lib/services';
import { 
  DollarSign, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  XCircle,
  Calendar,
  Clock
} from 'lucide-react';

const ContractorEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    completedJobs: 0,
    forfeitedJobs: 0,
    averageJobValue: 0,
    successRate: 0,
    rating: 0,
    totalReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  }, [user]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      // Get contractor profile for earnings data
      const { data: profile } = await profileService.getUserProfile(user.id);
      
      // Get completed bookings for recent jobs
      const { data: completedBookings } = await bookingService.getContractorBookings(user.id, 'completed');
      
      // Calculate this month's earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthJobs = (completedBookings || []).filter(booking => {
        const bookingDate = new Date(booking.updated_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });

      const thisMonthEarnings = thisMonthJobs.reduce((sum, booking) => sum + (booking.final_price || 0), 0);
      const totalEarnings = (completedBookings || []).reduce((sum, booking) => sum + (booking.final_price || 0), 0);
      const averageJobValue = completedBookings?.length > 0 
        ? totalEarnings / completedBookings.length 
        : 0;

      setEarnings({
        totalEarnings,
        thisMonthEarnings,
        completedJobs: profile?.total_jobs_completed || 0,
        forfeitedJobs: profile?.jobs_forfeited || 0,
        averageJobValue,
        successRate: profile?.success_rate || 0,
        rating: profile?.rating || 5.0,
        totalReviews: profile?.total_reviews || 0
      });

      // Set recent jobs (last 5)
      setRecentJobs((completedBookings || []).slice(0, 5));

    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount);
  };

  const getJobStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      paid: { color: 'bg-blue-100 text-blue-800', text: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(earnings.totalEarnings)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(earnings.thisMonthEarnings)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {earnings.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-yellow-600">
                    {earnings.rating.toFixed(1)}
                  </p>
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-xs text-gray-500">({earnings.totalReviews} reviews)</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{earnings.completedJobs}</p>
            <p className="text-sm text-gray-600">Completed Jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{earnings.forfeitedJobs}</p>
            <p className="text-sm text-gray-600">Forfeited Jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(earnings.averageJobValue)}
            </p>
            <p className="text-sm text-gray-600">Average Job Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed jobs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium capitalize">{job.service_type}</h4>
                      {getJobStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-600">{job.customer_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.scheduled_time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(job.final_price || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorEarnings;