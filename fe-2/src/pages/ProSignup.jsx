import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, Shield, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email', 'verify', 'password', 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountId, setAccountId] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if email already exists
      const existing = await base44.entities.ProAccount.filter({ email, is_verified: true });
      if (existing.length > 0) {
        setError('This email is already registered. Please sign in.');
        setLoading(false);
        return;
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create account record
      const account = await base44.entities.ProAccount.create({
        email,
        verification_code: code,
        is_verified: false
      });

      setAccountId(account.id);
      setVerificationCode(code);

      // Send verification email
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'StageLink - Email Verification Code',
        body: `
          <h2>Welcome to StageLink!</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 36px; font-weight: bold; color: #E85D04; letter-spacing: 8px;">${code}</h1>
          <p>Enter this code to complete your Stage Pro registration.</p>
          <p>This code will expire in 10 minutes.</p>
        `
      });

      setStep('verify');
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    }
    
    setLoading(false);
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (inputCode !== verificationCode) {
      setError('Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Update account as verified
      await base44.entities.ProAccount.update(accountId, {
        is_verified: true
      });

      setStep('password');
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Save password
      await base44.entities.ProAccount.update(accountId, {
        password: password
      });

      setStep('success');
      
      // Redirect to profile setup after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl('ProDashboard') + `?email=${encodeURIComponent(email)}&new=true`);
      }, 2000);
    } catch (err) {
      setError('Failed to set password. Please try again.');
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
              Manage your profile and bookings
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
                  We'll send you a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                      'Send Verification Code'
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
                    onClick={() => setStep('email')}
                    className="w-full text-gray-400"
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
                  Create Your Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set a password to secure your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSetup} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Password</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Confirm Password</Label>
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
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