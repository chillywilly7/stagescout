import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { UserPlus, Mail, Loader2, CheckCircle, Calendar, Sparkles } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('guest');
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [guestData, setGuestData] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    organization: '',
    services_needed: [],
    start_time: '',
    end_time: '',
    message: ''
  });

  const toggleService = (serviceId) => {
    setGuestData(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(serviceId)
        ? prev.services_needed.filter(s => s !== serviceId)
        : [...prev.services_needed, serviceId]
    }));
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const booking = await base44.entities.BookingRequest.create({
      scout_id: scout.id,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      ...guestData,
      status: 'pending'
    });

    // Navigate to chat after successful booking
    navigate(createPageUrl('BookingChat') + `?id=${booking.id}&email=${guestData.requester_email}`);
    
    setLoading(false);
  };

  const handleCreateAccount = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const generateAIMessage = async () => {
    setAiGenerating(true);
    
    const selectedServices = SERVICES
      .filter(s => guestData.services_needed.includes(s.id))
      .map(s => s.label)
      .join(', ');

    const prompt = `Write a professional but friendly booking request message for an event production scout. 
    
Details:
- Scout name: ${scout.name}
- Event date: ${format(selectedDate, 'MMMM d, yyyy')}
- Services needed: ${selectedServices || 'various production services'}
- Organization: ${guestData.organization || 'an upcoming event'}
- Event time: ${guestData.start_time ? `${guestData.start_time} to ${guestData.end_time || 'TBD'}` : 'TBD'}

Write a concise, warm message (2-3 sentences) expressing interest in booking them, mentioning the specific services, and asking about availability. Keep it casual and Austin-style - not too formal.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt
    });

    setGuestData(prev => ({ ...prev, message: response }));
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
              We've notified {scout.name}. They'll reach out soon to your email.
            </p>
            <Button onClick={onClose} className="bg-burnt-orange hover:bg-burnt-orange/90">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="guest" className="data-[state=active]:bg-burnt-orange">
              <Mail className="w-4 h-4 mr-2" />
              Guest Booking
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-neon-teal data-[state=active]:text-black">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </TabsTrigger>
          </TabsList>

          {/* Guest Booking Tab */}
          <TabsContent value="guest" className="mt-6">
            <p className="text-sm text-gray-400 mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
              <strong className="text-white">Quick booking:</strong> Fill out the form below and we'll send your request directly to {scout.name}.
            </p>

            <form onSubmit={handleGuestSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Your Name *</Label>
                  <Input
                    required
                    value={guestData.requester_name}
                    onChange={(e) => setGuestData(prev => ({ ...prev, requester_name: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={guestData.requester_email}
                    onChange={(e) => setGuestData(prev => ({ ...prev, requester_email: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Phone</Label>
                  <Input
                    value={guestData.requester_phone}
                    onChange={(e) => setGuestData(prev => ({ ...prev, requester_phone: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="(512) 555-0123"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Organization/Venue</Label>
                  <Input
                    value={guestData.organization}
                    onChange={(e) => setGuestData(prev => ({ ...prev, organization: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Company or venue name"
                  />
                </div>
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
                        guestData.services_needed.includes(s.id)
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
                    value={guestData.start_time}
                    onChange={(e) => setGuestData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">End Time</Label>
                  <Input
                    type="time"
                    value={guestData.end_time}
                    onChange={(e) => setGuestData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white">Additional Details</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateAIMessage}
                    disabled={aiGenerating || !guestData.services_needed.length}
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
                  value={guestData.message}
                  onChange={(e) => setGuestData(prev => ({ ...prev, message: e.target.value }))}
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
                  disabled={loading || !guestData.requester_name || !guestData.requester_email || !guestData.services_needed.length}
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
          </TabsContent>

          {/* Create Account Tab */}
          <TabsContent value="account" className="mt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-8 h-8 text-neon-teal" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Book Through the App
              </h3>
              
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create an account to manage all your bookings in one place, track requests, and get faster responses.
              </p>

              <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
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
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <CheckCircle className="w-5 h-5 text-neon-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Faster Bookings</p>
                    <p className="text-sm text-gray-400">Save your info for next time</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateAccount}
                className="bg-neon-teal hover:bg-neon-teal/90 text-black font-bold px-8"
                size="lg"
              >
                Create Account & Book
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                Already have an account? You'll be redirected to login.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}