import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Music2, Camera, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      {/* SXSW Illustration Background */}
      <div className="absolute inset-0">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69758739094dbadd0fd499c0/e6c21d85f_6967bad8aadf257e42332660_Screenshot2026-01-14104814.png"
          alt="Austin SXSW Background"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'crisp-edges' }} />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neon-teal/20 border-2 border-neon-teal/50 backdrop-blur-sm mb-8">

            <span className="w-2.5 h-2.5 rounded-full bg-neon-teal animate-pulse" />
            <span className="text-sm font-bold text-neon-teal tracking-wider">LIVE • AUSTIN, TX</span>
          </motion.div>
          
          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">

            <span className="text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">BOOK</span>
            <br />
            <span className="bg-gradient-to-r text-slate-50 from-burnt-orange via-warm-red to-neon-teal drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">STAGE

            </span>
            <br />
            <span className="text-orange-600 drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">PROS</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl sm:text-3xl mb-10 tracking-wide font-bold">

            <span className="text-neon-teal drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">Audio.</span>{' '}
            <span className="text-fuchsia-500 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">DJs.</span>{' '}
            <span className="bg-transparent text-sky-400 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">Visuals.</span>{' '}
            <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">Lighting.</span>{' '}
            <span className="text-orange-600 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">Covered.</span>
          </motion.p>
          
          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4">

            <Link to={createPageUrl('FindScouts')}>
              <Button
                size="lg"
                variant="outline" className="bg-orange-600 text-slate-50 px-10 py-7 text-lg font-bold rounded-2xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm h-10 border-2 border-burnt-orange hover:bg-burnt-orange hover:text-white group">


                Find Stage Pros
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={createPageUrl('ScoutOnboarding')}>
              <Button
                size="lg"
                className="bg-white/10 border-2 border-white/50 text-white hover:bg-white/20 text-lg px-10 py-7 rounded-2xl backdrop-blur-md font-bold">

                List Your Services
              </Button>
            </Link>
          </motion.div>
          
        </div>
      </div>
    </section>);

}