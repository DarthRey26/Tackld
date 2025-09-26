import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/lib/services';
import { toast } from 'sonner';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch Supabase profile when user is authenticated
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await profileService.getUserProfile(session.user.id);
              
              if (!error && profileData) {
                setUserProfile(profileData);
                localStorage.setItem('userProfile', JSON.stringify(profileData));
                localStorage.setItem('userType', profileData.account_type);
                
                // Navigate to appropriate dashboard on successful authentication
                if (event === 'SIGNED_IN') {
                  const accountType = profileData.account_type;
                  console.log('User signed in with account type:', accountType);
                  if (accountType === 'customer') {
                    navigate('/customer-dashboard');
                  } else if (accountType === 'contractor') {
                    navigate('/contractor-main');
                  } else if (accountType === 'admin') {
                    navigate('/admin');
                  }
                }
              }
            } catch (profileError) {
              console.warn('Could not fetch user profile:', profileError);
            }
          }, 0);
        } else {
          // Clear profile when logged out
          setUserProfile(null);
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userType');
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // Auth state change handler will handle the session if it exists
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, userType, fullName, phoneNumber, serviceType }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            accountType: userType,
            fullName,
            phoneNumber,
            serviceType
          }
        }
      });

      if (error) throw error;

      toast.success('Registration successful! Please check your email to verify your account.');
      return { data, error: null };
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      // The auth state change handler will handle profile fetching and navigation
      toast.success('Welcome back!');
      return { data, error: null };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // The auth state change handler will handle state clearing
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
    isContractor: userProfile?.account_type === 'contractor',
    isCustomer: userProfile?.account_type === 'customer',
    isAdmin: userProfile?.account_type === 'admin',
    userType: userProfile?.account_type
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};