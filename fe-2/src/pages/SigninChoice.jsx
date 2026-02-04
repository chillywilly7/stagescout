import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Briefcase, ArrowRight, Music, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SigninChoice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal via-charcoal to-gray-900 text-white py-20 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-burnt-orange/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-teal/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">

          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Welcome to <span className="text-burnt-orange">StagePros</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose how you'd like to sign in
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Booker Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>

            <Link to={createPageUrl('CustomerSignin')} className="block h-full">
              <Card className="h-full bg-gradient-to-br from-burnt-orange/10 to-burnt-orange/5 border-burnt-orange/20 hover:border-burnt-orange/40 transition-all duration-300 hover:shadow-xl hover:shadow-burnt-orange/10 group cursor-pointer">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-burnt-orange/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-10 h-10 text-burnt-orange" />
                  </div>
                  <CardTitle className="text-slate-50 mb-3 text-3xl font-bold tracking-tight">Booker</CardTitle>
                  <CardDescription className="text-gray-300 text-base">
                    Find and book talented production professionals for your events
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Calendar className="w-5 h-5 text-burnt-orange" />
                      <span>Browse available talent</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <Music className="w-5 h-5 text-burnt-orange" />
                      <span>Manage your bookings</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 bg-burnt-orange hover:bg-burnt-orange/90 text-white text-lg font-semibold group-hover:gap-4 transition-all duration-300">
                    Sign in as Booker
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* StagePro Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>

            <Link to={createPageUrl('ProSignin')} className="block h-full">
              <Card className="h-full bg-gradient-to-br from-electric-purple/10 to-electric-purple/5 border-electric-purple/20 hover:border-electric-purple/40 transition-all duration-300 hover:shadow-xl hover:shadow-electric-purple/10 group cursor-pointer">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-electric-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-10 h-10 text-electric-purple" />
                  </div>
                  <CardTitle className="text-slate-50 mb-3 text-3xl font-bold tracking-tight">StagePro</CardTitle>
                  <CardDescription className="text-gray-300 text-base">
                    Showcase your skills and connect with clients who need your expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Briefcase className="w-5 h-5 text-electric-purple" />
                      <span>Manage your profile</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <Calendar className="w-5 h-5 text-electric-purple" />
                      <span>Track your bookings</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 bg-electric-purple hover:bg-electric-purple/90 text-white text-lg font-semibold group-hover:gap-4 transition-all duration-300">
                    Sign in as StagePro
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>);

}