import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogIn, Mail, Shield, Lock, HelpCircle, KeyRound, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProSignin() {
  const navigate = useNavigate();
  // Modes: 'signin', 'forgot-choice', 'forgot-security', 'forgot-email', 'verify', 'reset'
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Security questions state
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  
  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirement checks
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(newPassword),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword && confirmNewPassword && newPassword === confirmNewPassword;

  // Password requirement indicator component
  const PasswordRequirement = ({ met, label }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-400' : 'text-gray-500'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use backend login endpoint with password verification
      const result = await stagepro.auth.login(email, password, 'pro');
      
      // Set session
      authState.setSession(email, 'pro');
      window.dispatchEvent(new Event('storage'));
      
      // Redirect to dashboard
      navigate(createPageUrl('ProDashboard') + `?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleForgotPasswordChoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if email exists and get security questions
      const result = await stagepro.auth.pro.getSecurityQuestions(email);
      
      if (result.questions && result.questions.length > 0) {
        setSecurityQuestions(result.questions);
        setMode('forgot-choice');
      } else {
        // No security questions, go straight to email verification
        await handleSendEmailCode();
      }
    } catch (err) {
      setError(err.message || 'No account found with this email.');
    }
    
    setLoading(false);
  };

  const handleSendEmailCode = async () => {
    setLoading(true);
    setError('');

    try {
      await stagepro.auth.pro.sendResetCode(email);
      setMode('verify');
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSecurityQuestionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await stagepro.auth.pro.resetWithSecurityQuestions(
        email,
        securityAnswer1,
        securityAnswer2
      );
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Incorrect answers. Please try again.');
    }
    
    setLoading(false);
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await stagepro.auth.pro.verifyResetCode(email, inputCode);
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
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
      await stagepro.auth.pro.resetPassword(email, newPassword);

      setMode('signin');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setInputCode('');
      setSecurityAnswer1('');
      setSecurityAnswer2('');
      setError('');
      alert('Password reset successful! Please sign in with your new password.');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    }
    
    setLoading(false);
  };

  const resetToSignin = () => {
    setMode('signin');
    setError('');
    setInputCode('');
    setSecurityAnswer1('');
    setSecurityAnswer2('');
    setSecurityQuestions([]);
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
              {mode === 'signin' ? 'Stage Pro Sign In' : 'Reset Password'}
            </h1>
            <p className="text-gray-400">
              {mode === 'signin' ? 'Access your dashboard' : 'Recover your account'}
            </p>
          </div>

          {mode === 'signin' && (
            <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-burnt-orange" />
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to manage your profile and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignin} className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pro@example.com"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">Password</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-email-input')}
                    className="text-gray-400 hover:text-burnt-orange text-sm transition-colors"
                  >
                    Forgot password?
                  </button>
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <Link 
                      to={createPageUrl('ProSignup')} 
                      className="text-burnt-orange hover:text-burnt-orange/80 font-semibold"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          )}

          {mode === 'forgot-email-input' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-burnt-orange" />
                  Reset Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your email to begin password reset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPasswordChoice} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Email Address</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pro@example.com"
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
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetToSignin}
                    className="w-full text-gray-400"
                  >
                    Back to Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {mode === 'forgot-choice' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-burnt-orange" />
                  Choose Reset Method
                </CardTitle>
                <CardDescription className="text-gray-400">
                  How would you like to reset your password?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setMode('forgot-security')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 h-auto py-4"
                >
                  <div className="flex items-center gap-3 w-full">
                    <HelpCircle className="w-6 h-6 text-neon-teal" />
                    <div className="text-left">
                      <div className="font-semibold">Answer Security Questions</div>
                      <div className="text-sm text-gray-400">Use your pre-set security answers</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleSendEmailCode}
                  disabled={loading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 h-auto py-4"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Mail className="w-6 h-6 text-burnt-orange" />
                    <div className="text-left">
                      <div className="font-semibold">
                        {loading ? 'Sending Code...' : 'Email Verification Code'}
                      </div>
                      <div className="text-sm text-gray-400">Get a code sent to {email}</div>
                    </div>
                  </div>
                </Button>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetToSignin}
                  className="w-full text-gray-400"
                >
                  Back to Sign In
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === 'forgot-security' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-neon-teal" />
                  Security Questions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Answer both questions to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecurityQuestionSubmit} className="space-y-4">
                  {securityQuestions[0] && (
                    <div>
                      <Label className="text-white mb-2 block">{securityQuestions[0]}</Label>
                      <Input
                        type="text"
                        required
                        value={securityAnswer1}
                        onChange={(e) => setSecurityAnswer1(e.target.value)}
                        placeholder="Your answer"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  )}

                  {securityQuestions[1] && (
                    <div>
                      <Label className="text-white mb-2 block">{securityQuestions[1]}</Label>
                      <Input
                        type="text"
                        required
                        value={securityAnswer2}
                        onChange={(e) => setSecurityAnswer2(e.target.value)}
                        placeholder="Your answer"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neon-teal hover:bg-neon-teal/90 text-black font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Answers'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('forgot-choice')}
                    className="w-full text-gray-400"
                  >
                    Use Different Method
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {mode === 'verify' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-neon-teal" />
                  Verify Code
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the 6-digit code sent to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyReset} className="space-y-4">
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
                      'Verify Code'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSendEmailCode}
                    disabled={loading}
                    className="w-full text-gray-400 hover:text-white"
                  >
                    Resend Code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('forgot-choice')}
                    className="w-full text-gray-400"
                  >
                    Use Different Method
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {mode === 'reset' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-burnt-orange" />
                  Create New Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Secure your account with a strong password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className={`bg-white/5 border-white/20 text-white pr-20 ${
                          newPassword && (allPasswordChecksPassed ? 'border-green-500/50' : 'border-yellow-500/50')
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-gray-400 hover:text-white focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {newPassword && (
                          allPasswordChecksPassed ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )
                        )}
                      </div>
                    </div>
                    
                    {/* Password requirements */}
                    {newPassword && (
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
                    <Label className="text-white mb-2 block">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`bg-white/5 border-white/20 text-white pr-20 ${
                          confirmNewPassword && (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50')
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
                        {confirmNewPassword && (
                          passwordsMatch ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )
                        )}
                      </div>
                    </div>
                    {confirmNewPassword && !passwordsMatch && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                    {confirmNewPassword && passwordsMatch && (
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
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}