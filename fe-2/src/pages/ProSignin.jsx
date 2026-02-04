import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogIn, Mail, Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProSignin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin', 'forgot', 'verify', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find account
      const accounts = await base44.entities.ProAccount.filter({ email, is_verified: true });
      
      if (accounts.length === 0) {
        setError('Account not found. Please sign up first.');
        setLoading(false);
        return;
      }

      const account = accounts[0];

      // Check password
      if (account.password !== password) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      // Create authenticated session
      authState.setSession(email, 'pro');
      window.dispatchEvent(new Event('storage'));
      
      // Redirect to dashboard
      navigate(createPageUrl('ProDashboard') + `?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError('Sign in failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const accounts = await base44.entities.ProAccount.filter({ email, is_verified: true });
      
      if (accounts.length === 0) {
        setError('No account found with this email.');
        setLoading(false);
        return;
      }

      const account = accounts[0];
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await base44.entities.ProAccount.update(account.id, {
        verification_code: code
      });

      setAccountId(account.id);
      setVerificationCode(code);

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'StageLink - Password Reset Code',
        body: `
          <h2>Password Reset Request</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 36px; font-weight: bold; color: #E85D04; letter-spacing: 8px;">${code}</h1>
          <p>Enter this code to reset your password.</p>
          <p>This code will expire in 10 minutes.</p>
        `
      });

      setMode('verify');
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    }
    
    setLoading(false);
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (inputCode !== verificationCode) {
      setError('Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    setMode('reset');
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await base44.entities.ProAccount.update(accountId, {
        password: newPassword
      });

      setMode('signin');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      alert('Password reset successful! Please sign in with your new password.');
    } catch (err) {
      setError('Failed to reset password. Please try again.');
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
                    onClick={() => setMode('forgot')}
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

          {mode === 'forgot' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-burnt-orange" />
                  Reset Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your email to receive a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
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
                        Sending Code...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('signin')}
                    className="w-full text-gray-400"
                  >
                    Back to Sign In
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
                    onClick={() => setMode('forgot')}
                    className="w-full text-gray-400"
                  >
                    Use Different Email
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
                  Enter your new password twice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">New Password</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Confirm New Password</Label>
                    <Input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
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