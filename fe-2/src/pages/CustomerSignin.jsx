import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerSignin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
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
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in to manage your bookings
            </p>
          </div>

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

                <p className="text-center text-gray-400 text-sm mt-4">
                  Don't have an account?{' '}
                  <Link 
                    to={createPageUrl('CustomerSignup')} 
                    className="text-burnt-orange hover:text-burnt-orange/80 font-semibold"
                  >
                    Sign Up
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

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