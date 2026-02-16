import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, MapPin, Star, Zap, Clock, DollarSign, 
  Calendar, CheckCircle, ChevronRight, Shield
} from 'lucide-react';
import { format } from 'date-fns';
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
  downtown: 'Downtown Austin',
  east_austin: 'East Austin',
  red_river: 'Red River District',
  south_austin: 'South Austin',
  north_austin: 'North Austin',
  other: 'Austin Area'
};

const VENUE_LABELS = {
  indoor: 'Indoor Venues',
  outdoor: 'Outdoor Events',
  popup: 'Pop-ups',
  showcase: 'Showcases',
  brand_activation: 'Brand Activations'
};

const EXP_LABELS = {
  local_shows: 'Local Shows',
  touring: 'Touring Experience',
  sxsw_veteran: 'SXSW Veteran'
};

export default function ScoutProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const scoutId = urlParams.get('id');

  const { data: scout, isLoading } = useQuery({
    queryKey: ['scout', scoutId],
    queryFn: async () => {
      const results = await stagepro.entities.Scout.filter({ id: scoutId });
      return results[0];
    },
    enabled: !!scoutId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-32 bg-white/10 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-2xl bg-white/10" />
              <Skeleton className="h-8 w-64 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </div>
            <div>
              <Skeleton className="h-64 rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scout) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">StagePro not found</h2>
          <Link to={createPageUrl('FindScouts')}>
            <Button variant="outline" className="border-white/20 text-white">
              Back to Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Link to={createPageUrl('FindScouts')}>
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video rounded-2xl overflow-hidden"
            >
              <img
                src={scout.profile_image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=675&fit=crop'}
                alt={scout.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {scout.is_verified && (
                  <Badge className="bg-emerald-600 text-white font-bold shadow-lg border border-emerald-700/50 backdrop-blur-sm">
                    <div className="relative w-4 h-4 mr-1">
                      <Shield className="w-4 h-4 fill-current absolute inset-0" />
                      <CheckCircle className="w-2.5 h-2.5 absolute inset-0 m-auto" />
                    </div>
                    VERIFIED
                  </Badge>
                )}
                {scout.is_austin_based && (
                  <Badge className="bg-neon-teal text-black font-semibold shadow-lg border border-black/20 backdrop-blur-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Austin-Based
                  </Badge>
                )}
                {scout.experience_level === 'sxsw_veteran' && (
                  <Badge className="bg-burnt-orange text-white font-semibold shadow-lg border border-orange-800/50 backdrop-blur-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    <Star className="w-3 h-3 mr-1" />
                    SXSW Veteran
                  </Badge>
                )}
                {scout.available_last_minute && (
                  <Badge className="bg-electric-purple text-white font-semibold shadow-lg border border-purple-800/50 backdrop-blur-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    <Zap className="w-3 h-3 mr-1" />
                    Last-Minute Available
                  </Badge>
                )}
              </div>
              
              {/* Name overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center gap-3">
                  {scout.name}
                  {scout.is_verified && (
                    <div className="group/verified relative inline-block">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg cursor-pointer group-hover/verified:scale-110 transition-transform">
                        <div className="relative w-5 h-5">
                          <Shield className="w-5 h-5 text-white fill-current absolute inset-0" />
                          <CheckCircle className="w-3 h-3 text-white absolute inset-0 m-auto" />
                        </div>
                      </div>
                      <div className="absolute invisible group-hover/verified:visible opacity-0 group-hover/verified:opacity-100 transition-all duration-200 z-50 bottom-full left-0 mb-3 w-72 p-5 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-emerald-600/50 rounded-xl shadow-2xl whitespace-normal">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <div className="relative w-5 h-5">
                              <Shield className="w-5 h-5 text-white fill-current absolute inset-0" />
                              <CheckCircle className="w-3 h-3 text-white absolute inset-0 m-auto" />
                            </div>
                          </div>
                          <p className="text-base font-bold text-emerald-500">Verified Professional</p>
                        </div>
                        <div className="space-y-2.5 text-sm text-gray-200">
                          <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Business identity verified</span>
                          </div>
                          <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Liability insurance confirmed</span>
                          </div>
                          <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Background check completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </h1>
                <p className="text-gray-300">
                  {LOCATION_LABELS[scout.location]}
                  {scout.sxsw_years > 0 && (
                    <span className="text-burnt-orange ml-3">
                      • {scout.sxsw_years} SXSW{scout.sxsw_years > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-3">
                {scout.services?.map(service => (
                  <Badge 
                    key={service}
                    className="bg-burnt-orange/20 text-burnt-orange border-burnt-orange/30 text-sm py-2 px-4"
                  >
                    {SERVICE_LABELS[service]}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Bio */}
            {scout.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                <p className="text-gray-300 leading-relaxed">{scout.bio}</p>
              </motion.div>
            )}

            {/* Gear & Specialties */}
            {scout.gear_highlights?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Gear & Specialties</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {scout.gear_highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-neon-teal flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Venue Compatibility */}
            {scout.venue_types?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Venue Compatibility</h2>
                <div className="flex flex-wrap gap-2">
                  {scout.venue_types.map(venue => (
                    <Badge 
                      key={venue}
                      variant="outline"
                      className="border-white/20 text-gray-300"
                    >
                      {VENUE_LABELS[venue]}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Portfolio */}
            {scout.portfolio_images?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Past Work</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scout.portfolio_images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Info</h3>
              
              <div className="space-y-4 mb-6">
                {scout.budget_min && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Starting at
                    </span>
                    <span className="text-neon-teal font-bold text-lg">
                      ${scout.budget_min}
                    </span>
                  </div>
                )}
                
                {scout.turnaround_days && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Turnaround
                    </span>
                    <span className="text-white">
                      {scout.turnaround_days} days
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Experience
                  </span>
                  <span className="text-white">
                    {EXP_LABELS[scout.experience_level]}
                  </span>
                </div>
              </div>

              <Link to={createPageUrl('ScoutAvailability') + `?id=${scout.id}`}>
                <Button 
                  className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white text-lg py-6"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View Availability
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Availability Preview */}
            {scout.availability_dates?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-neon-teal" />
                  Available Dates
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scout.availability_dates.slice(0, 10).map((date, idx) => (
                    <Badge 
                      key={idx}
                      className="bg-neon-teal/20 text-neon-teal border-neon-teal/30"
                    >
                      {format(new Date(date), 'MMM d')}
                    </Badge>
                  ))}
                  {scout.availability_dates.length > 10 && (
                    <Badge className="bg-white/5 text-gray-400">
                      +{scout.availability_dates.length - 10} more
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}

            {/* Style Tags */}
            {scout.style_tags?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Style</h3>
                <div className="flex flex-wrap gap-2">
                  {scout.style_tags.map((tag, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className="border-electric-purple/30 text-electric-purple"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}