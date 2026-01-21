import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, MapPin, Clock, DollarSign, MessageCircle, 
  Star, ArrowLeft, Loader2, User
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
      setIsLoadingUser(false);
    };
    loadUser();
  }, []);

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: existingReviews } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user.email }),
    enabled: !!user,
    initialData: [],
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => base44.entities.Booking.update(bookingId, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['my-bookings']),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ booking, rating, comment }) => {
      await base44.entities.Review.create({
        tasker_id: booking.tasker_id,
        booking_id: booking.id,
        reviewer_email: user.email,
        reviewer_name: user.full_name,
        rating,
        comment,
        event_type: booking.event_type,
      });
      
      // Update tasker's average rating
      const taskerReviews = await base44.entities.Review.filter({ tasker_id: booking.tasker_id });
      const avgRating = taskerReviews.reduce((sum, r) => sum + r.rating, 0) / taskerReviews.length;
      await base44.entities.Tasker.update(booking.tasker_id, {
        average_rating: avgRating,
        total_reviews: taskerReviews.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-reviews']);
      setReviewModal({ open: false, booking: null });
      setReviewData({ rating: 5, comment: '' });
    },
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const hasReviewed = (bookingId) => existingReviews.some(r => r.booking_id === bookingId);

  const getFilteredBookings = (status) => {
    if (status === 'all') return bookings;
    if (status === 'active') return bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
    return bookings.filter(b => b.status === status);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-600 mt-1">Track and manage your event bookings</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start bg-white border border-slate-200 rounded-xl p-1 h-auto mb-6">
            <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Cancelled
            </TabsTrigger>
          </TabsList>

          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {isLoadingBookings ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
              ) : getFilteredBookings(tab).length === 0 ? (
                <Card className="p-10 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings found</h3>
                  <p className="text-slate-500">
                    {tab === 'all' ? 'Book a service to get started' : `You have no ${tab} bookings`}
                  </p>
                </Card>
              ) : (
                getFilteredBookings(tab).map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                              <User className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-slate-900 text-lg">
                                  {booking.tasker_name}
                                </h3>
                                <Badge className={`${statusColors[booking.status]} border`}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <p className="text-slate-600 mb-3">
                                {booking.event_type || 'Event booking'}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {booking.event_date ? format(new Date(booking.event_date), 'MMM d, yyyy') : 'TBD'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  {booking.start_time} - {booking.end_time}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {booking.event_zip_code}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4" />
                                  ${booking.estimated_total?.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link to={createPageUrl('Messages') + `?booking=${booking.id}`}>
                            <Button variant="outline" size="sm" className="rounded-lg">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          </Link>
                          
                          {booking.status === 'completed' && !hasReviewed(booking.id) && (
                            <Button
                              size="sm"
                              className="rounded-lg bg-amber-500 hover:bg-amber-600"
                              onClick={() => setReviewModal({ open: true, booking })}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Leave Review
                            </Button>
                          )}

                          {booking.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cancelMutation.mutate(booking.id)}
                              disabled={cancelMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={(open) => setReviewModal({ ...reviewModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewData.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Your Review</label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <Button
              onClick={() => reviewMutation.mutate({ booking: reviewModal.booking, ...reviewData })}
              disabled={reviewMutation.isPending}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

