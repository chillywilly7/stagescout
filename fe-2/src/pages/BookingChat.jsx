import React, { useState, useEffect, useRef } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Calendar, CheckCheck, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const conversationIdParam = urlParams.get('conversation');
  const proIdParam = urlParams.get('pro_id');  // User ID for conversations
  const scoutIdParam = urlParams.get('scout_id');  // Profile ID for fetching scout
  const customerIdParam = urlParams.get('customer_id');

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(conversationIdParam || null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => stagepro.auth.me(),
    retry: false,
  });

  const isCustomer = currentUser?.user_type === 'customer';
  const isPro = currentUser?.user_type === 'pro';

  // Fetch booking details (if we have a booking id)
  const { data: booking, isLoading: loadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await stagepro.entities.BookingRequest.filter({ id: bookingId });
      return bookings[0];
    },
    enabled: !!bookingId,
  });

  // Fetch scout/pro info for the header  
  // Use scout_id (profile id) if available, otherwise try booking's scout_id
  const scoutId = scoutIdParam || booking?.scout_id;
  const { data: scout } = useQuery({
    queryKey: ['scout', scoutId],
    queryFn: async () => {
      if (!scoutId) return null;
      const scouts = await stagepro.entities.Scout.filter({ id: scoutId });
      return scouts[0];
    },
    enabled: !!scoutId,
  });

  // pro_id is the user_id used for conversations
  const proId = proIdParam || booking?.pro_id || scout?.user_id;

  // Fetch messages for the active conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', activeConversationId],
    queryFn: () => stagepro.entities.Conversation.getMessages(activeConversationId),
    enabled: !!activeConversationId,
    refetchInterval: 3000,
  });

  // Mark messages as read when conversation opens or new messages arrive
  useEffect(() => {
    if (activeConversationId && currentUser?.id) {
      stagepro.entities.Conversation.markRead(activeConversationId);
    }
  }, [activeConversationId, currentUser?.id, messages.length]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (/** @type {string} */ messageText) => {
      const payload = {
        message: messageText,
        senderType: isCustomer ? 'customer' : 'pro',
      };

      if (activeConversationId) {
        payload.conversationId = activeConversationId;
      } else {
        // First message — backend will create the conversation
        // proId must be the user_id (not scout profile id) for FK constraint
        payload.customerId = isCustomer ? currentUser.id : (booking?.customer_id || customerIdParam);
        payload.proId = isPro ? currentUser.id : (proIdParam || booking?.pro_id || scout?.user_id);
        if (bookingId) payload.bookingRequestId = bookingId;
      }

      return stagepro.entities.Conversation.sendMessage(payload);
    },
    onSuccess: (result) => {
      const msg = result.message || result;
      if (msg.conversation_id && !activeConversationId) {
        setActiveConversationId(msg.conversation_id);
      }
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeConversationId || msg.conversation_id] });
      setNewMessage('');
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate(newMessage.trim());
  };

  // Chat partner name
  const partnerName = isCustomer
    ? scout?.business_name || scout?.name || 'Stage Pro'
    : booking?.requester_name || 'Customer';

  const backUrl = isCustomer
    ? createPageUrl('CustomerDashboard') + `?email=${currentUser?.email}`
    : createPageUrl('ProDashboard') + `?email=${currentUser?.email}`;

  if (loadingBooking && bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burnt-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link to={backUrl}>
          <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Booking Info Header */}
        {booking && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {partnerName}
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
        )}

        {/* Chat Container */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              {!booking && partnerName !== 'Stage Pro' && partnerName !== 'Customer' && (
                <span>{partnerName} &mdash; </span>
              )}
              Messages
            </CardTitle>
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
                    const isCurrentUser = msg.sender_id === currentUser?.id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isCurrentUser ? 'bg-burnt-orange' : 'bg-white/10'} rounded-2xl px-4 py-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-300">
                              {msg.sender_name || (msg.sender_type === 'pro' ? 'Stage Pro' : 'Customer')}
                            </span>
                          </div>
                          <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs text-gray-400">
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isCurrentUser && (
                              msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              )
                            )}
                          </div>
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
                  disabled={sendMutation.isPending || !newMessage.trim()}
                  className="bg-burnt-orange hover:bg-burnt-orange/90"
                >
                  {sendMutation.isPending ? (
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