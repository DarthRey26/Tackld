import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/services';
import ReviewList from '@/components/ReviewList';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  Star,
  Briefcase,
  DollarSign,
  MapPin,
  Award,
  Clock,
  MessageSquare
} from 'lucide-react';

const Account = () => {
  const { user, userType } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    bio: '',
    serviceType: '',
    contractorType: '',
    years_experience: 0,
    hourly_rate: 0,
    service_area: []
  });

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: profileData, error } = await profileService.getUserProfile(user.id);
      if (error) throw error;
      setProfile(profileData);
      setEditForm({
        full_name: profileData.profile?.full_name || '',
        phone_number: profileData.profile?.phone_number || '',
        bio: profileData.profile?.bio || '',
        serviceType: profileData.profile?.serviceType || '',
        contractorType: profileData.profile?.contractorType || '',
        years_experience: profileData.profile?.years_experience || 0,
        hourly_rate: profileData.profile?.hourly_rate || 0,
        service_area: profileData.profile?.service_area || []
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.message === 'User profile not found') {
        // Create a default profile
        try {
          const defaultProfile = {
            user_id: user.id,
            email: user.email,
            role: userType,
            full_name: user.email.split('@')[0],
            created_at: new Date().toISOString()
          };
          
          if (userType === 'contractor') {
            defaultProfile.serviceType = 'aircon';
            defaultProfile.contractorType = 'saver';
            defaultProfile.years_experience = 1;
            defaultProfile.hourly_rate = 25;
          }
          
          const { data, error } = await profileService.updateProfile(user.id, defaultProfile);
          if (error) throw error;
          toast.success('Profile created successfully');
          await loadUserData();
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          toast.error('Failed to create profile');
        }
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await profileService.updateProfile(user.id, editForm);
      if (error) throw error;
      await loadUserData();
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      bio: profile?.bio || '',
      serviceType: profile?.serviceType || '',
      contractorType: profile?.contractorType || '',
      years_experience: profile?.years_experience || 0,
      hourly_rate: profile?.hourly_rate || 0,
      service_area: profile?.service_area || []
    });
    setEditing(false);
  };

  const calculateCompletionPercentage = () => {
    if (!profile) return 0;
    let completed = 0;
    let total = userType === 'contractor' ? 6 : 4;
    
    if (profile.full_name && profile.full_name.trim()) completed++;
    if (profile.phone_number && profile.phone_number.trim()) completed++;
    if (user?.email) completed++;
    
    if (userType === 'contractor') {
      if (profile.bio && profile.bio.trim()) completed++;
      if (profile.serviceType) completed++;
      if (profile.years_experience > 0) completed++;
    } else {
      if (profile.bio && profile.bio.trim()) completed++;
    }
    
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-4xl mx-auto p-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
          </div>
          <Badge variant={userType === 'contractor' ? 'default' : 'secondary'} className="capitalize">
            {userType}
          </Badge>
        </div>

        {/* Profile Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to get the best experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {completionPercentage}% Complete
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="professional">
              {userType === 'contractor' ? 'Professional' : 'Account'}
            </TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Your basic contact information</CardDescription>
                  </div>
                  {!editing ? (
                    <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm" disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      {editing ? (
                        <Input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <Input 
                          value={profile?.full_name || 'Not provided'} 
                          disabled 
                          className="bg-muted/50"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input value={user?.email || ''} disabled className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      {editing ? (
                        <Input
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <Input 
                          value={profile?.phone_number || 'Not provided'} 
                          disabled 
                          className="bg-muted/50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {userType === 'contractor' && (
                      <div className="space-y-2">
                        <Label>About Me</Label>
                        {editing ? (
                          <Textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell clients about your experience and expertise..."
                            rows={4}
                          />
                        ) : (
                          <Textarea 
                            value={profile?.bio || 'No bio provided'} 
                            disabled 
                            className="bg-muted/50"
                            rows={4}
                          />
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Member Since
                      </Label>
                      <Input 
                        value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'} 
                        disabled 
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional/Account Tab */}
          <TabsContent value="professional" className="space-y-6">
            {userType === 'contractor' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                  <CardDescription>Your service details and expertise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Service Type
                        </Label>
                        {editing ? (
                          <select
                            value={editForm.serviceType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, serviceType: e.target.value }))}
                            className="w-full p-2 border border-input rounded-md"
                          >
                            <option value="">Select service type</option>
                            <option value="aircon">Air Conditioning</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="painting">Painting</option>
                          </select>
                        ) : (
                          <Input 
                            value={profile?.serviceType ? profile.serviceType.charAt(0).toUpperCase() + profile.serviceType.slice(1) : 'Not specified'} 
                            disabled 
                            className="bg-muted/50"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Contractor Type</Label>
                        {editing ? (
                          <select
                            value={editForm.contractorType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, contractorType: e.target.value }))}
                            className="w-full p-2 border border-input rounded-md"
                          >
                            <option value="">Select contractor type</option>
                            <option value="saver">Saver Bidder</option>
                            <option value="tacklerChoice">Tackler's Choice</option>
                          </select>
                        ) : (
                          <Input 
                            value={profile?.contractorType === 'tacklerChoice' ? "Tackler's Choice" : profile?.contractorType || 'Not specified'} 
                            disabled 
                            className="bg-muted/50"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Years of Experience
                        </Label>
                        {editing ? (
                          <Input
                            type="number"
                            value={editForm.years_experience}
                            onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                            placeholder="Years of experience"
                            min="0"
                          />
                        ) : (
                          <Input 
                            value={`${profile?.years_experience || 0} years`} 
                            disabled 
                            className="bg-muted/50"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Hourly Rate (SGD)
                        </Label>
                        {editing ? (
                          <Input
                            type="number"
                            value={editForm.hourly_rate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                            placeholder="Hourly rate"
                            min="0"
                          />
                        ) : (
                          <Input 
                            value={`$${profile?.hourly_rate || 0}/hour`} 
                            disabled 
                            className="bg-muted/50"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Verification Status
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={profile?.is_verified ? 'default' : 'secondary'}>
                            {profile?.is_verified ? 'Verified' : 'Not Verified'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={profile?.is_available ? 'default' : 'secondary'}>
                            {profile?.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile?.rating?.toFixed(1) || '0.0'}
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile?.total_jobs || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {profile?.total_jobs_completed || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile?.success_rate || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Summary
                  </CardTitle>
                  <CardDescription>Your Tackld account overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile?.total_bookings || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {profile?.rating?.toFixed(1) || '5.0'}
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <ReviewList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;