import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { UserPlus, Mail, Loader2, CheckCircle, Calendar, Sparkles, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'audio_rental', label: 'Audio Rental' },
  { id: 'dj', label: 'DJ' },
  { id: 'photography', label: 'Photography' },
  { id: 'videography', label: 'Videography' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'full_production', label: 'Full Production' },
];

export default function BookingAuthModal({ scout, selectedDate, open, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    organization: '',
    services_needed: [],
    start_time: '',
    end_time: '',
    message: ''
  });

  const toggleService = (serviceId) => {
    setBookingData(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(serviceId)
        ? prev.services_needed.filter(s => s !== serviceId)
        : [...prev.services_needed, serviceId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    
    try {
      // 1. Create the booking request
      const bookingResult = await stagepro.entities.BookingRequest.create({
        scout_id: scout.user_id,
        customer_id: user.id,
        event_date: format(selectedDate, 'yyyy-MM-dd'),
        requester_name: user.name,
        requester_email: user.email,
        requester_phone: user.phone || '',
        organization: bookingData.organization,
        services_needed: bookingData.services_needed,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        message: bookingData.message,
        status: 'pending'
      });

      const bookingId = bookingResult.id || bookingResult.booking?.id;

      // 2. Send the first message (auto-creates conversation)
      if (bookingData.message) {
        await stagepro.entities.Conversation.sendMessage({
          customerId: user.id,
          proId: scout.user_id,
          bookingRequestId: bookingId,
          message: bookingData.message,
          senderType: 'customer'
        });
      }

      // 3. Navigate to chat
      navigate(createPageUrl('BookingChat') + `?id=${bookingId}&pro_id=${scout.user_id}&scout_id=${scout.id}&customer_id=${user.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
    
    setLoading(false);
  };

  const handleLogin = () => {
    // Redirect to customer signin, then back here after login
    const returnUrl = window.location.href;
    navigate(createPageUrl('CustomerSignin') + `?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleSignup = () => {
    navigate(createPageUrl('CustomerSignup'));
  };

  const generateAIMessage = async () => {
    setAiGenerating(true);
    
    const selectedServices = SERVICES
      .filter(s => bookingData.services_needed.includes(s.id))
      .map(s => s.label)
      .join(', ');

    const prompt = `Write a professional but friendly booking request message for an event production scout. 
    
Details:
- Scout name: ${scout.name}
- Event date: ${format(selectedDate, 'MMMM d, yyyy')}
- Services needed: ${selectedServices || 'various production services'}
- Organization: ${bookingData.organization || 'an upcoming event'}
- Event time: ${bookingData.start_time ? `${bookingData.start_time} to ${bookingData.end_time || 'TBD'}` : 'TBD'}

Write a concise, warm message (2-3 sentences) expressing interest in booking them, mentioning the specific services, and asking about availability. Keep it casual and Austin-style - not too formal.`;

    const response = await stagepro.integrations.Core.InvokeLLM({
      prompt: prompt
    });

    setBookingData(prev => ({ ...prev, message: response }));
    setAiGenerating(false);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-neon-teal" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Request Sent!</h3>
            <p className="text-gray-400 mb-6">
              We've notified {scout.name}. They'll reach out soon!
            </p>
            <Button onClick={onClose} className="bg-burnt-orange hover:bg-burnt-orange/90">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If user is not logged in, show login/signup prompt
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-charcoal border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Sign in to Book
            </DialogTitle>
            <p className="text-gray-400">
              Book {scout.name} for {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-burnt-orange/20 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-burnt-orange" />
            </div>
            
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Create an account or sign in to send booking requests and message Stage Pros directly.
            </p>

            <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <CheckCircle className="w-5 h-5 text-neon-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Booking Dashboard</p>
                  <p className="text-sm text-gray-400">Track all requests in one place</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <CheckCircle className="w-5 h-5 text-neon-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Direct Messaging</p>
                  <p className="text-sm text-gray-400">Chat with scouts instantly</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleSignup}
                className="bg-neon-teal hover:bg-neon-teal/90 text-black font-bold w-full"
                size="lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
              <Button 
                onClick={handleLogin}
                variant="outline"
                className="border-white/20 text-white w-full"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Authenticated user booking form
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-charcoal border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Book for {format(selectedDate, 'MMMM d, yyyy')}
          </DialogTitle>
          <p className="text-gray-400">
            Booking with {scout.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Logged-in user info */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Booking as</p>
            <p className="text-white font-medium">{user?.name} ({user?.email})</p>
          </div>

          {/* Organization */}
          <div>
            <Label className="text-white mb-2 block">Organization/Venue</Label>
            <Input
              value={bookingData.organization}
              onChange={(e) => setBookingData(prev => ({ ...prev, organization: e.target.value }))}
              className="bg-white/5 border-white/20 text-white"
              placeholder="Company or venue name"
            />
          </div>

          {/* Services */}
          <div>
            <Label className="text-white mb-3 block">Services Needed *</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.filter(s => scout.services?.includes(s.id)).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all",
                    bookingData.services_needed.includes(s.id)
                      ? "bg-burnt-orange text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Start Time</Label>
              <Input
                type="time"
                value={bookingData.start_time}
                onChange={(e) => setBookingData(prev => ({ ...prev, start_time: e.target.value }))}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">End Time</Label>
              <Input
                type="time"
                value={bookingData.end_time}
                onChange={(e) => setBookingData(prev => ({ ...prev, end_time: e.target.value }))}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white">Message to {scout.name}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateAIMessage}
                disabled={aiGenerating || !bookingData.services_needed.length}
                className="text-electric-purple hover:text-electric-purple/80 hover:bg-electric-purple/10"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-2" />
                    AI Write
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={bookingData.message}
              onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
              className="bg-white/5 border-white/20 text-white min-h-[100px]"
              placeholder="Tell them about your event, specific needs, or questions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-white/20"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !bookingData.services_needed.length}
              className="flex-1 bg-burnt-orange hover:bg-burnt-orange/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}