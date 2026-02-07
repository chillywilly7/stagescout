import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Volume2, Disc3, Camera, Video, Lightbulb, Clapperboard,
  ArrowRight, ArrowLeft, CheckCircle, Loader2, Upload, X, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'audio_rental', icon: Volume2, label: 'Audio Rental', desc: 'PA systems, monitors, mics' },
  { id: 'dj', icon: Disc3, label: 'DJ', desc: 'Music curation & mixing' },
  { id: 'photography', icon: Camera, label: 'Photography', desc: 'Event & promo photos' },
  { id: 'videography', icon: Video, label: 'Videography', desc: 'Video capture & editing' },
  { id: 'lighting', icon: Lightbulb, label: 'Lighting', desc: 'Stage & ambient lighting' },
  { id: 'full_production', icon: Clapperboard, label: 'Full Production', desc: 'End-to-end event setup' },
];

const VENUE_TYPES = [
  { id: 'indoor', label: 'Indoor Venues' },
  { id: 'outdoor', label: 'Outdoor Events' },
  { id: 'popup', label: 'Pop-ups' },
  { id: 'showcase', label: 'Showcases' },
  { id: 'brand_activation', label: 'Brand Activations' },
];

const LOCATIONS = [
  { id: 'downtown', label: 'Downtown' },
  { id: 'east_austin', label: 'East Austin' },
  { id: 'red_river', label: 'Red River' },
  { id: 'south_austin', label: 'South Austin' },
  { id: 'north_austin', label: 'North Austin' },
  { id: 'other', label: 'Other Austin Area' },
];

const EXPERIENCE_LEVELS = [
  { id: 'local_shows', label: 'Local Shows', desc: 'Regular Austin venue gigs' },
  { id: 'touring', label: 'Touring Experience', desc: 'Regional or national tours' },
  { id: 'sxsw_veteran', label: 'SXSW Veteran', desc: '2+ SXSW events worked' },
];

const COMMON_GEAR = {
  audio_rental: ['JBL VRX Line Array', 'QSC K-Series', 'Shure Wireless Mics', 'Allen & Heath Console', 'Yamaha PM5D', 'Crown Amplifiers'],
  dj: ['Pioneer CDJ-3000', 'Technics 1200', 'Serato DJ Pro', 'Traktor', 'Native Instruments S4', 'DJM-900NXS2'],
  photography: ['Sony A7 Series', 'Canon 5D/R Series', 'Nikon Z Series', 'Profoto Lighting', 'Godox Strobes'],
  videography: ['Sony FX6/FX3', 'Canon C70/R5C', 'DJI Ronin Gimbal', 'Blackmagic Pocket Cinema', 'DaVinci Resolve'],
  lighting: ['Chauvet Rogue', 'Elation Platinum', 'Martin MAC', 'Avolites Console', 'ETC ColorSource', 'ADJ LED Pars'],
};

const STYLE_OPTIONS = [
  'Rock', 'Indie', 'Electronic', 'Hip-Hop', 'Country', 'Jazz', 
  'Latin', 'EDM', 'Folk', 'Blues', 'Metal', 'Pop', 
  'Punk', 'R&B', 'Ambient', 'Experimental'
];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const AVAILABLE_DATES = generateDates();

export default function ScoutOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    services: [],
    bio: '',
    profile_image: '',
    portfolio_images: [],
    gear_highlights: [],
    style_tags: [],
    location: '',
    venue_types: [],
    experience_level: '',
    sxsw_years: 0,
    budget_min: '',
    budget_max: '',
    turnaround_days: '',
    available_last_minute: false,
    availability_dates: [],
    is_austin_based: true
  });

  const [customGear, setCustomGear] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const toggleDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setFormData(prev => ({
      ...prev,
      availability_dates: prev.availability_dates.includes(dateStr)
        ? prev.availability_dates.filter(d => d !== dateStr)
        : [...prev.availability_dates, dateStr]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageUploading(true);
    const { file_url } = await stagepro.integrations.Core.UploadFile({ file });
    updateField('profile_image', file_url);
    setImageUploading(false);
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPortfolioUploading(true);
    const { file_url } = await stagepro.integrations.Core.UploadFile({ file });
    setFormData(prev => ({
      ...prev,
      portfolio_images: [...prev.portfolio_images, file_url]
    }));
    setPortfolioUploading(false);
  };

  const removePortfolioImage = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: prev.portfolio_images.filter((_, i) => i !== index)
    }));
  };

  const addCustomGear = () => {
    if (customGear.trim() && !formData.gear_highlights.includes(customGear.trim())) {
      setFormData(prev => ({
        ...prev,
        gear_highlights: [...prev.gear_highlights, customGear.trim()]
      }));
      setCustomGear('');
    }
  };

  const addCustomStyle = () => {
    if (customStyle.trim() && !formData.style_tags.includes(customStyle.trim())) {
      setFormData(prev => ({
        ...prev,
        style_tags: [...prev.style_tags, customStyle.trim()]
      }));
      setCustomStyle('');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name && formData.email;
      case 2: return formData.services.length > 0;
      case 3: return formData.experience_level;
      case 4: return true; // Optional
      case 5: return formData.availability_dates.length > 0;
      case 6: return verificationCode.length === 6;
      case 7: return password && password === confirmPassword && !passwordError;
      default: return true;
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordChange = (pwd) => {
    setPassword(pwd);
    setPasswordError(validatePassword(pwd));
  };

  const sendVerificationCode = async () => {
    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode('');
    
    await stagepro.integrations.Core.SendEmail({
      to: formData.email,
      subject: 'Verify your StagePros email',
      body: `Your verification code is: ${code}\n\nEnter this code to complete your StagePros registration.`
    });
    
    // Store code temporarily (in production, this should be server-side)
    sessionStorage.setItem('verificationCode', code);
    setVerificationSent(true);
    setLoading(false);
  };

  const verifyCode = () => {
    setVerifying(true);
    const storedCode = sessionStorage.getItem('verificationCode');
    if (verificationCode === storedCode) {
      setVerifying(false);
      setStep(7);
    } else {
      setVerifying(false);
      alert('Invalid verification code. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const cleanedData = {
      ...formData,
      budget_min: formData.budget_min ? Number(formData.budget_min) : null,
      budget_max: formData.budget_max ? Number(formData.budget_max) : null,
      turnaround_days: formData.turnaround_days ? Number(formData.turnaround_days) : null,
      sxsw_years: Number(formData.sxsw_years) || 0,
      is_verified: false
    };
    
    await stagepro.entities.Scout.create(cleanedData);
    
    // Create ProAccount with password
    await stagepro.entities.ProAccount.create({
      email: formData.email,
      password: password,
      is_verified: true
    });
    
    sessionStorage.removeItem('verificationCode');
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-neon-teal" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">You're All Set!</h2>
          <p className="text-gray-400 mb-8">
            Your profile is now live. Bookers can find you and send booking requests.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('FindScouts'))}
            className="bg-burnt-orange hover:bg-burnt-orange/90"
          >
            View All Pros
          </Button>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Profile' },
    { num: 2, label: 'Services' },
    { num: 3, label: 'Experience' },
    { num: 4, label: 'Rates' },
    { num: 5, label: 'Availability' },
  ];

  const availableGearOptions = formData.services.flatMap(service => COMMON_GEAR[service] || []);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3">
            Join StagePros
          </h1>
          <p className="text-gray-400 text-lg">
            Complete your profile to start receiving bookings
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
          {steps.map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                  step === s.num && "bg-burnt-orange text-white ring-4 ring-burnt-orange/20",
                  step > s.num && "bg-neon-teal text-black",
                  step < s.num && "bg-white/10 text-gray-500"
                )}
              >
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={cn(
                "text-xs mt-2 font-medium",
                step >= s.num ? "text-white" : "text-gray-500"
              )}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Your Profile</h3>
                  <p className="text-gray-400">Let's start with the basics</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Business/Artist Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="Your name or brand"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Contact Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="(512) 555-0123"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    className="bg-white/5 border-white/20 text-white min-h-[120px]"
                    placeholder="Tell bookers about your experience, specialties, and what makes you unique..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Services */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Services</h3>
                  <p className="text-gray-400">What services do you offer?</p>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Select Services *</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {SERVICES.map(service => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleArrayItem('services', service.id)}
                        className={cn(
                          "p-4 rounded-xl border transition-all text-left",
                          formData.services.includes(service.id)
                            ? "border-burnt-orange bg-burnt-orange/10 ring-2 ring-burnt-orange/20"
                            : "border-white/10 hover:border-white/30 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <service.icon className={cn(
                            "w-6 h-6 flex-shrink-0",
                            formData.services.includes(service.id) ? "text-burnt-orange" : "text-gray-400"
                          )} />
                          <div>
                            <div className={cn(
                              "font-semibold mb-1",
                              formData.services.includes(service.id) ? "text-burnt-orange" : "text-white"
                            )}>
                              {service.label}
                            </div>
                            <div className="text-xs text-gray-500">{service.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Venue Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {VENUE_TYPES.map(venue => (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => toggleArrayItem('venue_types', venue.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border transition-all",
                          formData.venue_types.includes(venue.id)
                            ? "border-electric-purple bg-electric-purple/10 text-electric-purple"
                            : "border-white/10 text-gray-400 hover:border-white/30"
                        )}
                      >
                        {venue.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Experience */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Experience & Gear</h3>
                  <p className="text-gray-400">Show off your expertise</p>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Experience Level *</Label>
                  <div className="space-y-3">
                    {EXPERIENCE_LEVELS.map(exp => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => updateField('experience_level', exp.id)}
                        className={cn(
                          "w-full p-4 rounded-xl border transition-all text-left",
                          formData.experience_level === exp.id
                            ? "border-burnt-orange bg-burnt-orange/10 ring-2 ring-burnt-orange/20"
                            : "border-white/10 hover:border-white/30 hover:bg-white/5"
                        )}
                      >
                        <div className={cn(
                          "font-semibold mb-1",
                          formData.experience_level === exp.id ? "text-burnt-orange" : "text-white"
                        )}>
                          {exp.label}
                        </div>
                        <div className="text-sm text-gray-500">{exp.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">SXSW Events Worked</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sxsw_years}
                    onChange={(e) => updateField('sxsw_years', e.target.value)}
                    className="bg-white/5 border-white/20 text-white w-32"
                    placeholder="0"
                  />
                </div>

                {availableGearOptions.length > 0 && (
                  <div>
                    <Label className="text-white mb-3 block">Gear & Equipment</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableGearOptions.map(gear => (
                        <button
                          key={gear}
                          type="button"
                          onClick={() => toggleArrayItem('gear_highlights', gear)}
                          className={cn(
                            "px-3 py-2 rounded-lg border text-sm transition-all",
                            formData.gear_highlights.includes(gear)
                              ? "border-neon-teal bg-neon-teal/10 text-neon-teal"
                              : "border-white/10 text-gray-400 hover:border-white/30"
                          )}
                        >
                          {gear}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={customGear}
                        onChange={(e) => setCustomGear(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGear())}
                        className="bg-white/5 border-white/20 text-white flex-1"
                        placeholder="Add custom gear..."
                      />
                      <Button
                        type="button"
                        onClick={addCustomGear}
                        className="bg-neon-teal/20 text-neon-teal hover:bg-neon-teal/30"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-white mb-3 block">Style Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {STYLE_OPTIONS.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleArrayItem('style_tags', style)}
                        className={cn(
                          "px-3 py-2 rounded-full border text-sm transition-all",
                          formData.style_tags.includes(style)
                            ? "border-electric-purple bg-electric-purple/10 text-electric-purple"
                            : "border-white/10 text-gray-400 hover:border-white/30"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={customStyle}
                      onChange={(e) => setCustomStyle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomStyle())}
                      className="bg-white/5 border-white/20 text-white flex-1"
                      placeholder="Add custom style..."
                    />
                    <Button
                      type="button"
                      onClick={addCustomStyle}
                      className="bg-electric-purple/20 text-electric-purple hover:bg-electric-purple/30"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Portfolio Images</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.portfolio_images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button
                          onClick={() => removePortfolioImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {formData.portfolio_images.length < 6 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-burnt-orange/50 hover:bg-burnt-orange/5 transition-all">
                        {portfolioUploading ? (
                          <Loader2 className="w-6 h-6 text-burnt-orange animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePortfolioUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Rates & Info</h3>
                  <p className="text-gray-400">Set your pricing expectations</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Starting Rate ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.budget_min}
                      onChange={(e) => updateField('budget_min', e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Maximum Rate ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.budget_max}
                      onChange={(e) => updateField('budget_max', e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="5000"
                    />
                  </div>
                </div>

                {(formData.services.includes('photography') || formData.services.includes('videography')) && (
                  <div>
                    <Label className="text-white mb-2 block">Deliverable Turnaround (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.turnaround_days}
                      onChange={(e) => updateField('turnaround_days', e.target.value)}
                      className="bg-white/5 border-white/20 text-white w-40"
                      placeholder="3-7 days"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <Label className="text-white block mb-1">Last-Minute Bookings</Label>
                    <p className="text-sm text-gray-500">Available for same-day or urgent gigs</p>
                  </div>
                  <Switch
                    checked={formData.available_last_minute}
                    onCheckedChange={(checked) => updateField('available_last_minute', checked)}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 5: Availability */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Availability</h3>
                  <p className="text-gray-400">Select dates you're available (next 60 days)</p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-96 overflow-y-auto p-2">
                  {AVAILABLE_DATES.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = formData.availability_dates.includes(dateStr);
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => toggleDate(date)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-center",
                          isSelected
                            ? "border-neon-teal bg-neon-teal/10 text-neon-teal"
                            : "border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5"
                        )}
                      >
                        <div className="text-xl font-bold">{format(date, 'd')}</div>
                        <div className="text-xs opacity-70">{format(date, 'EEE')}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        availability_dates: AVAILABLE_DATES.map(d => format(d, 'yyyy-MM-dd'))
                      }))}
                      className="border-white/20 text-white"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, availability_dates: [] }))}
                      className="border-white/20 text-white"
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    <span className="text-neon-teal font-semibold">{formData.availability_dates.length}</span> dates selected
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 6: Email Verification */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Verify Your Email</h3>
                  <p className="text-gray-400">We'll send a verification code to {formData.email}</p>
                </div>

                {!verificationSent ? (
                  <div className="text-center py-8">
                    <Button
                      onClick={sendVerificationCode}
                      disabled={loading}
                      className="bg-burnt-orange hover:bg-burnt-orange/90 text-white"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : null}
                      Send Verification Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Enter 6-digit code</Label>
                      <Input
                        type="text"
                        maxLength="6"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
                        placeholder="000000"
                      />
                    </div>
                    <Button
                      onClick={verifyCode}
                      disabled={verificationCode.length !== 6 || verifying}
                      className="w-full bg-neon-teal hover:bg-neon-teal/90 text-black font-bold"
                    >
                      {verifying ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : null}
                      Verify Email
                    </Button>
                    <button
                      onClick={() => {
                        setVerificationSent(false);
                        setVerificationCode('');
                      }}
                      className="text-sm text-gray-400 hover:text-white transition-colors w-full text-center"
                    >
                      Resend code
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 7: Create Password */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create Password</h3>
                  <p className="text-gray-400">Secure your StagePro account</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Enter password"
                  />
                  {passwordError && (
                    <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                  )}
                  <div className="mt-3 space-y-1 text-sm">
                    <p className={password.length >= 8 ? "text-green-400" : "text-gray-500"}>
                      ✓ At least 8 characters
                    </p>
                    <p className={/[A-Z]/.test(password) ? "text-green-400" : "text-gray-500"}>
                      ✓ One uppercase letter
                    </p>
                    <p className={/[a-z]/.test(password) ? "text-green-400" : "text-gray-500"}>
                      ✓ One lowercase letter
                    </p>
                    <p className={/[0-9]/.test(password) ? "text-green-400" : "text-gray-500"}>
                      ✓ One number
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Re-enter password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-400 text-sm mt-2">Passwords do not match</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1 || (step === 6 && verificationSent) || step === 7}
              className="text-white hover:bg-white/5"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            
            {step < 5 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="bg-burnt-orange hover:bg-burnt-orange/90 text-white"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : step === 5 ? (
              <Button
                onClick={() => setStep(6)}
                disabled={!canProceed()}
                className="bg-burnt-orange hover:bg-burnt-orange/90 text-white"
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : step === 7 ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="bg-neon-teal hover:bg-neon-teal/90 text-black font-bold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                Complete Setup
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}