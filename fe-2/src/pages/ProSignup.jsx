import React, { useState, useEffect } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Shield, CheckCircle, Lock, User, HelpCircle, Check, X, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Debounce hook for real-time validation
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const SECURITY_QUESTIONS = [
  "What is your pet's name?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was your childhood nickname?",
  "What is your favorite season?",
  "What was the name of your first school?",
  "What is your mother's maiden name?"
];

export default function ProSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email', 'verify', 'info', 'security', 'password', 'success'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [securityQuestion1, setSecurityQuestion1] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time validation states
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });
  const [phoneStatus, setPhoneStatus] = useState({ checking: false, available: null, message: '' });
  const [nameValid, setNameValid] = useState(null);
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Debounced values for API calls
  const debouncedEmail = useDebounce(email, 500);
  const debouncedPhone = useDebounce(phone, 500);

  // Real-time email validation
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) {
        setEmailStatus({ checking: false, available: null, message: '' });
        return;
      }
      
      setEmailStatus({ checking: true, available: null, message: 'Checking...' });
      try {
        const result = await stagepro.auth.checkEmail(debouncedEmail, 'pro');
        if (result.exists) {
          // Show which account type if different
          const existingType = result.user_type || 'user';
          const message = existingType === 'customer' 
            ? 'Email registered as Customer account' 
            : 'Email already registered';
          setEmailStatus({ checking: false, available: false, message });
        } else {
          setEmailStatus({ checking: false, available: true, message: 'Email available' });
        }
      } catch (err) {
        setEmailStatus({ checking: false, available: null, message: '' });
      }
    };
    checkEmail();
  }, [debouncedEmail]);

  // Real-time phone validation
  useEffect(() => {
    const checkPhone = async () => {
      const phoneDigits = phone.replace(/\D/g, '');
      if (!debouncedPhone || phoneDigits.length < 10) {
        setPhoneStatus({ checking: false, available: null, message: '' });
        return;
      }
      
      setPhoneStatus({ checking: true, available: null, message: 'Checking...' });
      try {
        const result = await stagepro.auth.checkPhone(debouncedPhone, 'pro');
        // Check if phone format is invalid
        if (result.valid === false) {
          setPhoneStatus({ checking: false, available: false, message: result.error || 'Invalid phone format' });
        } else if (result.exists) {
          // Show which account type if different
          const existingType = result.user_type || 'user';
          const message = existingType === 'customer' 
            ? 'Phone registered as Customer account' 
            : 'Phone already registered';
          setPhoneStatus({ checking: false, available: false, message });
        } else {
          setPhoneStatus({ checking: false, available: true, message: 'Phone available' });
        }
      } catch (err) {
        setPhoneStatus({ checking: false, available: null, message: '' });
      }
    };
    checkPhone();
  }, [debouncedPhone]);

  // Real-time name validation
  useEffect(() => {
    if (!name) {
      setNameValid(null);
    } else if (name.trim().length >= 2) {
      setNameValid(true);
    } else {
      setNameValid(false);
    }
  }, [name]);

  // Validation status indicator component
  const ValidationIndicator = ({ status, checking, message }) => {
    if (checking) {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{message}</span>
        </div>
      );
    }
    if (status === true) {
      return (
        <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
          <Check className="w-3 h-3" />
          <span>{message}</span>
        </div>
      );
    }
    if (status === false) {
      return (
        <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
          <X className="w-3 h-3" />
          <span>{message}</span>
        </div>
      );
    }
    return null;
  };

  // Password requirement checks (stronger for pros)
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Password requirement indicator
  const PasswordRequirement = ({ met, label }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-400' : 'text-gray-500'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (emailStatus.available === false) {
      setError('Please use a different email address.');
      return;
    }

    if (emailStatus.checking) {
      setError('Please wait for email validation to complete.');
      return;
    }

    // Send verification email
    setLoading(true);
    try {
      await stagepro.auth.customer.sendVerification(email, '', 'pro');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    }
    setLoading(false);
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify the code server-side
      await stagepro.auth.customer.verifyEmail(email, inputCode);
      setStep('info');
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    }
    setLoading(false);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    // Phone is required
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 10) {
      setError('Phone number is required.');
      return;
    }

    // Check phone validation status
    if (phoneStatus.available === false) {
      setError('Please use a different phone number or fix the format.');
      return;
    }
    if (phoneStatus.checking) {
      setError('Please wait for phone validation to complete.');
      return;
    }

    setStep('security');
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!securityQuestion1 || !securityAnswer1.trim()) {
      setError('Please select and answer the first security question.');
      return;
    }

    if (!securityQuestion2 || !securityAnswer2.trim()) {
      setError('Please select and answer the second security question.');
      return;
    }

    if (securityQuestion1 === securityQuestion2) {
      setError('Please select two different security questions.');
      return;
    }

    setStep('password');
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!allPasswordChecksPassed) {
      setError('Please meet all password requirements.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Complete signup with backend
      const result = await stagepro.auth.signup(
        email, 
        password, 
        name, 
        phone,
        'pro',
        securityQuestion1,
        securityAnswer1,
        securityQuestion2,
        securityAnswer2
      );

      // Set session
      authState.setSession(email, 'pro');
      window.dispatchEvent(new Event('storage'));

      setStep('success');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl('ProDashboard') + `?email=${encodeURIComponent(email)}&new=true`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    }
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      await stagepro.auth.customer.sendVerification(email, '', 'pro');
      setError(''); // Clear any previous error
      alert('Verification code resent! Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-20 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-3">
              Stage Pro Access
            </h1>
            <p className="text-gray-400">
              Create your professional account
            </p>
          </div>

          {step === 'email' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-burnt-orange" />
                  Enter Your Email
                </CardTitle>
                <CardDescription className="text-gray-400">
                  We'll verify your email to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Email Address</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="pro@example.com"
                        className={`bg-white/5 border-white/20 text-white pr-10 ${
                          emailStatus.available === true ? 'border-green-500/50' : 
                          emailStatus.available === false ? 'border-red-500/50' : ''
                        }`}
                      />
                      {(emailStatus.checking || emailStatus.available !== null) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailStatus.checking ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : emailStatus.available ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <ValidationIndicator 
                      status={emailStatus.available} 
                      checking={emailStatus.checking} 
                      message={emailStatus.message} 
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || emailStatus.checking || emailStatus.available === false}
                    className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending Verification...
                      </>
                    ) : emailStatus.checking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-gray-400 text-sm">
                      Already have an account?{' '}
                      <Link 
                        to={createPageUrl('ProSignin')} 
                        className="text-burnt-orange hover:text-burnt-orange/80 font-semibold"
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'verify' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-neon-teal" />
                  Verify Your Email
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the 6-digit code sent to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerification} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Verification Code</Label>
                    <Input
                      type="text"
                      required
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || inputCode.length !== 6}
                    className="w-full bg-neon-teal hover:bg-neon-teal/90 text-black font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full text-gray-400 hover:text-white"
                  >
                    Resend Code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('email')}
                    className="w-full text-gray-400"
                  >
                    Use Different Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'info' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-burnt-orange" />
                  Your Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Tell us a bit about yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Full Name</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className={`bg-white/5 border-white/20 text-white pr-10 ${
                          nameValid === true ? 'border-green-500/50' : 
                          nameValid === false ? 'border-red-500/50' : ''
                        }`}
                      />
                      {nameValid !== null && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {nameValid ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {nameValid === false && (
                      <p className="text-red-400 text-xs mt-1">Name must be at least 2 characters</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Phone Number</Label>
                    <div className="relative">
                      <Input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(512) 555-0123"
                        className={`bg-white/5 border-white/20 text-white pr-10 ${
                          phoneStatus.available === true ? 'border-green-500/50' : 
                          phoneStatus.available === false ? 'border-red-500/50' : ''
                        }`}
                      />
                      {(phoneStatus.checking || phoneStatus.available !== null) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {phoneStatus.checking ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : phoneStatus.available ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <ValidationIndicator 
                      status={phoneStatus.available} 
                      checking={phoneStatus.checking} 
                      message={phoneStatus.message} 
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || phoneStatus.checking || phoneStatus.available === false || !phone}
                    className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white disabled:opacity-50"
                  >
                    {phoneStatus.checking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('email')}
                    className="w-full text-gray-400 hover:text-white flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'security' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-neon-teal" />
                  Security Questions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Used to recover your account if you forget your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecuritySubmit} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Security Question 1</Label>
                    <Select value={securityQuestion1} onValueChange={setSecurityQuestion1}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_QUESTIONS.map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Answer 1</Label>
                    <Input
                      type="text"
                      required
                      value={securityAnswer1}
                      onChange={(e) => setSecurityAnswer1(e.target.value)}
                      placeholder="Your answer"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Security Question 2</Label>
                    <Select value={securityQuestion2} onValueChange={setSecurityQuestion2}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select a different question" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_QUESTIONS.filter(q => q !== securityQuestion1).map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Answer 2</Label>
                    <Input
                      type="text"
                      required
                      value={securityAnswer2}
                      onChange={(e) => setSecurityAnswer2(e.target.value)}
                      placeholder="Your answer"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white"
                  >
                    Continue
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('info')}
                    className="w-full text-gray-400 hover:text-white flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Information
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'password' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-burnt-orange" />
                  Create Your Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create a strong password for your professional account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSetup} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className={`bg-white/5 border-white/20 text-white pr-20 ${
                          password && (allPasswordChecksPassed ? 'border-green-500/50' : 'border-yellow-500/50')
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-white focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {password && (
                          allPasswordChecksPassed ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )
                        )}
                      </div>
                    </div>
                    
                    {/* Password requirements checklist */}
                    {password && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg space-y-1.5">
                        <p className="text-xs text-gray-400 mb-2 font-medium">Password Requirements:</p>
                        <PasswordRequirement met={passwordChecks.length} label="At least 8 characters" />
                        <PasswordRequirement met={passwordChecks.uppercase} label="One uppercase letter (A-Z)" />
                        <PasswordRequirement met={passwordChecks.lowercase} label="One lowercase letter (a-z)" />
                        <PasswordRequirement met={passwordChecks.number} label="One number (0-9)" />
                        <PasswordRequirement met={passwordChecks.special} label="One special character (!@#$%^&* etc)" />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`bg-white/5 border-white/20 text-white pr-20 ${
                          confirmPassword && (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50')
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-white focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {confirmPassword && (
                          passwordsMatch ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )
                        )}
                      </div>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                    {confirmPassword && passwordsMatch && (
                      <p className="text-green-400 text-xs mt-1">Passwords match</p>
                    )}
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !allPasswordChecksPassed || !passwordsMatch}
                    className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('security')}
                    className="w-full text-gray-400 hover:text-white flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Security Questions
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'success' && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-neon-teal" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
                  <p className="text-gray-400">
                    Redirecting to your dashboard...
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-burnt-orange mx-auto mt-4" />
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}