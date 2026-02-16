import React, { useState, useEffect } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery } from '@tanstack/react-query';
import ScoutCard from '@/components/scouts/ScoutCard';
import ScoutFilters from '@/components/scouts/ScoutFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FindScouts() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    services: urlParams.get('services')?.split(',').filter(Boolean) || [],
    venueTypes: urlParams.get('venue') ? [urlParams.get('venue')] : [],
    experienceLevels: [],
    budget: urlParams.get('budget') || '',
    lastMinuteOnly: false,
    maxTurnaround: null
  });

  const { data: scoutsRaw = [], isLoading } = useQuery({
    queryKey: ['scouts'],
    queryFn: () => stagepro.entities.Scout.list('-sxsw_years', 100)
  });

  // Sort scouts: verified first, then by rating, then by SXSW years
  const scouts = React.useMemo(() => {
    return [...scoutsRaw].sort((a, b) => {
      // Verified badge trumps everything
      if (a.is_verified && !b.is_verified) return -1;
      if (!a.is_verified && b.is_verified) return 1;
      
      // Then by rating
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      
      // Then by SXSW years
      return (b.sxsw_years || 0) - (a.sxsw_years || 0);
    });
  }, [scoutsRaw]);

  const filteredScouts = scouts.filter(scout => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = scout.name?.toLowerCase().includes(query);
      const matchesGear = scout.gear_highlights?.some(g => g.toLowerCase().includes(query));
      const matchesTags = scout.style_tags?.some(t => t.toLowerCase().includes(query));
      if (!matchesName && !matchesGear && !matchesTags) return false;
    }

    // Services filter
    if (filters.services.length > 0) {
      const hasService = filters.services.some(s => scout.services?.includes(s));
      if (!hasService) return false;
    }

    // Venue types
    if (filters.venueTypes.length > 0) {
      const hasVenue = filters.venueTypes.some(v => scout.venue_types?.includes(v));
      if (!hasVenue) return false;
    }

    // Experience levels
    if (filters.experienceLevels.length > 0) {
      if (!filters.experienceLevels.includes(scout.experience_level)) return false;
    }

    // Budget
    if (filters.budget) {
      const budgetRanges = {
        'under_500': { max: 500 },
        '500_1000': { min: 500, max: 1000 },
        '1000_2500': { min: 1000, max: 2500 },
        '2500_5000': { min: 2500, max: 5000 },
        '5000_plus': { min: 5000 }
      };
      const range = budgetRanges[filters.budget];
      if (range) {
        if (range.max && scout.budget_min > range.max) return false;
        if (range.min && scout.budget_max && scout.budget_max < range.min) return false;
      }
    }

    // Last minute only
    if (filters.lastMinuteOnly && !scout.available_last_minute) return false;

    // Turnaround
    if (filters.maxTurnaround && scout.turnaround_days > filters.maxTurnaround) return false;

    return true;
  });

  const resetFilters = () => {
    setFilters({
      services: [],
      venueTypes: [],
      experienceLevels: [],
      budget: '',
      lastMinuteOnly: false,
      maxTurnaround: null
    });
    setSearchQuery('');
  };

  const activeFilterCount = [
    filters.services.length > 0,
    filters.venueTypes.length > 0,
    filters.experienceLevels.length > 0,
    filters.budget,
    filters.lastMinuteOnly,
    filters.maxTurnaround
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-3">
            Find StagePros
          </h1>
          <p className="text-gray-400 text-lg">
            Browse Austin's best StagePros
          </p>
        </div>

        {/* Search & Mobile Filter Toggle */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, gear, or style..."
              className="pl-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500 h-12"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden border-white/20 text-white h-12 relative"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange rounded-full text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-4">
              <ScoutFilters 
                filters={filters} 
                setFilters={setFilters} 
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <span className="text-white font-semibold">{filteredScouts.length}</span> StagePros found
                  </>
                  )}
                  </p>
                  {activeFilterCount > 0 && (
                  <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-burnt-orange hover:text-burnt-orange/80"
                  >
                  Clear all filters
                  </Button>
                  )}
                  </div>

                  {/* StagePros list */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 rounded-2xl p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-48 h-32 rounded-xl bg-white/10" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-48 bg-white/10" />
                        <Skeleton className="h-4 w-32 bg-white/10" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20 bg-white/10" />
                          <Skeleton className="h-6 w-20 bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredScouts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No StagePros found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={resetFilters} variant="outline" className="border-white/20 text-white">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredScouts.map((scout, idx) => (
                    <ScoutCard 
                      key={scout.id} 
                      scout={scout} 
                      index={idx}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal lg:hidden"
          >
            <ScoutFilters
              filters={filters}
              setFilters={setFilters}
              onReset={resetFilters}
              isMobile={true}
              onClose={() => setShowMobileFilters(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}