import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'audio_rental', label: 'Audio Rental' },
  { id: 'dj', label: 'DJ' },
  { id: 'photography', label: 'Photography' },
  { id: 'videography', label: 'Videography' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'full_production', label: 'Full Production' },
];

const VENUE_TYPES = [
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'popup', label: 'Pop-up' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'brand_activation', label: 'Brand Activation' },
];

const EXPERIENCE_LEVELS = [
  { id: 'local_shows', label: 'Local Shows' },
  { id: 'touring', label: 'Touring' },
  { id: 'sxsw_veteran', label: 'SXSW Veteran' },
];

const BUDGET_RANGES = [
  { id: 'under_500', label: 'Under $500', max: 500 },
  { id: '500_1000', label: '$500 – $1k', min: 500, max: 1000 },
  { id: '1000_2500', label: '$1k – $2.5k', min: 1000, max: 2500 },
  { id: '2500_5000', label: '$2.5k – $5k', min: 2500, max: 5000 },
  { id: '5000_plus', label: '$5k+', min: 5000 },
];

export default function ScoutFilters({ 
  filters, 
  setFilters, 
  onReset,
  isMobile = false,
  onClose 
}) {
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key]?.includes(value)
        ? prev[key].filter(v => v !== value)
        : [...(prev[key] || []), value]
    }));
  };

  return (
    <div className={cn(
      "bg-white/5 border border-white/10 rounded-2xl p-5",
      isMobile && "fixed inset-0 z-50 overflow-y-auto"
    )}>
      {isMobile && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {!isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Filters</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Services */}
        <div>
          <Label className="text-white mb-3 block">Service Type</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map(s => (
              <button
                key={s.id}
                onClick={() => toggleArrayFilter('services', s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  filters.services?.includes(s.id)
                    ? "bg-burnt-orange text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Type */}
        <div>
          <Label className="text-white mb-3 block">Venue Compatibility</Label>
          <div className="flex flex-wrap gap-2">
            {VENUE_TYPES.map(v => (
              <button
                key={v.id}
                onClick={() => toggleArrayFilter('venueTypes', v.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  filters.venueTypes?.includes(v.id)
                    ? "bg-neon-teal text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <Label className="text-white mb-3 block">Experience Level</Label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map(e => (
              <button
                key={e.id}
                onClick={() => toggleArrayFilter('experienceLevels', e.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  filters.experienceLevels?.includes(e.id)
                    ? "bg-electric-purple text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <Label className="text-white mb-3 block">Budget Range</Label>
          <div className="space-y-2">
            {BUDGET_RANGES.map(b => (
              <button
                key={b.id}
                onClick={() => updateFilter('budget', filters.budget === b.id ? '' : b.id)}
                className={cn(
                  "w-full px-4 py-2 rounded-lg text-sm text-left transition-all",
                  filters.budget === b.id
                    ? "bg-burnt-orange/20 text-burnt-orange border border-burnt-orange/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Last minute availability */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <Label className="text-white">Last-minute available only</Label>
          <Switch
            checked={filters.lastMinuteOnly || false}
            onCheckedChange={(checked) => updateFilter('lastMinuteOnly', checked)}
          />
        </div>


      </div>

      {isMobile && (
        <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex-1 border-white/20"
          >
            Reset
          </Button>
          <Button 
            onClick={onClose}
            className="flex-1 bg-burnt-orange hover:bg-burnt-orange/90"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}