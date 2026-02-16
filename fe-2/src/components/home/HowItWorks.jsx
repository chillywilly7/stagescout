import React from 'react';
import { Search, Calendar, MessageSquare, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Search & Filter',
    description: 'Find contractors by service type, date, budget, and experience level',
    color: 'text-neon-teal',
    borderColor: 'border-neon-teal/30'
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Check Availability',
    description: 'See real-time SXSW availability calendars for each contractor',
    color: 'text-electric-purple',
    borderColor: 'border-electric-purple/30'
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Request & Connect',
    description: 'Send booking requests directly – no middlemen, no delays',
    color: 'text-burnt-orange',
    borderColor: 'border-burnt-orange/30'
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Lock It In',
    description: 'Confirm details and get your SXSW production sorted',
    color: 'text-warm-red',
    borderColor: 'border-warm-red/30'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-burnt-orange/10 rounded-full blur-[100px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-electric-purple/10 rounded-full blur-[100px] -translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            How It Works
          </h2>
          <p className="text-gray-300 text-lg font-medium">
            From search to booked in minutes, not days
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative"
            >
              <div className={`p-6 rounded-2xl bg-white/5 border ${step.borderColor} h-full`}>
                <div className={`text-5xl font-black ${step.color} opacity-20 mb-4`}>
                  {step.number}
                </div>
                <div className={`inline-flex p-2 rounded-lg bg-white/5 mb-4`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
              
              {/* Connector line (hidden on last item) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-white/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}