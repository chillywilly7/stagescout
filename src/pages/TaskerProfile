import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, MapPin, Clock, CheckCircle, Calendar, 
  DollarSign, Award, Camera, ArrowLeft, Share2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BookingForm from '@/components/booking/BookingForm';
import ReviewList from '@/components/reviews/ReviewList';

const categoryLabels = {
  dj: 'DJ Services',
  audio_rental: 'Audio Rental',
  lighting: 'Lighting',
  photographer: 'Photography',
  live_music: 'Live Music',
};

export default function TaskerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskerId = urlParams.get('id');

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const { data: tasker, isLoading: isLoadingTasker } = useQuery({
    queryKey: ['tasker', taskerId],
    queryFn: async () => {
      const taskers = await base44.entities.Tasker.filter({ id: taskerId });
      return taskers[0];
    },
    enabled: !!taskerId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', taskerId],
    queryFn: () => base44.entities.Review.filter({ tasker_id: taskerId }, '-created_date'),
    enabled: !!taskerId,
    initialData: [],
  });

  const handleBookingSuccess = (booking) => {
    setShowBookingForm(false);
    window.location.href = createPageUrl('Messages') + `?booking=${booking.id}`;
  };

  if (isLoadingTasker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Professional not found</h2>
          <Link to={createPageUrl('Search')} className="text-violet-600 font-medium">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative h-80 md:h-96 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {tasker.portfolio_images?.[0] && (
          <img
            src={tasker.portfolio_images[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-between py-6">
          <div className="flex items-center justify-between">
            <Link
              to={createPageUrl('Search')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={tasker.profile_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'}
                    alt={tasker.name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-3 mb-3">
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{tasker.name}</h1>
                      {tasker.is_verified && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 border-0 mb-4">
                      {categoryLabels[tasker.service_category]}
                    </Badge>
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-900">
                          {tasker.average_rating?.toFixed(1) || 'New'}
                        </span>
                        <span>({tasker.total_reviews || 0} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-5 h-5" />
                        {tasker.zip_code}
                      </div>
                      {tasker.years_experience && (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-5 h-5" />
                          {tasker.years_experience}+ years
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start bg-white border border-slate-200 rounded-xl p-1 h-auto">
                  <TabsTrigger value="about" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    About
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                    Reviews ({reviews?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <Card className="mt-4 p-6">
                  <TabsContent value="about" className="m-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
                    <p className="text-slate-600 leading-relaxed mb-8">
                      {tasker.bio || 'Experienced professional dedicated to making your event unforgettable. Contact me to discuss your specific needs and requirements.'}
                    </p>

                    {tasker.equipment_list?.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Equipment</h3>
                        <div className="flex flex-wrap gap-2">
                          {tasker.equipment_list.map((item, i) => (
                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="portfolio" className="m-0">
                    {tasker.portfolio_images?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {tasker.portfolio_images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden">
                            <img
                              src={img}
                              alt={`Portfolio ${i + 1}`}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-500">
                        <Camera className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No portfolio images yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="m-0">
                    <ReviewList reviews={reviews} />
                  </TabsContent>
                </Card>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 sticky top-24">
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-slate-900">${tasker.hourly_rate}</span>
                  <span className="text-slate-500">/hour</span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Availability</p>
                      <p className="font-medium text-slate-900">Flexible scheduling</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Service Area</p>
                      <p className="font-medium text-slate-900">
                        {tasker.service_radius_miles || 25} miles from {tasker.zip_code}
                      </p>
                    </div>
                  </div>
                </div>

                {user ? (
                  <Button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-violet-500/25"
                  >
                    Book Now
                  </Button>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-violet-500/25"
                  >
                    Sign In to Book
                  </Button>
                )}

                <p className="text-center text-sm text-slate-500 mt-4">
                  No payment required until service is confirmed
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {user && tasker && (
        <BookingForm
          tasker={tasker}
          isOpen={showBookingForm}
          onClose={() => setShowBookingForm(false)}
          onSuccess={handleBookingSuccess}
          user={user}
        />
      )}
    </div>
  );
}