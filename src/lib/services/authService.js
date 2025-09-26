import { supabase } from '@/integrations/supabase/client';

export const authService = {
  // Sign up a new user
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            fullName: userData.fullName,
            phoneNumber: userData.phoneNumber,
            accountType: userData.accountType,
            contractorType: userData.contractorType,
            serviceType: userData.serviceType,
            companyName: userData.companyName,
            bio: userData.bio,
            yearsExperience: userData.yearsExperience
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('supabaseSession');
      localStorage.removeItem('userType');
      localStorage.removeItem('userProfile');
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userType");
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: null, error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      return { data, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { data: null, error };
    }
  },

  // Listen for auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      return { data, error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  }
};