import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Loader2, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'email-otp' | 'email-otp-verify';

const Auth = () => {
  const { login, register, loginWithGoogle, sendEmailOTP, verifyEmailOTP, isAuthenticated, user } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Store redirect type on mount so it doesn't get lost
  const [storedRedirect] = useState(() => searchParams.get('redirect'));

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Email OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && storedRedirect) {
      console.log('Auth: User logged in, redirecting...', storedRedirect);

      // Handle redirect after login
      if (storedRedirect === 'continue-booking') {
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        console.log('Pending booking:', pendingBooking);

        if (pendingBooking) {
          const bookingData = JSON.parse(pendingBooking);
          const params = new URLSearchParams({
            amount: bookingData.pricing.total.toString(),
            description: `Booking at ${bookingData.hotelTitle}`,
            type: 'booking',
          });
          console.log('Navigating to QR payment:', `/qr-payment?${params.toString()}`);
          navigate(`/qr-payment?${params.toString()}`);
          return;
        }
      } else if (storedRedirect === 'continue-journey') {
        const pendingJourney = sessionStorage.getItem('pendingJourney');
        console.log('Pending journey:', pendingJourney);

        if (pendingJourney) {
          const journeyData = JSON.parse(pendingJourney);
          const params = new URLSearchParams({
            amount: journeyData.amount.toString(),
            description: `Journey from ${journeyData.from} to ${journeyData.to}`,
            type: 'journey',
          });
          console.log('Navigating to QR payment:', `/qr-payment?${params.toString()}`);
          navigate(`/qr-payment?${params.toString()}`);
          return;
        }
      }
      navigate('/');
    }
  }, [isAuthenticated, user, storedRedirect, navigate]);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        toast.success('Login successful!');
        // handlePostLoginRedirect will be called by useEffect
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(signupEmail, signupPassword, firstName, lastName);
      if (result.success) {
        toast.success(result.message);
        // handlePostLoginRedirect will be called by useEffect
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        toast.success('Google login successful!');
        navigate('/');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email OTP Send
  const handleSendEmailOTP = async () => {
    if (!otpEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendEmailOTP(otpEmail);
      if (result.success) {
        toast.success(result.message);
        setMode('email-otp-verify');
        setOtpTimer(600); // 10 minutes
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email OTP Verify
  const handleVerifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmailOTP(otpEmail, emailOtp);
      if (result.success) {
        // Create session-based login (expires when browser closes)
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('auth_session_token', sessionToken);
        sessionStorage.setItem('auth_email', otpEmail);
        sessionStorage.setItem('auth_method', 'otp');

        toast.success(result.message);
        navigate('/');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Email OTP Flow
  if (mode === 'email-otp') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-secondary/5">
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-1/4 right-20 w-16 h-16 bg-accent/15 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

          <div className="relative z-10 flex flex-col justify-center items-center p-12 min-h-full">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl scale-110"></div>
                <img
                  src="/logo-bookonce.svg"
                  alt="BookOnce Logo"
                  className="relative w-16 h-16 mx-auto drop-shadow-lg"
                />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-3">
                Secure Login
              </h2>
              <p className="text-lg text-muted-foreground font-medium">We'll send you a verification code</p>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
          <div className="w-full max-w-md">
            <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/5 pointer-events-none"></div>
              <div className="absolute inset-0 shadow-inner pointer-events-none"></div>

              <CardHeader className="text-center pb-6 relative z-10">
                <Button
                  variant="ghost"
                  className="absolute left-4 top-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setMode('login')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <Mail className="text-white text-lg" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  Login with Email OTP
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  We'll send a verification code to your email
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp-email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={otpEmail}
                    onChange={e => setOtpEmail(e.target.value)}
                    className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <Button
                  onClick={handleSendEmailOTP}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send OTP
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render Email OTP Verification
  if (mode === 'email-otp-verify') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-secondary/5">
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-1/4 right-20 w-16 h-16 bg-accent/15 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

          <div className="relative z-10 flex flex-col justify-center items-center p-12 min-h-full">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl scale-110"></div>
                <img
                  src="/logo-bookonce.svg"
                  alt="BookOnce Logo"
                  className="relative w-16 h-16 mx-auto drop-shadow-lg"
                />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-3">
                Verify Your Email
              </h2>
              <p className="text-lg text-muted-foreground font-medium">Enter the code we sent to your email</p>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Verification */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
          <div className="w-full max-w-md">
            <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/5 pointer-events-none"></div>
              <div className="absolute inset-0 shadow-inner pointer-events-none"></div>

              <CardHeader className="text-center pb-6 relative z-10">
                <Button
                  variant="ghost"
                  className="absolute left-4 top-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setMode('email-otp')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🔐</span>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  Verify OTP
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Enter the 6-digit code sent to {otpEmail}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-otp" className="text-sm font-medium text-foreground">
                    Enter OTP
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-3xl tracking-widest h-14 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm font-mono"
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {otpTimer > 0 && (
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-muted/50">
                    <p className="text-sm text-muted-foreground font-medium">
                      Code expires in <span className="font-bold text-primary">{formatTime(otpTimer)}</span>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleVerifyEmailOTP}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Verify & Login
                </Button>

                <div className="text-center">
                  {otpTimer === 0 ? (
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80 font-medium"
                      onClick={() => {
                        setEmailOtp('');
                        handleSendEmailOTP();
                      }}
                      disabled={isLoading}
                    >
                      Resend OTP
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the code? Check your spam folder
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main Auth Page (Login/Signup)
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-950">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-secondary/5">
          {/* Floating Shapes */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-1/4 right-20 w-16 h-16 bg-accent/15 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 right-10 w-12 h-12 bg-primary/12 rounded-full blur-lg animate-ping" style={{ animationDelay: '0.5s' }}></div>

          {/* Geometric Patterns */}
          <div className="absolute top-20 right-1/3 w-2 h-2 bg-primary/30 rounded-full"></div>
          <div className="absolute top-40 left-1/3 w-1 h-1 bg-accent/40 rounded-full"></div>
          <div className="absolute bottom-40 right-1/4 w-3 h-3 bg-secondary/25 rounded-full"></div>
          <div className="absolute bottom-1/3 left-20 w-2 h-2 bg-primary/35 rounded-full"></div>
        </div>

        {/* Glass Morphism Overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

        <div className="relative z-10 flex flex-col justify-center items-center p-8 pl-44 min-h-full">
          {/* Logo Section */}
          <div className="mb-6 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-3">
              BookOnce
            </h1>
            <p className="text-xl text-muted-foreground font-medium">Your Ultimate Travel Companion</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-4 max-w-sm">
            <div className="group flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">✈️</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">AI-Powered Planning</h3>
                <p className="text-sm text-muted-foreground">Smart itineraries tailored to your preferences</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Safety First</h3>
                <p className="text-sm text-muted-foreground">24/7 emergency support and safety features</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Global Coverage</h3>
                <p className="text-sm text-muted-foreground">Explore destinations worldwide with confidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen relative">
        <div className="w-full max-w-md">
          {/* Floating decorative elements */}
          <div className="absolute top-20 right-20 w-4 h-4 bg-primary/20 rounded-full blur-sm animate-pulse hidden lg:block"></div>
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-accent/15 rounded-full blur-sm animate-bounce hidden lg:block" style={{ animationDelay: '1.5s' }}></div>

          <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            {/* Card gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary/5 pointer-events-none"></div>

            {/* Subtle inner shadow */}
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>

            <CardHeader className="text-center pb-6 relative z-10">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✈️</span>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 px-8 pb-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger
                    value="login"
                    className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-6 mt-6">
                  <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        required
                        className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          required
                          className="h-12 pr-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-10 w-10 hover:bg-muted/50 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="h-12 border-2 hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMode('email-otp')}
                      disabled={isLoading}
                      className="h-12 border-2 hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Email OTP
                    </Button>
                  </div>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup" className="space-y-6 mt-6">
                  <form onSubmit={handleEmailSignup} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-sm font-medium text-foreground">
                          First Name
                        </Label>
                        <Input
                          id="first-name"
                          placeholder="John"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                          className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-sm font-medium text-foreground">
                          Last Name
                        </Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          required
                          className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        required
                        className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        required
                        className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={e => setSignupConfirmPassword(e.target.value)}
                        required
                        className="h-12 border-2 border-muted focus:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Create Account
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
