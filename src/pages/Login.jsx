import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import "../login.css";
import { supabase } from "@/integrations/supabase/client";
import { authService, profileService } from '@/lib/services';

const LoginSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [signupData, setSignupData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in, redirect them
        const userType = localStorage.getItem('userType') || 'customer';
        if (userType === 'customer') {
          navigate('/customer-dashboard');
        } else if (userType === 'contractor') {
          navigate('/contractor-main');
        }
      }
    };
    
    checkAuthState();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Authenticate with Supabase using service
      const { data, error } = await authService.signIn(loginData.email, loginData.password);
      if (error) throw new Error("Invalid email or password");

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      // Step 2: Fetch user profile from Supabase using service
      const { data: profileData, error: profileError } = await profileService.getUserProfile(data.user.id);
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('User profile not found. Please contact support.');
      }
        
      // Step 3: Role-based routing and session storage
      const accountType = profileData.account_type;
        
        // Store session data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('supabaseSession', JSON.stringify(data.session));
        localStorage.setItem('userType', accountType);
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userType", accountType);
        
        // Trigger storage event for other components
        window.dispatchEvent(new Event("storage"));
        
        toast.success(
          `Welcome back, ${profileData.full_name}!`,
          {
            description: 'Your account is now ready to use.',
            duration: 5000,
          }
        );

        // Navigate based on account type
        if (accountType === 'customer') {
          navigate('/customer-dashboard');
        } else if (accountType === 'contractor') {
          navigate('/contractor-main');
        } else if (accountType === 'admin') {
          navigate('/admin');
        }
        
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        error.message || 'Invalid email or password. Please try again.',
        {
          description: 'If you forgot your password, use the reset link or contact support.',
          duration: 5000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password length
      if (signupData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }


      const { data, error } = await authService.signUp(signupData.email, signupData.password, {
        fullName: signupData.full_name,
        phoneNumber: signupData.phone_number,
        accountType: "customer"
      });

      if (error) {
        if (error.message.includes('User already registered') || error.status === 422) {
          toast.error("An account with this email already exists. Please try logging in instead.");
          return;
        }
        throw error;
      }

      if (!data.user) {
        throw new Error("Failed to create user account");
      }

      // Profile creation is handled automatically by Supabase trigger
      toast.success(
        "Account created successfully! Please check your email to verify your account, then log in.",
        {
          description: 'Check your email for the verification link.',
          duration: 8000,
        }
      );

      // Clear signup form
      setSignupData({
        full_name: "",
        email: "",
        password: "",
        phone_number: ""
      });

    } catch (error) {
      console.error('Signup error:', error);
      toast.error(
        error.message || "Failed to create account. Please try again.",
        {
          description: 'Please ensure all fields are filled correctly and try again.',
          duration: 5000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (formType, field, value) => {
    if (formType === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      setSignupData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Tackld
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your trusted home service platform
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Use your email and password to access your account
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-600">
                  <p>Create a new account to get started with Tackld</p>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <CardTitle>Create a new account</CardTitle>
                <CardDescription>
                  Join Tackld to access home services or offer your expertise
                </CardDescription>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupData.full_name}
                        onChange={(e) => handleInputChange('signup', 'full_name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupData.email}
                        onChange={(e) => handleInputChange('signup', 'email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={signupData.phone_number}
                        onChange={(e) => handleInputChange('signup', 'phone_number', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={signupData.password}
                        onChange={(e) => handleInputChange('signup', 'password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showSignupPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>


                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
        
        {/* Admin access note */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Admin users: Use the regular login form with your admin credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;