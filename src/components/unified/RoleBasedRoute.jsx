import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiredUserType = null,
  requiredServiceType = null,
  fallbackPath = '/login',
  showUnauthorized = true 
}) => {
  const { user, userProfile, userType, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check user type requirement
  if (requiredUserType && userType !== requiredUserType) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-center text-muted-foreground">
                This page is only accessible to {requiredUserType}s.
              </p>
              <p className="text-center text-sm mt-2">
                Current role: {userType || 'Unknown'}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Redirect based on user type
    const redirectPath = userType === 'customer' 
      ? '/customer-dashboard' 
      : userType === 'contractor' 
        ? '/contractor-main' 
        : '/';
    
    return <Navigate to={redirectPath} replace />;
  }

  // Check role requirements
  if (allowedRoles.length > 0) {
    const userRole = userProfile?.role || userType;
    if (!allowedRoles.includes(userRole)) {
      if (showUnauthorized) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Insufficient Permissions</h2>
                <p className="text-center text-muted-foreground">
                  You don't have permission to access this page.
                </p>
                <p className="text-center text-sm mt-2">
                  Required roles: {allowedRoles.join(', ')}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Check service type requirement for contractors
  if (requiredServiceType && userType === 'contractor') {
    const contractorServiceType = userProfile?.serviceType;
    if (contractorServiceType !== requiredServiceType) {
      if (showUnauthorized) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Service Type Mismatch</h2>
                <p className="text-center text-muted-foreground">
                  This page is only for {requiredServiceType} contractors.
                </p>
                <p className="text-center text-sm mt-2">
                  Your service type: {contractorServiceType || 'Not specified'}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }
      
      return <Navigate to="/contractor-main" replace />;
    }
  }

  // All checks passed, render the protected content
  return children;
};

// Helper component for admin-only routes
export const AdminRoute = ({ children }) => (
  <RoleBasedRoute allowedRoles={['admin']} fallbackPath="/login">
    {children}
  </RoleBasedRoute>
);

// Helper component for customer-only routes
export const CustomerRoute = ({ children }) => (
  <RoleBasedRoute requiredUserType="customer" fallbackPath="/login">
    {children}
  </RoleBasedRoute>
);

// Helper component for contractor-only routes
export const ContractorRoute = ({ children, serviceType = null }) => (
  <RoleBasedRoute 
    requiredUserType="contractor" 
    requiredServiceType={serviceType}
    fallbackPath="/login"
  >
    {children}
  </RoleBasedRoute>
);

// Helper component for service-specific contractor routes
export const ServiceContractorRoute = ({ children, serviceType }) => (
  <RoleBasedRoute 
    requiredUserType="contractor"
    requiredServiceType={serviceType}
    fallbackPath="/contractor-main"
  >
    {children}
  </RoleBasedRoute>
);

export default RoleBasedRoute;