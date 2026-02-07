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

export default function CustomerSignin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin', 'forgot', 'verify', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the backend API for customer login
      const result = await base44.auth.login(email, password, 'customer');
      
      if (result && result.user) {
        // Store session in localStorage for app state
        authState.setSession(email, 'customer');
        window.dispatchEvent(new Event('storage'));
        
        navigate(createPageUrl('CustomerDashboard') + `?email=${encodeURIComponent(email)}`);
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (err) {
      // Handle specific error messages from the backend
      if (err.message.includes('Invalid email') || err.message.includes('not found')) {
        setError('Account not found or incorrect password. Please try again.');
      } else if (err.message.includes('not verified')) {
        setError('Account not verified. Please verify your email first.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await base44.auth.sendResetCode(email, 'customer');
      setMode('verify');
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    }
    
    setLoading(false);
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await base44.auth.verifyResetCode(email, inputCode, 'customer');
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    }
    
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
      await base44.auth.resetPassword(email, newPassword, 'customer');
      
      setMode('signin');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setInputCode('');
      setError('');
      alert('Password reset successful! Please sign in with your new password.');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
              {mode === 'signin' ? 'Welcome Back' : 'Reset Password'}
            </h1>
            <p className="text-gray-400">
              {mode === 'signin' ? 'Sign in to manage your bookings' : 'Recover your account'}
            </p>
          </div>

          {mode === 'signin' && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-burnt-orange" />
                  Customer Sign In
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Access your bookings and messages
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
                      placeholder="john@example.com"
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
                        to={createPageUrl('CustomerSignup')} 
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
                      placeholder="john@example.com"
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

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Are you a StagePro?{' '}
              <Link to={createPageUrl('ProSignin')} className="text-neon-teal hover:text-neon-teal/80">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}