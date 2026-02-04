import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const userEmail = urlParams.get('email'); // Passed from booking or pro dashboard
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');

  // Fetch booking details
  const { data: booking, isLoading: loadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.BookingRequest.filter({ id: bookingId });
      return bookings[0];
    },
    enabled: !!bookingId
  });

  // Fetch scout details
  const { data: scout } = useQuery({
    queryKey: ['scout', booking?.scout_id],
    queryFn: async () => {
      const scouts = await base44.entities.Scout.filter({ id: booking.scout_id });
      return scouts[0];
    },
    enabled: !!booking?.scout_id
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', bookingId],
    queryFn: () => base44.entities.ChatMessage.filter({ booking_request_id: bookingId }, 'created_date'),
    enabled: !!bookingId,
    refetchInterval: 3000 // Poll every 3 seconds for new messages
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (messageData) => {
      return base44.entities.ChatMessage.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', bookingId]);
      setNewMessage('');
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Determine sender type
    const senderType = userEmail === scout?.email ? 'scout' : 'customer';

    sendMutation.mutate({
      booking_request_id: bookingId,
      sender_email: userEmail || booking.requester_email,
      sender_type: senderType,
      message: newMessage.trim()
    });
  };

  if (loadingBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burnt-orange" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Booking not found</h2>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline" className="border-white/20 text-white">
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const currentUserEmail = userEmail || booking.requester_email;
  const isScout = currentUserEmail === scout?.email;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link to={createPageUrl(isScout ? 'ProDashboard' : 'Home') + `?email=${currentUserEmail}`}>
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Booking Info Header */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isScout ? booking.requester_name : scout?.name}
                </h2>
                <div className="space-y-1 text-sm text-gray-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(booking.event_date), 'MMMM d, yyyy')}
                  </p>
                  <p>Services: {booking.services_needed?.join(', ')}</p>
                </div>
              </div>
              <Badge className={
                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                booking.status === 'contacted' ? 'bg-blue-500/20 text-blue-500' :
                'bg-gray-500/20 text-gray-500'
              }>
                {booking.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Chat Container */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages List */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.sender_email === currentUserEmail;
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isCurrentUser ? 'bg-burnt-orange' : 'bg-white/10'} rounded-2xl px-4 py-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-300">
                              {msg.sender_type === 'scout' ? 'Stage Pro' : 'Customer'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.created_date), 'h:mm a')}
                            </span>
                          </div>
                          <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="bg-white/5 border-white/20 text-white flex-1"
                />
                <Button
                  type="submit"
                  disabled={sendMutation.isLoading || !newMessage.trim()}
                  className="bg-burnt-orange hover:bg-burnt-orange/90"
                >
                  {sendMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}