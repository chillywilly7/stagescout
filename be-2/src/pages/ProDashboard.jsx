import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authState } from '@/components/authHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User, Calendar, MessageSquare, Loader2, LogOut } from
'lucide-react';
import { format } from 'date-fns';
import ProfileForm from '@/components/profile/ProfileForm';

export default function ProDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const isNew = urlParams.get('new') === 'true';

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(isNew ? 'profile' : 'bookings');

  const handleLogout = () => {
    authState.clearSession();
    window.dispatchEvent(new Event('storage'));
    navigate(createPageUrl('Home'));
  };

  // Fetch pro account and scout profile
  const { data: proAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ['proAccount', email],
    queryFn: async () => {
      const accounts = await base44.entities.ProAccount.filter({ email, is_verified: true });
      return accounts[0];
    },
    enabled: !!email
  });

  const { data: scoutProfile, isLoading: loadingScout } = useQuery({
    queryKey: ['scoutProfile', proAccount?.scout_id],
    queryFn: async () => {
      if (!proAccount?.scout_id) return null;
      const scouts = await base44.entities.Scout.filter({ id: proAccount.scout_id });
      return scouts[0];
    },
    enabled: !!proAccount?.scout_id
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['proBookings', scoutProfile?.id],
    queryFn: () => base44.entities.BookingRequest.filter({ scout_id: scoutProfile.id }, '-created_date'),
    enabled: !!scoutProfile?.id
  });

  if (loadingAccount || loadingScout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burnt-orange" />
      </div>);

  }

  if (!proAccount) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Please sign in to access your dashboard</p>
        <Link to={createPageUrl('ProSignup')}>
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
              Stage Pro Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {scoutProfile?.name || email}
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
              Bookings
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-burnt-orange">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileForm
              scoutProfile={scoutProfile}
              proAccount={proAccount}
              email={email} />

          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <BookingsList bookings={bookings} scoutProfile={scoutProfile} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesView bookings={bookings} scoutEmail={email} />
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}

// Bookings List Component
function BookingsList({ bookings, scoutProfile }) {
  if (!scoutProfile) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Complete your profile to receive bookings</p>
        </CardContent>
      </Card>);

  }

  if (bookings.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No bookings yet</p>
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
                <h3 className="text-lg font-bold text-white">{booking.requester_name}</h3>
                <p className="text-gray-400 text-sm">{booking.requester_email}</p>
              </div>
              <Badge className={
            booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
            'bg-gray-500/20 text-gray-500'
            }>
                {booking.status}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Date:</strong> {format(new Date(booking.event_date), 'MMMM d, yyyy')}</p>
              <p><strong>Services:</strong> {booking.services_needed?.join(', ')}</p>
              {booking.message && <p><strong>Message:</strong> {booking.message}</p>}
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
function MessagesView({ bookings, scoutEmail }) {
  const bookingsWithMessages = bookings.filter((b) => b.status !== 'declined');

  if (bookingsWithMessages.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No messages yet</p>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-4">
      {bookingsWithMessages.map((booking) =>
      <Link key={booking.id} to={createPageUrl('BookingChat') + `?id=${booking.id}`}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">{booking.requester_name}</h4>
                <p className="text-sm text-gray-400">
                  {format(new Date(booking.event_date), 'MMM d, yyyy')}
                </p>
              </div>
              <Badge className="bg-burnt-orange/20 text-burnt-orange">
                View Chat
              </Badge>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>);

}