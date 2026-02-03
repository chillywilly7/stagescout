import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Volume2, Disc3, Camera, Video, Lightbulb, Clapperboard,
  CalendarDays, Clock, MapPin, DollarSign, ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'audio_rental', icon: Volume2, label: 'Audio Rental', color: 'border-neon-teal text-neon-teal bg-neon-teal/10' },
  { id: 'dj', icon: Disc3, label: 'DJ', color: 'border-electric-purple text-electric-purple bg-electric-purple/10' },
  { id: 'photography', icon: Camera, label: 'Photography', color: 'border-burnt-orange text-burnt-orange bg-burnt-orange/10' },
  { id: 'videography', icon: Video, label: 'Videography', color: 'border-warm-red text-warm-red bg-warm-red/10' },
  { id: 'lighting', icon: Lightbulb, label: 'Lighting', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
  { id: 'full_production', icon: Clapperboard, label: 'Full Production', color: 'border-pink-500 text-pink-500 bg-pink-500/10' },
];

const VENUE_TYPES = [
  { id: 'indoor', label: 'Indoor Venue' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'popup', label: 'Pop-up' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'brand_activation', label: 'Brand Activation' },
];

const AREAS = [
  { id: 'downtown', label: 'Downtown' },
  { id: 'east_austin', label: 'East Austin' },
  { id: 'red_river', label: 'Red River' },
  { id: 'south_austin', label: 'South Austin' },
  { id: 'north_austin', label: 'North Austin' },
  { id: 'other', label: 'Other' },
];

const BUDGET_RANGES = [
  { id: 'under_500', label: 'Under $500' },
  { id: '500_1000', label: '$500 – $1,000' },
  { id: '1000_2500', label: '$1,000 – $2,500' },
  { id: '2500_5000', label: '$2,500 – $5,000' },
  { id: '5000_plus', label: '$5,000+' },
];

const TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
  '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM'
];

export default function BookingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    services: [],
    date: null,
    startTime: '',
    endTime: '',
    isMultiday: false,
    venueType: '',
    venueArea: '',
    budget: ''
  });

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.services.length > 0;
      case 2: return formData.date && formData.startTime && formData.endTime;
      case 3: return formData.venueType;
      case 4: return formData.budget;
      default: return true;
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (formData.services.length) params.set('services', formData.services.join(','));
    if (formData.date) params.set('date', format(formData.date, 'yyyy-MM-dd'));
    if (formData.venueType) params.set('venue', formData.venueType);
    if (formData.budget) params.set('budget', formData.budget);
    
    navigate(createPageUrl('FindScouts') + '?' + params.toString());
  };

  const stepIndicators = [
    { num: 1, icon: Volume2, label: 'Service' },
    { num: 2, icon: CalendarDays, label: 'Timing' },
    { num: 3, icon: MapPin, label: 'Venue' },
    { num: 4, icon: DollarSign, label: 'Budget' },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
      {/* Step indicators */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
        {stepIndicators.map((s, idx) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center">
            <button
              onClick={() => step > s.num && setStep(s.num)}
              disabled={step < s.num}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                step === s.num && "bg-burnt-orange text-white",
                step > s.num && "bg-neon-teal text-black cursor-pointer",
                step < s.num && "bg-white/10 text-gray-500"
              )}
            >
              {step > s.num ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </button>
            <span className={cn(
              "text-xs mt-2 hidden sm:block",
              step >= s.num ? "text-white" : "text-gray-500"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Service Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">What services do you need?</h3>
              <p className="text-gray-400">Select one or more</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceToggle(service.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    formData.services.includes(service.id)
                      ? service.color
                      : "border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  <service.icon className="w-6 h-6 mb-2" />
                  <span className="font-medium">{service.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Timing */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">When's the event?</h3>
              <p className="text-gray-400">SXSW 2026 runs March 7-16</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-white mb-2 block">Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-white/5 border-white/20 text-white hover:bg-white/10">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-charcoal border-white/20">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                      className="bg-charcoal text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white mb-2 block">Start Time</Label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white"
                  >
                    <option value="">Select</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-white mb-2 block">End Time</Label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white"
                  >
                    <option value="">Select</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <Switch
                checked={formData.isMultiday}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMultiday: checked }))}
              />
              <Label className="text-white">Multi-day / Recurring SXSW event</Label>
            </div>
          </motion.div>
        )}

        {/* Step 3: Venue */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Venue context</h3>
              <p className="text-gray-400">What kind of setup?</p>
            </div>
            
            <div>
              <Label className="text-white mb-3 block">Venue Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VENUE_TYPES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setFormData(prev => ({ ...prev, venueType: v.id }))}
                    className={cn(
                      "p-4 rounded-xl border transition-all font-medium",
                      formData.venueType === v.id
                        ? "border-burnt-orange bg-burnt-orange/10 text-burnt-orange"
                        : "border-white/10 text-gray-400 hover:border-white/30"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-white mb-3 block">Area (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {AREAS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      venueArea: prev.venueArea === a.id ? '' : a.id 
                    }))}
                    className={cn(
                      "px-4 py-2 rounded-full border transition-all text-sm",
                      formData.venueArea === a.id
                        ? "border-neon-teal bg-neon-teal/10 text-neon-teal"
                        : "border-white/10 text-gray-400 hover:border-white/30"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Budget */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">What's your budget?</h3>
              <p className="text-gray-400">Helps us find the right match</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              {BUDGET_RANGES.map(b => (
                <button
                  key={b.id}
                  onClick={() => setFormData(prev => ({ ...prev, budget: b.id }))}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left font-medium",
                    formData.budget === b.id
                      ? "border-neon-teal bg-neon-teal/10 text-neon-teal"
                      : "border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="text-white hover:bg-white/5"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="bg-burnt-orange hover:bg-burnt-orange/90 text-white"
          >
            Continue
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSearch}
            disabled={!canProceed()}
            className="bg-neon-teal hover:bg-neon-teal/90 text-black font-semibold"
          >
            Find Scouts
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}