import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Zap, Clock, ChevronRight, Shield, CheckCircle } from 'lucide-react';
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

const EXP_LABELS = {
  local_shows: 'Local Shows',
  touring: 'Touring Experience',
  sxsw_veteran: 'SXSW Veteran'
};

export default function ScoutCard({ scout, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-burnt-orange/50 transition-all duration-300 hover:bg-white/[0.07]">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <Link to={createPageUrl('ScoutProfile') + `?id=${scout.id}`} className="sm:w-48 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
            <img
              src={scout.profile_image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=400&fit=crop'}
              alt={scout.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-charcoal/50 sm:bg-gradient-to-t" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {scout.is_verified && (
                <Badge className="bg-emerald-600 text-white text-xs font-bold shadow-lg">
                  <div className="relative w-3 h-3 mr-1">
                    <Shield className="w-3 h-3 fill-current absolute inset-0" />
                    <CheckCircle className="w-2 h-2 absolute inset-0 m-auto" />
                  </div>
                  VERIFIED
                </Badge>
              )}
              {scout.is_austin_based && (
                <Badge className="bg-gray-700 text-white text-xs font-semibold">
                  <MapPin className="w-3 h-3 mr-1" />
                  Austin
                </Badge>
              )}
              {scout.experience_level === 'sxsw_veteran' && (
                <Badge className="bg-gray-700 text-white text-xs font-semibold">
                  <Star className="w-3 h-3 mr-1" />
                  SXSW Vet
                </Badge>
              )}
            </div>
          </Link>
          
          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link to={createPageUrl('ScoutProfile') + `?id=${scout.id}`}>
                  <h3 className="text-xl font-bold text-white group-hover:text-burnt-orange transition-colors flex items-center gap-2 cursor-pointer">
                    {scout.name}
                  {scout.is_verified && (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                      <div className="relative w-4 h-4">
                        <Shield className="w-4 h-4 text-white fill-current absolute inset-0" />
                        <CheckCircle className="w-2.5 h-2.5 text-white absolute inset-0 m-auto" />
                      </div>
                    </div>
                  )}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span>{LOCATION_LABELS[scout.location]}</span>
                  {scout.sxsw_years > 0 && (
                    <span className="text-burnt-orange">
                      {scout.sxsw_years} SXSW{scout.sxsw_years > 1 ? 's' : ''}
                    </span>
                  )}
                  {scout.rating > 0 && (
                    <span className="flex items-center text-yellow-500">
                      <Star className="w-3 h-3 mr-0.5 fill-current" />
                      {scout.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {scout.is_verified && (
                  <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Business verified • Insured • Background checked</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {scout.available_last_minute && (
                  <Badge className="bg-electric-purple/20 text-electric-purple border-electric-purple/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Last Min
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Services */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {scout.services?.map(service => (
                <Badge 
                  key={service}
                  variant="outline" 
                  className="text-xs border-white/20 text-gray-300"
                >
                  {SERVICE_LABELS[service]}
                </Badge>
              ))}
            </div>
            
            {/* Gear highlights */}
            {scout.gear_highlights?.length > 0 && (
              <p className="text-sm text-gray-400 mb-4 line-clamp-1">
                <span className="text-gray-500">Gear:</span> {scout.gear_highlights.slice(0, 3).join(' • ')}
              </p>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-4">
                {scout.budget_min && (
                  <span className="text-neon-teal font-semibold">
                    From ${scout.budget_min}
                  </span>
                )}
                {scout.turnaround_days && (
                  <span className="text-sm text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {scout.turnaround_days}d turnaround
                  </span>
                )}
              </div>
              
              <Link to={createPageUrl('ScoutProfile') + `?id=${scout.id}`}>
                <Button 
                  size="sm"
                  className="bg-burnt-orange/20 text-burnt-orange hover:bg-burnt-orange hover:text-white transition-colors"
                >
                  View Profile
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}