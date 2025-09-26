import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Shield, BarChart3, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { adminAnalyticsService } from '@/lib/services/adminAnalyticsService';
import BusinessAnalyticsChart from '@/components/admin/BusinessAnalyticsChart';

const AdminDashboard = () => {
  const { user, userProfile, loading } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalCashFlow: 0,
    platformFee: 0,
    monthlyStats: []
  });
  const [contractorForm, setContractorForm] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    serviceType: '',
    contractorType: '',
    companyName: '',
    bio: '',
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Redirect if not admin
  if (!loading && (!user || userProfile?.account_type !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (user && userProfile?.account_type === 'admin') {
      fetchContractors();
      fetchAnalytics();
    }
  }, [user, userProfile]);

  const fetchContractors = async () => {
    try {
      const result = await adminAnalyticsService.getContractorStats();
      if (result.success) {
        setContractors(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching contractors:', error);
      toast.error('Failed to fetch contractors');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const result = await adminAnalyticsService.getBusinessAnalytics();
      if (result.success) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateContractor = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-contractor', {
        body: {
          email: contractorForm.email,
          password: contractorForm.password,
          fullName: contractorForm.fullName,
          phoneNumber: contractorForm.phoneNumber,
          serviceType: contractorForm.serviceType,
          contractorType: contractorForm.contractorType,
          companyName: contractorForm.companyName || null,
          bio: contractorForm.bio || null
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Contractor account created successfully with login credentials!');
        setContractorForm({
          email: '',
          fullName: '',
          phoneNumber: '',
          serviceType: '',
          contractorType: '',
          companyName: '',
          bio: '',
          password: ''
        });
        fetchContractors();
        fetchAnalytics();
      } else {
        throw new Error(data.error || 'Failed to create contractor account');
      }
    } catch (error) {
      console.error('Error creating contractor:', error);
      toast.error(error.message || 'Failed to create contractor account');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage contractors and monitor business analytics</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contractors
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Contractor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Key Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsLoading ? '...' : analytics.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">All time bookings</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cash Flow</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${analyticsLoading ? '...' : analytics.totalCashFlow.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">From paid bookings</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Fee Earned</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${analyticsLoading ? '...' : analytics.platformFee.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">5% of cash flow</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {!analyticsLoading && analytics.monthlyStats.length > 0 && (
                <BusinessAnalyticsChart monthlyStats={analytics.monthlyStats} />
              )}
              
              {analyticsLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading analytics...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!analyticsLoading && analytics.monthlyStats.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No booking data available yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <CardTitle>Registered Contractors</CardTitle>
                <CardDescription>
                  View and manage all contractor accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractors.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No contractors registered yet</p>
                  ) : (
                    <div className="grid gap-4">
                      {contractors.map((contractor) => (
                        <div key={contractor.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div>
                                <h3 className="font-semibold text-lg">{contractor.full_name}</h3>
                                <p className="text-sm text-gray-600">{contractor.email}</p>
                                <p className="text-sm text-gray-600">{contractor.phone_number}</p>
                              </div>
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {contractor.service_type}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {contractor.contractor_type === 'tacklers_choice' ? "Tackler's Choice" : 'Saver'}
                                </span>
                                {contractor.is_verified && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                    Verified
                                  </span>
                                )}
                                {contractor.is_available && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 text-right space-y-1">
                              <p><strong>Rating:</strong> {contractor.rating}/5 ({contractor.total_reviews || 0} reviews)</p>
                              <p><strong>Jobs Completed:</strong> {contractor.total_jobs_completed}</p>
                              <p><strong>Total Earnings:</strong> ${(contractor.earnings_total || 0).toFixed(2)}</p>
                              <p className="text-xs">Joined: {new Date(contractor.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Contractor Account</CardTitle>
                <CardDescription>
                  Create a new contractor account with login credentials. The contractor can log in immediately using the provided email and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateContractor} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contractorForm.email}
                        onChange={(e) => setContractorForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="contractor@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={contractorForm.fullName}
                        onChange={(e) => setContractorForm(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={contractorForm.phoneNumber}
                        onChange={(e) => setContractorForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        required
                        placeholder="+65 8123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={contractorForm.password}
                        onChange={(e) => setContractorForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="Enter secure password"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select
                      value={contractorForm.serviceType}
                      onValueChange={(value) => setContractorForm(prev => ({ ...prev, serviceType: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aircon">Aircon</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractorType">Contractor Type</Label>
                    <Select
                      value={contractorForm.contractorType}
                      onValueChange={(value) => setContractorForm(prev => ({ ...prev, contractorType: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contractor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tacklers_choice">Tackler's Choice</SelectItem>
                        <SelectItem value="saver">Saver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name (Optional)</Label>
                    <Input
                      id="companyName"
                      value={contractorForm.companyName}
                      onChange={(e) => setContractorForm(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="ABC Services Pte Ltd"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      value={contractorForm.bio}
                      onChange={(e) => setContractorForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Brief description of services and experience..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? 'Creating Account...' : 'Create Contractor Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;