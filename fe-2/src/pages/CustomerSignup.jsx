import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, Shield, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('info'); // 'info', 'verify', 'password', 'success'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if account exists
      const existing = await base44.entities.CustomerAccount.filter({ email });
      if (existing.length > 0) {
        setError('An account with this email already exists. Please sign in.');
        setLoading(false);
        return;
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Create account
      const account = await base44.entities.CustomerAccount.create({
        email,
        name,
        phone,
        verification_code: code,
        is_verified: false
      });

      setAccountId(account.id);
      setVerificationCode(code);

      // Send verification email
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'StagePros - Verify Your Email',
        body: `
          <h2>Welcome to StagePros!</h2>
          <p>Hi ${name},</p>
          <p>Your verification code is:</p>
          <h1 style="font-size: 36px; font-weight: bold; color: #E85D04; letter-spacing: 8px;">${code}</h1>
          <p>Enter this code to complete your account setup.</p>
        `
      });

      setStep('verify');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }

    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (inputCode !== verificationCode) {
      setError('Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    setStep('password');
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
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
      await base44.entities.CustomerAccount.update(accountId, {
        password,
        is_verified: true
      });

      setStep('success');
    } catch (err) {
      setError('Failed to set password. Please try again.');
    }

    setLoading(false);
  };

  const handleGoToDashboard = () => {
    authState.setSession(email, 'customer');
    window.dispatchEvent(new Event('storage'));
    navigate(createPageUrl('CustomerDashboard') + `?email=${encodeURIComponent(email)}`);
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
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

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
                    <Label className="text-white mb-2 block">Phone Number</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(512) 555-0123"
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
                        Setting Password...
                      </>
                    ) : (
                      'Complete Signup'
                    )}
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