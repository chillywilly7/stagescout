import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Zap, Music, Camera, Lightbulb, Mic2, Speaker } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { id: 'dj', label: 'DJs', icon: Music },
  { id: 'audio_rental', label: 'Audio', icon: Speaker },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'photographer', label: 'Photo', icon: Camera },
  { id: 'live_music', label: 'Live Music', icon: Mic2 },
];

export default function SearchHero({ onSearch }) {
  const [zipCode, setZipCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSearch = () => {
    if (zipCode) {
      onSearch(zipCode, selectedCategory);
    }
  };

  return (
    <div className="relative min-h-[100vh] bg-black flex items-center justify-center overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-red-900/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-8 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-4 h-4" />
            500+ Professionals • Instant Booking
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight">
            BOOK THE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              BEST TALENT
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
            DJs • Audio • Lighting • Photography • Live Music
          </p>
        </motion.div>

        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {categories.map((cat, index) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border-2 transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-red-500/50 hover:scale-105'
              }`}
            >
              <cat.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${selectedCategory === cat.id ? 'text-white' : 'text-red-400'}`} />
              <span className="font-semibold">{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-3 border border-white/10 shadow-2xl shadow-black/50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-red-400" />
                <Input
                  type="text"
                  placeholder="Enter your zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-16 pl-14 pr-4 bg-slate-900/80 border-2 border-slate-700 text-white placeholder:text-slate-500 rounded-2xl text-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-16 px-10 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-2xl text-xl font-bold shadow-xl shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-red-500/50"
              >
                <Search className="w-6 h-6 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 flex flex-wrap justify-center gap-10 text-slate-500"
        >
          {[
            { label: 'Verified Pros', icon: '✓' },
            { label: 'Secure Booking', icon: '🔒' },
            { label: 'Best Prices', icon: '💰' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-medium">
              <span className="text-lg">{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  );
}

