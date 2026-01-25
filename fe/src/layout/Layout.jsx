import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import LoginModal from '@/components/LoginModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, Calendar, MessageCircle, LogOut, Sparkles } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setIsLoadingUser(false);
    };
    loadUser();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for login modal show event
    const handleShowLoginModal = () => {
      setLoginModalOpen(true);
    };
    window.addEventListener('showLoginModal', handleShowLoginModal);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('showLoginModal', handleShowLoginModal);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of logout response
      setUser(null);
      setMobileMenuOpen(false);
      // Redirect to home page after logout
      window.location.href = createPageUrl('Home');
    }
  };

  const isTransparentHeader = currentPageName === 'Home' && !scrolled;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparentHeader 
          ? 'bg-transparent' 
          : 'bg-slate-900/90 backdrop-blur-xl border-b border-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c55978cb7d68eea70c428/564dfa7a5_PHOTO-2025-08-01-23-58-27.jpg" 
              alt="Rent-A-Speaker"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to={createPageUrl('Search')}
              className="px-4 py-2 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Browse
            </Link>
            {/* Only show "Become a Pro" if user is not signed in or is a regular user (not Pro) */}
            {!user || !user.is_pro ? (
              <Link
                to={createPageUrl('BecomeTasker')}
                className="px-4 py-2 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Become a Pro
              </Link>
            ) : null}
            
            {user ? (
              <>
                <Link
                  to={createPageUrl('MyBookings')}
                  className="px-4 py-2 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  Bookings
                </Link>
                <Link
                  to={createPageUrl('Messages')}
                  className="px-4 py-2 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  Messages
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="ml-2 rounded-xl w-12 h-12 p-0 bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    >
                      <User className="w-5 h-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700 text-white">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="font-semibold text-white">{user.full_name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild className="focus:bg-slate-800">
                      <Link to={createPageUrl('MyBookings')} className="flex items-center gap-3 py-3">
                        <Calendar className="w-4 h-4 text-red-400" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-slate-800">
                      <Link to={createPageUrl('Messages')} className="flex items-center gap-3 py-3">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-slate-800">
                      <Link to={createPageUrl('MyServices')} className="flex items-center gap-3 py-3">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        My Services
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 focus:text-red-400 focus:bg-slate-800 py-3"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              !isLoadingUser && (
                <Button
                  onClick={() => setLoginModalOpen(true)}
                  className="ml-2 px-6 py-2 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25"
                >
                  Sign In
                </Button>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-6 py-6 space-y-2">
            <Link
              to={createPageUrl('Search')}
              className="block py-3 px-4 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            {/* Only show "Become a Pro" if user is not signed in or is a regular user (not Pro) */}
            {!user || !user.is_pro ? (
              <Link
                to={createPageUrl('BecomeTasker')}
                className="block py-3 px-4 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Become a Pro
              </Link>
            ) : null}
            {user ? (
              <>
                <Link
                  to={createPageUrl('MyBookings')}
                  className="block py-3 px-4 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  to={createPageUrl('Messages')}
                  className="block py-3 px-4 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to={createPageUrl('MyServices')}
                  className="block py-3 px-4 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Services
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="block w-full py-3 px-4 text-left text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-colors mt-4"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setLoginModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full h-14 mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-lg font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={currentPageName === 'Home' ? '' : 'pt-20'}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c55978cb7d68eea70c428/564dfa7a5_PHOTO-2025-08-01-23-58-27.jpg" 
                alt="Rent-A-Speaker"
                className="h-12 w-auto"
              />
            </div>
            <nav className="flex flex-wrap justify-center gap-8">
              <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-white transition-colors font-medium">Home</Link>
              <Link to={createPageUrl('Search')} className="text-slate-400 hover:text-white transition-colors font-medium">Browse</Link>
              <Link to={createPageUrl('BecomeTasker')} className="text-slate-400 hover:text-white transition-colors font-medium">Become a Pro</Link>
              <span className="text-slate-400 hover:text-white transition-colors cursor-pointer font-medium">Support</span>
            </nav>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} Rent-A-Speaker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
