import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  FileText, 
  TrendingUp,
  DollarSign 
} from 'lucide-react';

const ContractorStats = ({ stats, profile }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Jobs Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completedJobs || 0}</div>
          <p className="text-xs text-muted-foreground">
            Successfully finished jobs
          </p>
        </CardContent>
      </Card>

      {/* Jobs Forfeited */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs Forfeited</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{stats.forfeitedJobs || 0}</div>
          <p className="text-xs text-muted-foreground">
            Jobs cancelled after acceptance
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.successRate || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Job completion rate
          </p>
        </CardContent>
      </Card>

      {/* Total Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${(stats.earningsTotal || 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Lifetime earnings
          </p>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{(stats.rating || 5.0).toFixed(1)}</div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (stats.rating || 5.0)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalReviews || 0} review{(stats.totalReviews || 0) !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Service Type */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Specialization</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {profile?.service_type || 'General'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold capitalize">
            {profile?.service_type || 'General'} Contractor
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {profile?.contractor_type || 'Standard'}
            </Badge>
            <Badge 
              variant={profile?.is_available ? "default" : "secondary"}
              className={profile?.is_available ? "bg-green-600" : ""}
            >
              {profile?.is_available ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractorStats;