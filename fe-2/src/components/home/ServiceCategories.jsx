import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Volume2, Disc3, Camera, Video, Lightbulb, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    id: 'audio_rental',
    icon: Volume2,
    name: 'Audio Rental',
    description: 'PA systems, monitors, backline gear for any venue size',
    color: 'from-neon-teal to-neon-teal/50',
    iconBg: 'bg-neon-teal/20',
    iconColor: 'text-neon-teal'
  },
  {
    id: 'dj',
    icon: Disc3,
    name: 'DJs',
    description: 'House, hip-hop, indie, electronic – every vibe covered',
    color: 'from-electric-purple to-electric-purple/50',
    iconBg: 'bg-electric-purple/20',
    iconColor: 'text-electric-purple'
  },
  {
    id: 'photography',
    icon: Camera,
    name: 'Photography',
    description: 'Event coverage, artist portraits, promo shoots',
    color: 'from-burnt-orange to-burnt-orange/50',
    iconBg: 'bg-burnt-orange/20',
    iconColor: 'text-burnt-orange'
  },
  {
    id: 'videography',
    icon: Video,
    name: 'Videography',
    description: 'Live streaming, recap videos, documentary crews',
    color: 'from-warm-red to-warm-red/50',
    iconBg: 'bg-warm-red/20',
    iconColor: 'text-warm-red'
  },
  {
    id: 'lighting',
    icon: Lightbulb,
    name: 'Lighting',
    description: 'Stage design, intelligent fixtures, atmospheric effects',
    color: 'from-yellow-500 to-yellow-500/50',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500'
  },
  {
    id: 'full_production',
    icon: Clapperboard,
    name: 'Full Production',
    description: 'End-to-end teams for turnkey event execution',
    color: 'from-pink-500 to-pink-500/50',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-500'
  }
];

export default function ServiceCategories() {
  return (
    <section className="py-24 bg-gradient-to-b from-charcoal via-black/50 to-charcoal relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-burnt-orange/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-neon-teal/20 rounded-full blur-[150px]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              What Do You Need?
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto font-medium">
              Fast access to every production service for showcases, brand activations, and official events
            </p>
          </motion.div>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={createPageUrl('FindScouts') + `?service=${service.id}`}>
                <div className="group relative p-8 rounded-3xl bg-white/10 border-2 border-white/20 hover:border-burnt-orange/60 hover:bg-white/15 transition-all duration-300 overflow-hidden backdrop-blur-md shadow-xl hover:shadow-2xl hover:scale-105">
                  {/* Gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${service.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color.replace('from-', 'from-').replace('to-', 'to-')} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
                  
                  <div className="relative">
                    <div className={`inline-flex p-4 rounded-2xl ${service.iconBg} mb-4 group-hover:scale-110 transition-transform`}>
                      <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-burnt-orange transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-300 text-base leading-relaxed">
                      {service.description}
                    </p>
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