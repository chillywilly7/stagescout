import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchHero from '@/components/search/SearchHero';
import TaskerGrid from '@/components/taskers/TaskerGrid';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, MessageCircle, Star, Zap, Clock, CreditCard } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const { data: featuredTaskers, isLoading } = useQuery({
    queryKey: ['featured-taskers'],
    queryFn: () => base44.entities.Tasker.list('-average_rating', 6),
    initialData: [],
  });

  const handleSearch = (zipCode, category) => {
    let url = createPageUrl('Search') + `?zip=${zipCode}`;
    if (category) {
      url += `&category=${category}`;
    }
    navigate(url);
  };

  const features = [
    {
      icon: Zap,
      title: 'Instant Booking',
      description: 'Book professionals in seconds. No back and forth, just results.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Star,
      title: 'Top-Rated Only',
      description: 'Every professional is vetted and reviewed by real customers.',
      gradient: 'from-red-500 to-pink-500',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Pay safely through our platform with buyer protection.',
      gradient: 'from-blue-500 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <SearchHero onSearch={handleSearch} />

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-6">
              WHY US
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Smarter</span> Way to Book
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Skip the hassle. Find and book amazing talent in minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group relative bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-800 hover:border-slate-700 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-24 px-6 bg-slate-900 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
          >
            <div>
              <span className="inline-block px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-6">
                TOP RATED
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Talent</span>
              </h2>
              <p className="text-xl text-slate-400">
                Handpicked professionals ready for your next event
              </p>
            </div>
            <a
              href={createPageUrl('Search')}
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-semibold transition-all hover:gap-3"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          <TaskerGrid taskers={featuredTaskers} isLoading={isLoading} />

          <div className="mt-10 text-center md:hidden">
            <a
              href={createPageUrl('Search')}
              className="inline-flex items-center gap-2 text-red-400 font-semibold"
            >
              View All Professionals
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/20 rounded-full blur-[150px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            READY TO
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              GET STARTED?
            </span>
          </h2>
          <p className="text-2xl text-slate-400 mb-12 font-light">
            Your perfect event is just a few clicks away
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-red-500/30 transition-all hover:scale-105"
          >
            Find Your Pro
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}

