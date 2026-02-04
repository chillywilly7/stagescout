import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  User, Briefcase, Calendar, DollarSign, Camera,
  Loader2, CheckCircle, Upload, X, Star, MapPin, Shield, FileText } from
'lucide-react';

const SERVICES = [
{ id: 'audio_rental', label: 'Audio Rental', icon: '🔊' },
{ id: 'dj', label: 'DJ Services', icon: '🎧' },
{ id: 'photography', label: 'Photography', icon: '📷' },
{ id: 'videography', label: 'Videography', icon: '🎥' },
{ id: 'lighting', label: 'Lighting', icon: '💡' },
{ id: 'full_production', label: 'Full Production', icon: '🎬' }];


const VENUE_TYPES = [
{ id: 'indoor', label: 'Indoor Venues' },
{ id: 'outdoor', label: 'Outdoor Events' },
{ id: 'popup', label: 'Pop-up Events' },
{ id: 'showcase', label: 'Showcases' },
{ id: 'brand_activation', label: 'Brand Activations' }];


const LOCATIONS = [
{ id: 'downtown', label: 'Downtown' },
{ id: 'east_austin', label: 'East Austin' },
{ id: 'red_river', label: 'Red River District' },
{ id: 'south_austin', label: 'South Austin' },
{ id: 'north_austin', label: 'North Austin' },
{ id: 'other', label: 'Other Austin Area' }];


const EXPERIENCE_LEVELS = [
{ id: 'local_shows', label: 'Local Shows' },
{ id: 'touring', label: 'Touring Experience' },
{ id: 'sxsw_veteran', label: 'SXSW Veteran' }];


const COMMON_GEAR = [
'QSC K12.2', 'JBL EON', 'Shure SM58', 'Sennheiser wireless', 'Pioneer CDJ',
'Technics 1200', 'Sony A7III', 'Canon 5D', 'DJI Ronin', 'Blackmagic',
'ARRI lighting', 'Aputure 300d', 'RGB LED panels', 'Haze machine'];


const STYLE_TAGS = [
'Hip-Hop', 'Electronic', 'Rock', 'Country', 'Latin', 'Indie',
'Corporate', 'Festival', 'Intimate', 'High-Energy', 'Documentary',
'Cinematic', 'Social Media', 'Live Streaming'];


export default function ProfileForm({ scoutProfile, proAccount, email }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: email,
    phone: '',
    bio: '',
    services: [],
    location: 'downtown',
    venue_types: [],
    experience_level: 'local_shows',
    sxsw_years: 0,
    budget_min: '',
    budget_max: '',
    available_last_minute: false,
    availability_dates: [],
    turnaround_days: 7,
    profile_image: '',
    portfolio_images: [],
    gear_highlights: [],
    style_tags: [],
    is_austin_based: true,
    ...scoutProfile
  });

  useEffect(() => {
    if (scoutProfile) {
      setFormData((prev) => ({ ...prev, ...scoutProfile }));
    }
  }, [scoutProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Check required fields
      if (!data.name || !data.services || data.services.length === 0) {
        throw new Error('Please fill in required fields: Name and at least one service');
      }

      if (scoutProfile) {
        return base44.entities.Scout.update(scoutProfile.id, data);
      } else {
        const scout = await base44.entities.Scout.create(data);
        await base44.entities.ProAccount.update(proAccount.id, { scout_id: scout.id });
        return scout;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scoutProfile']);
      queryClient.invalidateQueries(['proAccount']);
    }
  });

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (type === 'profile') {
        setFormData({ ...formData, profile_image: file_url });
      } else {
        setFormData({
          ...formData,
          portfolio_images: [...(formData.portfolio_images || []), file_url]
        });
      }
    } catch (err) {
      alert('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const removePortfolioImage = (index) => {
    setFormData({
      ...formData,
      portfolio_images: formData.portfolio_images.filter((_, i) => i !== index)
    });
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field] || [];
    const newValue = current.includes(value) ?
    current.filter((v) => v !== value) :
    [...current, value];
    setFormData({ ...formData, [field]: newValue });
  };

  const addCustomItem = (field, value) => {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value)) {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const removeItem = (field, value) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((v) => v !== value)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const isProfileComplete = formData.name && formData.services?.length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 mb-6 flex flex-wrap gap-2 h-auto p-2">
          <TabsTrigger value="basic" className="data-[state=active]:bg-burnt-orange">
            <User className="w-4 h-4 mr-2" />
            Basic Info
            {formData.name && <CheckCircle className="w-3 h-3 ml-2 text-neon-teal" />}
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-burnt-orange">
            <Briefcase className="w-4 h-4 mr-2" />
            Services
            {formData.services?.length > 0 && <CheckCircle className="w-3 h-3 ml-2 text-neon-teal" />}
          </TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-burnt-orange">
            <Calendar className="w-4 h-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-burnt-orange">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-burnt-orange">
            <Camera className="w-4 h-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-burnt-orange">
            <Star className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="verification" className="bg-transparent text-emerald-400 px-3 py-1 text-sm font-medium rounded-md inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow data-[state=active]:bg-burnt-orange">
            <Shield className="w-4 h-4 mr-2" />
            Verified Badge
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-white mb-2 block">Business / Artist Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your professional name"
                  className="bg-white/5 border-white/20 text-white" />

              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Contact Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(512) 555-0100"
                    className="bg-white/5 border-white/20 text-white" />

                </div>
                <div>
                  <Label className="text-white mb-2 block">Email</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-white/5 border-white/20 text-gray-400" />

                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Professional Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell bookers about your experience, style, and what makes you unique..."
                  className="bg-white/5 border-white/20 text-white min-h-[120px]" />

                <p className="text-gray-400 text-xs mt-1">
                  Tip: Mention years of experience, notable clients, or specialties
                </p>
              </div>

              <div>
                <Label className="text-white mb-3 block text-lg">Profile Photo</Label>
                {formData.profile_image ?
                <div className="relative w-48 h-48">
                    <img
                    src={formData.profile_image}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-lg" />

                    <button
                    type="button"
                    onClick={() => setFormData({ ...formData, profile_image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">

                      <X className="w-4 h-4" />
                    </button>
                  </div> :

                <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-burnt-orange/50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-400">Upload Photo</span>
                    <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'profile')}
                    className="hidden"
                    disabled={uploadingImage} />

                  </label>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-white mb-3 block text-lg">Services You Offer *</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {SERVICES.map((service) =>
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleArrayItem('services', service.id)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                    formData.services?.includes(service.id) ?
                    'bg-burnt-orange border-burnt-orange' :
                    'bg-white/5 border-white/20 hover:border-burnt-orange/50'}`
                    }>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{service.icon}</span>
                        <span className="text-white font-medium">{service.label}</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white mb-3 block text-lg">Venue Types You Work</Label>
                <div className="grid md:grid-cols-2 gap-2">
                  {VENUE_TYPES.map((venue) =>
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => toggleArrayItem('venue_types', venue.id)}
                    className={`p-3 rounded-lg border transition-all ${
                    formData.venue_types?.includes(venue.id) ?
                    'bg-neon-teal/20 border-neon-teal text-neon-teal' :
                    'bg-white/5 border-white/20 text-gray-300 hover:border-neon-teal/50'}`
                    }>

                      {venue.label}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white mb-3 block text-lg">Experience Level</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  {EXPERIENCE_LEVELS.map((level) =>
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, experience_level: level.id })}
                    className={`p-4 rounded-lg border transition-all ${
                    formData.experience_level === level.id ?
                    'bg-electric-purple/20 border-electric-purple text-electric-purple' :
                    'bg-white/5 border-white/20 text-gray-300 hover:border-electric-purple/50'}`
                    }>

                      {level.label}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">SXSW Years Worked</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sxsw_years}
                  onChange={(e) => setFormData({ ...formData, sxsw_years: parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/20 text-white" />

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <Label className="text-white block">Available for Last-Minute Bookings</Label>
                  <p className="text-gray-400 text-sm">Can accept gigs within 48 hours</p>
                </div>
                <Switch
                  checked={formData.available_last_minute}
                  onCheckedChange={(checked) => setFormData({ ...formData, available_last_minute: checked })} />

              </div>

              <div>
                <Label className="text-white mb-2 block">Photo/Video Turnaround (days)</Label>
                <p className="text-gray-400 text-sm mb-3">
                  How many days after an event do you deliver final files?
                </p>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.turnaround_days}
                  onChange={(e) => setFormData({ ...formData, turnaround_days: parseInt(e.target.value) || 7 })}
                  className="bg-white/5 border-white/20 text-white" />

              </div>

              <div>
                <Label className="text-white mb-2 block">Specific Availability Dates (Optional)</Label>
                <p className="text-gray-400 text-sm mb-3">
                  Add dates when you're confirmed available (helpful during busy seasons)
                </p>
                <Input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value && !formData.availability_dates?.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        availability_dates: [...(formData.availability_dates || []), e.target.value]
                      });
                      e.target.value = '';
                    }
                  }}
                  className="bg-white/5 border-white/20 text-white" />

                {formData.availability_dates?.length > 0 &&
                <div className="flex flex-wrap gap-2 mt-3">
                    {formData.availability_dates.map((date, i) =>
                  <Badge key={i} className="bg-neon-teal/20 text-neon-teal">
                        {new Date(date).toLocaleDateString()}
                        <button
                      type="button"
                      onClick={() => removeItem('availability_dates', date)}
                      className="ml-2">

                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                  )}
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-white mb-3 block text-lg">Your Rate Range</Label>
                <p className="text-gray-400 text-sm mb-4">
                  Help clients understand your pricing. This gives them a general idea.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Minimum Rate ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || '' })}
                      placeholder="500"
                      className="bg-white/5 border-white/20 text-white" />

                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Maximum Rate ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || '' })}
                      placeholder="2500"
                      className="bg-white/5 border-white/20 text-white" />

                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  💡 Rates vary by project scope - you can discuss specifics with clients
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-white mb-3 block text-lg">Portfolio Images</Label>
                <p className="text-gray-400 text-sm mb-4">
                  Showcase your best work - photos, videos, or event shots
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.portfolio_images?.map((img, i) =>
                  <div key={i} className="relative aspect-square">
                      <img
                      src={img}
                      alt={`Portfolio ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg" />

                      <button
                      type="button"
                      onClick={() => removePortfolioImage(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">

                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-burnt-orange/50 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'portfolio')}
                      className="hidden"
                      disabled={uploadingImage} />

                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-white mb-3 block text-lg">Your Gear Highlights</Label>
                <p className="text-gray-400 text-sm mb-3">Select or add custom gear</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_GEAR.map((gear) =>
                  <button
                    key={gear}
                    type="button"
                    onClick={() => toggleArrayItem('gear_highlights', gear)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.gear_highlights?.includes(gear) ?
                    'bg-burnt-orange text-white' :
                    'bg-white/5 text-gray-300 hover:bg-white/10'}`
                    }>

                      {gear}
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Add custom gear (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem('gear_highlights', e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-white/5 border-white/20 text-white" />

                {formData.gear_highlights?.filter((g) => !COMMON_GEAR.includes(g)).length > 0 &&
                <div className="flex flex-wrap gap-2 mt-3">
                    {formData.gear_highlights.filter((g) => !COMMON_GEAR.includes(g)).map((gear) =>
                  <Badge key={gear} className="bg-neon-teal/20 text-neon-teal">
                        {gear}
                        <button
                      type="button"
                      onClick={() => removeItem('gear_highlights', gear)}
                      className="ml-2">

                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                  )}
                  </div>
                }
              </div>

              <div>
                <Label className="text-white mb-3 block text-lg">Style Tags</Label>
                <p className="text-gray-400 text-sm mb-3">Help clients find your vibe</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {STYLE_TAGS.map((tag) =>
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleArrayItem('style_tags', tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.style_tags?.includes(tag) ?
                    'bg-electric-purple text-white' :
                    'bg-white/5 text-gray-300 hover:bg-white/10'}`
                    }>

                      {tag}
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Add custom style tag (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem('style_tags', e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-white/5 border-white/20 text-white" />

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              {formData.verification_status === 'approved' && formData.is_verified &&
              <div className="p-4 bg-neon-teal/10 border border-neon-teal/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neon-teal/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-neon-teal" />
                    </div>
                    <div>
                      <h3 className="text-neon-teal font-bold text-lg">Verified Business</h3>
                      <p className="text-gray-300 text-sm">Your profile has been verified by StageLink</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-neon-teal/20 text-neon-teal">✓ Business Verified</Badge>
                        <Badge className="bg-neon-teal/20 text-neon-teal">✓ Insured</Badge>
                        <Badge className="bg-neon-teal/20 text-neon-teal">✓ Background Checked</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              }

              {formData.verification_status === 'pending' &&
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                    <div>
                      <h3 className="text-yellow-500 font-bold">Verification Pending</h3>
                      <p className="text-gray-300 text-sm">Your verification request is under review</p>
                    </div>
                  </div>
                </div>
              }

              {formData.verification_status === 'rejected' &&
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <X className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="text-red-500 font-bold">Verification Rejected</h3>
                      <p className="text-gray-300 text-sm">Please review your information and resubmit</p>
                    </div>
                  </div>
                </div>
              }

              {(!formData.verification_status || formData.verification_status === 'none' || formData.verification_status === 'rejected') &&
              <>
                  <div className="p-4 bg-burnt-orange/10 border border-burnt-orange/30 rounded-lg">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-burnt-orange" />
                      Get Your Verified Badge
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Stand out and build trust! Verified pros appear first in search results and get 3x more bookings.
                    </p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-teal" />
                        <span>Business identity verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-teal" />
                        <span>Liability insurance confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-teal" />
                        <span>Background check completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-teal" />
                        <span>Priority placement in search</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Legal Business Name *</Label>
                    <Input
                    required
                    value={formData.verification_business_name || ''}
                    onChange={(e) => setFormData({ ...formData, verification_business_name: e.target.value })}
                    placeholder="Your registered business name"
                    className="bg-white/5 border-white/20 text-white" />

                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Tax ID / EIN *</Label>
                    <Input
                    required
                    value={formData.verification_tax_id || ''}
                    onChange={(e) => setFormData({ ...formData, verification_tax_id: e.target.value })}
                    placeholder="XX-XXXXXXX"
                    className="bg-white/5 border-white/20 text-white" />

                    <p className="text-gray-400 text-xs mt-1">Your Tax ID or Employer Identification Number</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Liability Insurance Provider *</Label>
                      <Input
                      required
                      value={formData.verification_insurance || ''}
                      onChange={(e) => setFormData({ ...formData, verification_insurance: e.target.value })}
                      placeholder="Insurance company name"
                      className="bg-white/5 border-white/20 text-white" />

                    </div>
                    <div>
                      <Label className="text-white mb-2 block">Insurance Expiry Date *</Label>
                      <Input
                      type="date"
                      required
                      value={formData.verification_insurance_expiry || ''}
                      onChange={(e) => setFormData({ ...formData, verification_insurance_expiry: e.target.value })}
                      className="bg-white/5 border-white/20 text-white" />

                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-3 block text-lg">Upload Verification Documents *</Label>
                    <p className="text-gray-400 text-sm mb-3">
                      Upload proof of business ownership and insurance
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.verification_documents?.map((doc, i) =>
                    <div key={i} className="relative aspect-square bg-white/5 rounded-lg p-2 border border-white/20">
                          <div className="flex flex-col items-center justify-center h-full">
                            <FileText className="w-8 h-8 text-neon-teal mb-2" />
                            <span className="text-xs text-gray-400 text-center">Document {i + 1}</span>
                          </div>
                          <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          verification_documents: formData.verification_documents.filter((_, idx) => idx !== i)
                        })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full">

                            <X className="w-3 h-3" />
                          </button>
                        </div>
                    )}
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-burnt-orange/50 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400 text-center px-2">Upload Document</span>
                        <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploadingImage(true);
                          try {
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            setFormData({
                              ...formData,
                              verification_documents: [...(formData.verification_documents || []), file_url]
                            });
                          } catch (err) {
                            alert('Failed to upload document');
                          }
                          setUploadingImage(false);
                        }}
                        className="hidden"
                        disabled={uploadingImage} />

                      </label>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      Accepted: IRS Letter, Business License, Tax Documents, Bank Letters, Insurance Certificate
                    </p>
                  </div>

                  <Button
                  type="button"
                  onClick={async () => {
                    if (!formData.verification_business_name || !formData.verification_tax_id ||
                    !formData.verification_insurance || !formData.verification_insurance_expiry ||
                    !formData.verification_documents || formData.verification_documents.length === 0) {
                      alert('Please fill in all required fields and upload at least one document');
                      return;
                    }

                    setUploadingImage(true);
                    try {
                      // Update verification status to pending
                      const updatedData = {
                        ...formData,
                        verification_status: 'pending'
                      };
                      setFormData(updatedData);

                      await saveMutation.mutateAsync(updatedData);

                      // Send email to admin
                      await base44.integrations.Core.SendEmail({
                        to: proAccount.email,
                        subject: '🔔 New Verification Request - StageLink',
                        body: `
                            <h2>New Verification Request</h2>
                            <p><strong>Business Name:</strong> ${formData.verification_business_name}</p>
                            <p><strong>Scout Name:</strong> ${formData.name}</p>
                            <p><strong>Email:</strong> ${formData.email}</p>
                            <p><strong>Tax ID:</strong> ${formData.verification_tax_id}</p>
                            <p><strong>Insurance:</strong> ${formData.verification_insurance} (Expires: ${formData.verification_insurance_expiry})</p>
                            <p><strong>Documents Uploaded:</strong> ${formData.verification_documents.length} file(s)</p>
                            <br>
                            <p>Please review the verification documents and approve/reject in the admin dashboard.</p>
                            <p>Scout Profile: ${formData.name}</p>
                          `
                      });

                      alert('Verification request submitted! You will receive an email once reviewed.');
                    } catch (err) {
                      alert('Failed to submit verification request');
                    }
                    setUploadingImage(false);
                  }}
                  disabled={uploadingImage}
                  className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white text-lg py-6">

                    {uploadingImage ?
                  <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Submitting...
                      </> :

                  <>
                        <Shield className="w-5 h-5 mr-2" />
                        Submit for Verification
                      </>
                  }
                  </Button>
                </>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Card className="bg-white/5 border-white/10 mt-6">
        <CardContent className="p-6">
          {!isProfileComplete &&
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-500 text-sm">
                ⚠️ Please complete required fields: Name and at least one service
              </p>
            </div>
          }

          {saveMutation.isSuccess &&
          <div className="mb-4 text-neon-teal text-sm bg-neon-teal/10 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Profile saved successfully!
            </div>
          }

          {saveMutation.isError &&
          <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
              {saveMutation.error?.message || 'Failed to save profile'}
            </div>
          }

          <Button
            type="submit"
            disabled={saveMutation.isLoading || uploadingImage}
            className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white text-lg py-6">

            {saveMutation.isLoading ?
            <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving Profile...
              </> :

            <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Save Profile
              </>
            }
          </Button>
        </CardContent>
      </Card>
    </form>);

}