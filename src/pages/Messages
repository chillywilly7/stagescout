import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatWindow from '@/components/chat/ChatWindow';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Messages() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingIdFromUrl = urlParams.get('booking');

  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [taskerMap, setTaskerMap] = useState({});

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
    queryFn: async () => {
      // Get bookings where user is client or tasker (via email)
      const clientBookings = await base44.entities.Booking.filter({ client_email: user.email }, '-created_date');
      
      // Also check if user is a tasker
      const taskers = await base44.entities.Tasker.filter({ email: user.email });
      let taskerBookings = [];
      if (taskers.length > 0) {
        taskerBookings = await base44.entities.Booking.filter({ tasker_id: taskers[0].id }, '-created_date');
      }
      
      // Combine and dedupe
      const allBookings = [...clientBookings, ...taskerBookings];
      const uniqueBookings = allBookings.filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
      
      // Load tasker info for each booking
      const taskerIds = [...new Set(uniqueBookings.map(b => b.tasker_id))];
      const taskerPromises = taskerIds.map(id => base44.entities.Tasker.filter({ id }));
      const taskerResults = await Promise.all(taskerPromises);
      const newTaskerMap = {};
      taskerResults.forEach(result => {
        if (result[0]) {
          newTaskerMap[result[0].id] = result[0];
        }
      });
      setTaskerMap(newTaskerMap);
      
      return uniqueBookings;
    },
    enabled: !!user,
    initialData: [],
  });

  useEffect(() => {
    if (bookingIdFromUrl && bookings.length > 0) {
      const booking = bookings.find(b => b.id === bookingIdFromUrl);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  }, [bookingIdFromUrl, bookings]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const getOtherUser = (booking) => {
    const isTasker = booking.client_email !== user.email;
    if (isTasker) {
      return { email: booking.client_email, name: booking.client_name, full_name: booking.client_name };
    } else {
      const tasker = taskerMap[booking.tasker_id];
      return { email: tasker?.email, name: tasker?.name || booking.tasker_name, full_name: tasker?.name || booking.tasker_name };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600 mt-1">Communicate with your bookings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No messages yet</p>
                  <p className="text-sm text-slate-400 mt-1">Book a service to start a conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const otherUser = getOtherUser(booking);
                    const isActive = selectedBooking?.id === booking.id;
                    
                    return (
                      <motion.button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={`w-full p-4 text-left transition-colors ${
                          isActive ? 'bg-violet-50 border-r-2 border-violet-600' : 'hover:bg-slate-50'
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-slate-900 truncate">
                            {otherUser.name}
                          </h3>
                          <Badge className={`${statusColors[booking.status]} text-xs`}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {booking.event_type || 'Event booking'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {booking.event_date ? format(new Date(booking.event_date), 'MMM d, yyyy') : 'TBD'}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedBooking ? (
              <ChatWindow
                booking={selectedBooking}
                currentUser={user}
                otherUser={getOtherUser(selectedBooking)}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Select a conversation</h3>
                  <p className="text-slate-500">Choose a booking from the list to view messages</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

