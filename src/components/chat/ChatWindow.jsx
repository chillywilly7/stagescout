
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ booking, currentUser, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.booking_id === booking.id) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        }
      }
    });

    return () => unsubscribe();
  }, [booking.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    const msgs = await base44.entities.Message.filter({ booking_id: booking.id }, 'created_date');
    setMessages(msgs);
    setIsLoading(false);
    
    // Mark unread messages as read
    const unread = msgs.filter(m => !m.is_read && m.sender_email !== currentUser.email);
    for (const msg of unread) {
      await base44.entities.Message.update(msg.id, { is_read: true });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    await base44.entities.Message.create({
      booking_id: booking.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      recipient_email: otherUser.email,
      content: newMessage.trim(),
      is_read: false,
    });
    setNewMessage('');
    setIsSending(false);
    loadMessages();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900">{otherUser.name || otherUser.full_name}</h3>
        <p className="text-sm text-slate-500">{booking.event_type || 'Booking'} • {booking.event_date}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_email === currentUser.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1.5 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500"
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="h-12 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

