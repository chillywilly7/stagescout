import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels = {
  dj: 'DJ',
  audio_rental: 'Audio',
  lighting: 'Lighting',
  photographer: 'Photo',
  live_music: 'Live Music',
};

const categoryGradients = {
  dj: 'from-purple-500 to-indigo-500',
  audio_rental: 'from-blue-500 to-cyan-500',
  lighting: 'from-yellow-500 to-orange-500',
  photographer: 'from-pink-500 to-rose-500',
  live_music: 'from-emerald-500 to-teal-500',
};

export default function TaskerCard({ tasker }) {
  return (
    <Link to={createPageUrl('TaskerProfile') + `?id=${tasker.id}`}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-slate-800/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all duration-500"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={tasker.profile_image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop'}
            alt={tasker.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`bg-gradient-to-r ${categoryGradients[tasker.service_category]} text-white border-0 shadow-lg px-3 py-1 text-xs font-bold`}>
              {categoryLabels[tasker.service_category]}
            </Badge>
          </div>

          {/* Verified Badge */}
          {tasker.is_verified && (
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Rating */}
          {tasker.average_rating > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-white">{tasker.average_rating?.toFixed(1)}</span>
              <span className="text-white/60 text-sm">({tasker.total_reviews})</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-white group-hover:text-red-400 transition-colors line-clamp-1">
              {tasker.name}
            </h3>
            <motion.div 
              className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors"
              whileHover={{ rotate: 45 }}
            >
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </motion.div>
          </div>
          
          <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">{tasker.bio || 'Professional event services'}</p>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" />
                {tasker.zip_code}
              </span>
              {tasker.years_experience > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  {tasker.years_experience}yr
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">${tasker.hourly_rate}</span>
              <span className="text-slate-500 text-sm">/hr</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

