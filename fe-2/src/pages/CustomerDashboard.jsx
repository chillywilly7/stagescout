import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Loader2, LogOut, User } from 'lucide-react';
import ProfileForm from '@/components/customer/ProfileForm';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');

  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = async () => {
    // Clear both localStorage and the HTTP-only cookie
    authState.clearSession();
    await stagepro.auth.logout();
    window.dispatchEvent(new Event('storage'));
    navigate(createPageUrl('Home'));
  };

  // Fetch customer account
  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customerAccount', email],
    queryFn: async () => {
      const accounts = await stagepro.entities.CustomerAccount.filter({ email });
      return accounts[0];
    },
    enabled: !!email
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['customerBookings', email],
    queryFn: () => stagepro.entities.BookingRequest.filter({ requester_email: email }, '-created_date'),
    enabled: !!email
  });

  if (loadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burnt-orange" />
      </div>);

  }

  if (!customer) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Please sign in to access your dashboard</p>
        <Link to={createPageUrl('CustomerSignin')}>
          <Button className="bg-burnt-orange hover:bg-burnt-orange/90">
            Go to Sign In
          </Button>
        </Link>
      </div>);

  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              My Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {customer.name || email}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline" className="bg-stone-600 text-white px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10">


            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-burnt-orange">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-burnt-orange">
              <Calendar className="w-4 h-4 mr-2" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-burnt-orange">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="profile">
            <ProfileForm customer={customer} />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsList bookings={bookings} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesView bookings={bookings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}

// Bookings List Component
function BookingsList({ bookings }) {
  if (bookings.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No bookings yet</p>
          <Link to={createPageUrl('FindScouts')}>
            <Button className="bg-burnt-orange hover:bg-burnt-orange/90">
              Find StagePros
            </Button>
          </Link>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) =>
      <Card key={booking.id} className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Booking Request</h3>
                <p className="text-gray-400 text-sm">Event on {format(new Date(booking.event_date), 'MMMM d, yyyy')}</p>
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
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Services:</strong> {booking.services_needed?.join(', ')}</p>
              <p><strong>Venue:</strong> {booking.venue_name || 'Not specified'}</p>
              {booking.message && <p><strong>Your message:</strong> {booking.message}</p>}
            </div>
            <Link to={createPageUrl('BookingChat') + `?id=${booking.id}`}>
              <Button className="mt-4 bg-burnt-orange hover:bg-burnt-orange/90" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>);

}

// Messages View Component
function MessagesView({ bookings }) {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['customerConversations'],
    queryFn: () => stagepro.entities.Conversation.list(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-burnt-orange" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No messages yet</p>
        </CardContent>
      </Card>);
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const unread = conv.unread_count || 0;
        return (
          <Link key={conv.id} to={createPageUrl('BookingChat') + `?conversation=${conv.id}${conv.booking_request_id ? `&id=${conv.booking_request_id}` : ''}`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer mb-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white truncate">{conv.pro_name || conv.business_name || 'Stage Pro'}</h4>
                    {unread > 0 && (
                      <span className="bg-burnt-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-gray-400 truncate mt-1">
                      {conv.last_message}
                    </p>
                  )}
                  {conv.last_message_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
                <Badge className="bg-burnt-orange/20 text-burnt-orange shrink-0 ml-3">
                  View Chat
                </Badge>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>);

}