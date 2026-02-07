import React, { useState, useEffect, useCallback } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, Shield, Lock, User, Check, X, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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

export default function CustomerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('info'); // 'info', 'verify', 'password', 'success'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
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
        const result = await stagepro.auth.checkEmail(debouncedEmail, 'customer');
        if (result.exists) {
          // Show which account type if different
          const existingType = result.user_type || 'user';
          const message = existingType === 'pro' 
            ? 'Email registered as Pro account' 
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
        const result = await stagepro.auth.checkPhone(debouncedPhone, 'customer');
        // Check if phone format is invalid
        if (result.valid === false) {
          setPhoneStatus({ checking: false, available: false, message: result.error || 'Invalid phone format' });
        } else if (result.exists) {
          // Show which account type if different
          const existingType = result.user_type || 'user';
          const message = existingType === 'pro' 
            ? 'Phone registered as Pro account' 
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

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields before proceeding
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

    if (emailStatus.available === false) {
      setError('Please use a different email address.');
      return;
    }

    if (phoneStatus.available === false) {
      setError('Please use a different phone number or fix the format.');
      return;
    }

    // Wait for any pending checks
    if (emailStatus.checking || phoneStatus.checking) {
      setError('Please wait for validation to complete.');
      return;
    }

    setStep('password');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Skip verification for now - go to password
    setStep('password');
    setLoading(false);
  };

  // Password requirement checks (same strong requirements for all accounts)
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

  const handlePasswordSubmit = async (e) => {
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
      // Complete signup with backend - creates account with hashed password
      const result = await stagepro.auth.signup(email, password, name, phone, 'customer');
      
      // Set session
      authState.setSession(email, 'customer');
      window.dispatchEvent(new Event('storage'));
      
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    }

    setLoading(false);
  };

  const handleGoToDashboard = () => {
    navigate(createPageUrl('CustomerDashboard') + `?email=${encodeURIComponent(email)}`);
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      await stagepro.auth.customer.sendVerification(email, name);
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
              Create Your Account
            </h1>
            <p className="text-gray-400">
              Book and manage your events with ease
            </p>
          </div>

          {step === 'info' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-burnt-orange" />
                  Your Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Let's get you started
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
                    <Label className="text-white mb-2 block">Email Address</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
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
                    disabled={loading || emailStatus.checking || phoneStatus.checking || emailStatus.available === false || phoneStatus.available === false || !phone}
                    className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white disabled:opacity-50"
                  >
                    {emailStatus.checking || phoneStatus.checking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>

                  <p className="text-center text-gray-400 text-sm mt-4">
                    Already have an account?{' '}
                    <Link 
                      to={createPageUrl('CustomerSignin')} 
                      className="text-burnt-orange hover:text-burnt-orange/80 font-semibold"
                    >
                      Sign In
                    </Link>
                  </p>
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
                <form onSubmit={handleVerify} className="space-y-4">
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
                      'Verify Email'
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
                    onClick={() => setStep('info')}
                    className="w-full text-gray-400 hover:text-white"
                  >
                    Use Different Email
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
                  Create Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Secure your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
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
                    
                    {/* Password requirements */}
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
                      'Complete Signup'
                    )}
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

          {step === 'success' && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Account Created! 🎉
                </h3>
                <p className="text-gray-400 mb-8">
                  Welcome to StagePros. You're all set to book services.
                </p>
                <Button
                  onClick={handleGoToDashboard}
                  className="bg-burnt-orange hover:bg-burnt-orange/90 text-white"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}