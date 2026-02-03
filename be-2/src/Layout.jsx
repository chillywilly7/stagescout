import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authState } from '@/components/authHelper';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const [userType, setUserType] = React.useState('pro');

  React.useEffect(() => {
    setIsAuthenticated(authState.isAuthenticated());
    setUserType(authState.getUserType());
    const handleStorageChange = () => {
      setIsAuthenticated(authState.isAuthenticated());
      setUserType(authState.getUserType());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const guestNavLinks = [
    { name: 'Home', page: 'Home' },
    { name: 'Find StagePros', page: 'FindScouts' },
    { name: 'List Services', page: 'ScoutOnboarding' }
  ];

  const navLinks = isAuthenticated ? [
    { name: 'Home', page: 'Home' },
    { name: 'Find StagePros', page: 'FindScouts' }
  ] : guestNavLinks;


  return (
    <div className="min-h-screen bg-charcoal">
      {/* Custom CSS variables for the color palette */}
      <style>{`
        :root {
          --burnt-orange: #E85D04;
          --neon-teal: #00F5D4;
          --electric-purple: #9B5DE5;
          --warm-red: #F15BB5;
          --charcoal: #1A1A1A;
        }
        
        .bg-burnt-orange { background-color: var(--burnt-orange); }
        .bg-neon-teal { background-color: var(--neon-teal); }
        .bg-electric-purple { background-color: var(--electric-purple); }
        .bg-warm-red { background-color: var(--warm-red); }
        .bg-charcoal { background-color: var(--charcoal); }
        
        .text-burnt-orange { color: var(--burnt-orange); }
        .text-neon-teal { color: var(--neon-teal); }
        .text-electric-purple { color: var(--electric-purple); }
        .text-warm-red { color: var(--warm-red); }
        .text-charcoal { color: var(--charcoal); }
        
        .border-burnt-orange { border-color: var(--burnt-orange); }
        .border-neon-teal { border-color: var(--neon-teal); }
        .border-electric-purple { border-color: var(--electric-purple); }
        .border-warm-red { border-color: var(--warm-red); }
        
        .from-burnt-orange { --tw-gradient-from: var(--burnt-orange); }
        .to-burnt-orange { --tw-gradient-to: var(--burnt-orange); }
        .via-burnt-orange { --tw-gradient-stops: var(--tw-gradient-from), var(--burnt-orange), var(--tw-gradient-to); }
        
        .from-neon-teal { --tw-gradient-from: var(--neon-teal); }
        .to-neon-teal { --tw-gradient-to: var(--neon-teal); }
        
        .from-electric-purple { --tw-gradient-from: var(--electric-purple); }
        .to-electric-purple { --tw-gradient-to: var(--electric-purple); }
        
        .from-warm-red { --tw-gradient-from: var(--warm-red); }
        .to-warm-red { --tw-gradient-to: var(--warm-red); }
        
        .hover\\:bg-burnt-orange\\/90:hover { background-color: rgba(232, 93, 4, 0.9); }
        .hover\\:bg-neon-teal\\/90:hover { background-color: rgba(0, 245, 212, 0.9); }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--charcoal);
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        
        /* Selection color */
        ::selection {
          background-color: var(--burnt-orange);
          color: white;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                Stage<span className="text-burnt-orange">Pros</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
              <Link
                key={link.page}
                to={createPageUrl(link.page)} className="text-gray-400 text-base font-medium transition-colors hover:text-white">






                  {link.name}
                </Link>
              )}
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <Link to={createPageUrl(userType === 'customer' ? 'CustomerDashboard' : 'ProDashboard') + `?email=${encodeURIComponent(authState.getSession().email)}`}>
                  <Button className="bg-burnt-orange hover:bg-burnt-orange/90 text-white">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl('SigninChoice')}>
                  <Button className="bg-burnt-orange hover:bg-burnt-orange/90 text-white">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white">

              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-charcoal border-t border-white/10">

              <div className="container mx-auto px-4 py-4 space-y-3">
                {navLinks.map((link) =>
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-lg font-medium ${
                currentPageName === link.page ?
                'text-burnt-orange' :
                'text-gray-400'}`
                }>

                    {link.name}
                  </Link>
              )}
                {isAuthenticated ? (
                  <Link
                    to={createPageUrl(userType === 'customer' ? 'CustomerDashboard' : 'ProDashboard') + `?email=${encodeURIComponent(authState.getSession().email)}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full mt-4 bg-burnt-orange hover:bg-burnt-orange/90 text-white">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link
                    to={createPageUrl('SigninChoice')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full mt-4 bg-burnt-orange hover:bg-burnt-orange/90 text-white">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>);

}