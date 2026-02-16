import React from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '@/components/home/HeroSection';
import ServiceCategories from '@/components/home/ServiceCategories';
import FeaturedScouts from '@/components/home/FeaturedScouts';
import HowItWorks from '@/components/home/HowItWorks';
import BookingWizard from '@/components/booking/BookingWizard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: scouts = [] } = useQuery({
    queryKey: ['scouts-featured'],
    queryFn: () => stagepro.entities.Scout.filter({ is_verified: true }, '-sxsw_years', 8)
  });

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <ServiceCategories />
      
      {/* Quick Booking Wizard Section */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-electric-purple/10 rounded-full blur-[150px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Quick Search
              </h2>
              <p className="text-gray-300 text-lg font-medium">
                Find available StagePros in 4 quick steps
              </p>
            </div>
            <BookingWizard />
          </div>
        </div>
      </section>
      
      <FeaturedScouts scouts={scouts} />
      
      <HowItWorks />
      

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/20 via-black/50 to-electric-purple/20" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Are You a Production Pro?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Get in front of venues, bookers, and brands looking for exactly what you do.
            </p>
            <Link to={createPageUrl('ScoutOnboarding')}>
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-xl group shadow-xl"
              >
                List Your Services
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-black text-white mb-2">
                Stage<span className="text-burnt-orange">Pros</span>
              </div>
              <p className="text-gray-500 text-sm">
                Austin's production talent marketplace
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link to={createPageUrl('FindScouts')} className="hover:text-white transition-colors">
                Find Talent
              </Link>
              <Link to={createPageUrl('ScoutOnboarding')} className="hover:text-white transition-colors">
                List Services
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}