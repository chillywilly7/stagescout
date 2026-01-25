import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTestUsers, setShowTestUsers] = useState(false);
  const [testUsers, setTestUsers] = useState([]);

  const fetchTestUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/test-users');
      if (response.ok) {
        const data = await response.json();
        setTestUsers(data.test_users);
        setShowTestUsers(true);
      }
    } catch (error) {
      console.error('Error fetching test users:', error);
    }
  };

  const handleTestUserClick = (testUser) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
    setShowTestUsers(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await base44.auth.login(email, password);
      onLoginSuccess(response.user);
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Sign In</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Test Users Section */}
        <div className="px-6 pb-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (!showTestUsers) {
                fetchTestUsers();
              } else {
                setShowTestUsers(false);
              }
            }}
            className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors py-2"
          >
            {showTestUsers ? 'Hide' : 'Show'} Test Users
          </button>

          {showTestUsers && testUsers.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {testUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleTestUserClick(user)}
                  className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm border border-slate-700 hover:border-slate-600"
                >
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-slate-400 text-xs">{user.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
