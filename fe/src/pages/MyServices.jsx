import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Plus, Star, MapPin, DollarSign, ArrowLeft, 
  Loader2, Edit, Eye, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels = {
  dj: 'DJ Services',
  audio_rental: 'Audio Rental',
  lighting: 'Lighting',
  photographer: 'Photography',
  live_music: 'Live Music',
};

const categoryIcons = {
  dj: '🎧',
  audio_rental: '🔊',
  lighting: '💡',
  photographer: '📸',
  live_music: '🎸',
};

export default function MyServices() {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin(createPageUrl('MyServices'));
      }
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const { data: myServices, isLoading } = useQuery({
    queryKey: ['my-services', user?.email],
    queryFn: () => base44.entities.Tasker.filter({ email: user.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: myBookingsAsTasker } = useQuery({
    queryKey: ['tasker-bookings', myServices],
    queryFn: async () => {
      const allBookings = [];
      for (const service of myServices) {
        const bookings = await base44.entities.Booking.filter({ tasker_id: service.id });
        allBookings.push(...bookings);
      }
      return allBookings;
    },
    enabled: myServices.length > 0,
    initialData: [],
  });

  if (isLoadingUser || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const pendingBookings = myBookingsAsTasker.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Services</h1>
              <p className="text-slate-600 mt-1">Manage your service listings</p>
            </div>
            <Link to={createPageUrl('BecomeTasker')}>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {myServices.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{myServices.length}</p>
              <p className="text-sm text-slate-500">Active Services</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{myBookingsAsTasker.length}</p>
              <p className="text-sm text-slate-500">Total Bookings</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{pendingBookings}</p>
              <p className="text-sm text-slate-500">Pending Requests</p>
            </Card>
          </div>
        )}

        {/* Services List */}
        {myServices.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No services yet</h3>
            <p className="text-slate-600 mb-6">Start offering your services on Rent-A-Speaker</p>
            <Link to={createPageUrl('BecomeTasker')}>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {myServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex gap-6">
                    <img
                      src={service.profile_image || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&h=200&fit=crop'}
                      alt={service.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{categoryIcons[service.service_category]}</span>
                            <Badge className="bg-red-100 text-red-700 border-0">
                              {categoryLabels[service.service_category]}
                            </Badge>
                            {service.is_verified && (
                              <Badge className="bg-green-100 text-green-700 border-0">Verified</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Link to={createPageUrl('TaskerProfile') + `?id=${service.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {service.average_rating?.toFixed(1) || 'New'} ({service.total_reviews || 0} reviews)
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {service.zip_code}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${service.hourly_rate}/hr
                          {service.daily_rate && ` • $${service.daily_rate}/day`}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pending Bookings Section */}
        {pendingBookings > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending Booking Requests</h2>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{pendingBookings} pending request{pendingBookings > 1 ? 's' : ''}</p>
                    <p className="text-sm text-slate-500">Review and respond to booking requests</p>
                  </div>
                </div>
                <Link to={createPageUrl('Messages')}>
                  <Button variant="outline">View Messages</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

