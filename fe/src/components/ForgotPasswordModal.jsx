import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader, Mail, ArrowLeft, Check, KeyRound, ShieldQuestion } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [method, setMethod] = useState('choose'); // 'choose' | 'email' | 'security'
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code/questions, 3: New password, 4: Success
  const [email, setEmail] = useState('');
  
  // Security questions state
  const [securityQuestions, setSecurityQuestions] = useState({ q1: '', q2: '' });
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
    },
  });

  const validatePasswordStrength = (pwd) => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};:'"",.<>?/\\|`~]/.test(pwd),
    };
    const score = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength({ score, requirements });
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    validatePasswordStrength(pwd);
  };

  const isPasswordValid = passwordStrength.score === 5;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  // Step 1: Send reset code to email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset code');
      }

      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid or expired code');
      }

      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset the password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: resetCode,
          new_password: newPassword 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Security Questions handlers
  const handleFetchSecurityQuestions = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/auth/security-questions?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Email not found');
      }

      setSecurityQuestions({
        q1: data.security_question_1,
        q2: data.security_question_2
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Email not found. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithSecurityQuestions = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          security_answer_1: securityAnswer1,
          security_answer_2: securityAnswer2,
          new_password: newPassword 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setStep(4);
    } catch (err) {
      setError(err.message || 'Security answers incorrect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMethod('choose');
    setStep(1);
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityAnswer1('');
    setSecurityAnswer2('');
    setSecurityQuestions({ q1: '', q2: '' });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackToLogin = () => {
    resetForm();
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {((method !== 'choose') || (step > 1 && step < 4)) && (
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    setMethod('choose');
                  }
                  setError('');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-white">
              {method === 'choose' && 'Forgot Password'}
              {method === 'email' && step === 1 && 'Reset via Email'}
              {method === 'email' && step === 2 && 'Enter Code'}
              {method === 'security' && step === 1 && 'Security Questions'}
              {method === 'security' && step === 2 && 'Answer Questions'}
              {step === 3 && 'New Password'}
              {step === 4 && 'Password Reset'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Method Selection */}
          {method === 'choose' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-6">
                Choose how you'd like to reset your password
              </p>
              
              <button
                onClick={() => setMethod('email')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Email Reset Code</div>
                  <div className="text-sm text-slate-400">We'll send a code to your email</div>
                </div>
              </button>
              
              <button
                onClick={() => setMethod('security')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <ShieldQuestion className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Security Questions</div>
                  <div className="text-sm text-slate-400">Answer your security questions</div>
                </div>
              </button>
            </div>
          )}

          {/* Step 1: Enter Email (Email method) */}
          {method === 'email' && step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">
                  Enter your email address and we'll send you a code to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.includes('@')}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Enter Code (Email method) */}
          {method === 'email' && step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-slate-400 text-sm">
                  We've sent a 6-digit code to <span className="text-white font-medium">{email}</span>. 
                  Enter it below to continue.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reset Code
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || resetCode.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Didn't receive the code? Resend
              </button>
            </form>
          )}

          {/* Step 1: Enter Email (Security method) */}
          {method === 'security' && step === 1 && (
            <form onSubmit={handleFetchSecurityQuestions} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldQuestion className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-slate-400 text-sm">
                  Enter your email to retrieve your security questions.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.includes('@')}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Get Security Questions'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Answer Questions (Security method) */}
          {method === 'security' && step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-slate-400 text-sm">
                  Answer your security questions to verify your identity.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {securityQuestions.q1}
                </label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer1}
                  onChange={(e) => setSecurityAnswer1(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {securityQuestions.q2}
                </label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer2}
                  onChange={(e) => setSecurityAnswer2(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
              </div>

              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!securityAnswer1 || !securityAnswer2}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={method === 'email' ? handleResetPassword : handleResetWithSecurityQuestions} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">
                  Create a new password for your account.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  required
                />
                {newPassword && <PasswordStrengthMeter strength={passwordStrength} />}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 ${
                    confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-500')
                  }`}
                  required
                />
                {confirmPassword && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${
                    passwordsMatch ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {passwordsMatch ? <Check size={16} /> : <X size={16} />}
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800"
                />
                <label htmlFor="showPassword" className="text-sm text-slate-400">
                  Show passwords
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
                className={`w-full h-12 text-white font-semibold rounded-xl disabled:opacity-50 ${
                  method === 'email' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Password Reset Successfully!</h3>
                <p className="text-slate-400 text-sm">
                  Your password has been changed. You can now sign in with your new password.
                </p>
              </div>
              <Button
                onClick={handleBackToLogin}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl"
              >
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Back to Login Link (except on success screen) */}
          {step !== 4 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
