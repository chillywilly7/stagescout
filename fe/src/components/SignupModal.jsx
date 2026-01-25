import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export default function SignupModal({ isOpen, onClose, onSignupSuccess }) {
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Security questions
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [securityQuestion1, setSecurityQuestion1] = useState('What is your pet\'s name?');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('What city were you born in?');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
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

  // Validate password strength in real-time
  const validatePasswordStrength = useCallback((pwd) => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};:'"",.<>?/\\|`~]/.test(pwd),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength({ score, requirements });
  }, []);

  // Check if email is already registered
  const checkEmailAvailability = useCallback(async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailError('');
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setEmailError('This email is already registered');
        } else {
          setEmailError('');
        }
      }
    } catch (err) {
      // If endpoint doesn't exist, silently ignore for now
      setEmailError('');
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Check if phone is already registered
  const checkPhoneAvailability = useCallback(async (phoneToCheck) => {
    const digitsOnly = phoneToCheck.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError(digitsOnly.length > 0 ? 'Phone number must be at least 10 digits' : '');
      return;
    }

    setIsCheckingPhone(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToCheck }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setPhoneError('This phone number is already registered');
        } else {
          setPhoneError('');
        }
      }
    } catch (err) {
      // If endpoint doesn't exist, silently ignore for now
      setPhoneError('');
    } finally {
      setIsCheckingPhone(false);
    }
  }, []);

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear any previous errors
    setEmailError('');
    
    // Debounce the email check
    if (newEmail.includes('@')) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(newEmail);
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value;
    setPhone(newPhone);
    
    // Clear any previous errors
    setPhoneError('');
    
    const digitsOnly = newPhone.replace(/\D/g, '');
    
    // Debounce the phone check
    if (digitsOnly.length >= 10) {
      const timeoutId = setTimeout(() => {
        checkPhoneAvailability(newPhone);
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
    }
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    validatePasswordStrength(pwd);
  };

  const isPasswordValid = passwordStrength.score === 5;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isEmailValid = email.trim() && email.includes('@') && !emailError && !isCheckingEmail;
  const isPhoneValid = phone.replace(/\D/g, '').length >= 10 && !phoneError && !isCheckingPhone;

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate basic info
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Valid phone number is required (minimum 10 digits)');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate security answers
      if (!securityAnswer1.trim()) {
        setError('Please answer the first security question');
        setIsLoading(false);
        return;
      }

      if (!securityAnswer2.trim()) {
        setError('Please answer the second security question');
        setIsLoading(false);
        return;
      }

      const response = await base44.auth.signup(
        email,
        password,
        name,
        phone,
        securityQuestion1,
        securityAnswer1,
        securityQuestion2,
        securityAnswer2
      );

      onSignupSuccess(response.user);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setSecurityQuestion1('What is your pet\'s name?');
    setSecurityAnswer1('');
    setSecurityQuestion2('What city were you born in?');
    setSecurityAnswer2('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? 'Create Account' : 'Security Questions'}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 ${
                    emailError ? 'border-red-500' : isCheckingEmail ? 'border-yellow-500' : ''
                  }`}
                />
                {isCheckingEmail && (
                  <div className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" />
                    Checking availability...
                  </div>
                )}
                {emailError && (
                  <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <XIcon size={16} />
                    {emailError}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 ${
                    phoneError ? 'border-red-500' : isCheckingPhone ? 'border-yellow-500' : isPhoneValid ? 'border-green-500' : ''
                  }`}
                />
                {isCheckingPhone && (
                  <div className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" />
                    Checking availability...
                  </div>
                )}
                {phoneError && (
                  <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <XIcon size={16} />
                    {phoneError}
                  </div>
                )}
                {isPhoneValid && !isCheckingPhone && (
                  <div className="mt-2 text-sm text-green-400 flex items-center gap-2">
                    <Check size={16} />
                    Phone number available
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && <PasswordStrengthMeter strength={passwordStrength} />}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className={`bg-slate-800 border-slate-700 text-white placeholder-slate-500 pr-10 ${
                      confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-500')
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${
                    passwordsMatch ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {passwordsMatch ? <Check size={16} /> : <XIcon size={16} />}
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !name.trim() || !isEmailValid || !isPasswordValid || !passwordsMatch || !isPhoneValid}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          ) : (
            /* Step 2: Security Questions */
            <form onSubmit={handleStep2Submit} className="space-y-4">
              {/* Security Question 1 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Security Question 1
                </label>
                <select
                  value={securityQuestion1}
                  onChange={(e) => setSecurityQuestion1(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option>What is your pet's name?</option>
                  <option>What city were you born in?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was the name of your first school?</option>
                  <option>What is your favorite book?</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Answer
                </label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer1}
                  onChange={(e) => setSecurityAnswer1(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              {/* Security Question 2 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Security Question 2
                </label>
                <select
                  value={securityQuestion2}
                  onChange={(e) => setSecurityQuestion2(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option>What city were you born in?</option>
                  <option>What is your pet's name?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was the name of your first school?</option>
                  <option>What is your favorite book?</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Answer
                </label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer2}
                  onChange={(e) => setSecurityAnswer2(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !securityAnswer1.trim() || !securityAnswer2.trim()}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
