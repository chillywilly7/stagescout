import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICE_LABELS = {
  audio_rental: 'Audio Rental',
  dj: 'DJ',
  photography: 'Photography',
  videography: 'Videography',
  lighting: 'Lighting',
  full_production: 'Full Production'
};

const LOCATION_LABELS = {
  downtown: 'Downtown',
  east_austin: 'East Austin',
  red_river: 'Red River',
  south_austin: 'South Austin',
  north_austin: 'North Austin',
  other: 'Austin'
};

export default function FeaturedScouts({ scouts }) {
  const featured = scouts?.slice(0, 4) || [];
  
  if (featured.length === 0) return null;
  
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Featured Talent
            </h2>
            <p className="text-gray-300 text-lg font-medium">
              Vetted Austin pros ready to work
            </p>
          </div>
          <Link to={createPageUrl('FindScouts')}>
            <Button variant="ghost" className="text-burnt-orange hover:text-burnt-orange/80 hover:bg-burnt-orange/10">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {/* StagePros grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((scout, idx) => (
            <motion.div
              key={scout.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={createPageUrl('ScoutProfile') + `?id=${scout.id}`}>
                <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-burnt-orange/50 transition-all duration-300 hover:bg-white/[0.07]">
                  {/* Image */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={scout.profile_image || `https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop`}
                      alt={scout.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {scout.is_austin_based && (
                        <Badge className="bg-neon-teal/90 text-black text-xs font-semibold">
                          <MapPin className="w-3 h-3 mr-1" />
                          Austin
                        </Badge>
                      )}
                      {scout.experience_level === 'sxsw_veteran' && (
                        <Badge className="bg-burnt-orange/90 text-white text-xs font-semibold">
                          <Star className="w-3 h-3 mr-1" />
                          SXSW Vet
                        </Badge>
                      )}
                    </div>
                    
                    {scout.available_last_minute && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-electric-purple/90 text-white text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Last Minute OK
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-burnt-orange transition-colors">
                      {scout.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {scout.services?.slice(0, 3).map(service => (
                        <Badge 
                          key={service}
                          variant="outline" 
                          className="text-xs border-white/20 text-gray-300"
                        >
                          {SERVICE_LABELS[service]}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {LOCATION_LABELS[scout.location]}
                      </span>
                      {scout.budget_min && (
                        <span className="text-neon-teal font-medium">
                          From ${scout.budget_min}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}