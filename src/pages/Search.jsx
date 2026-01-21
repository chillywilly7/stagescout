import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search as SearchIcon, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TaskerGrid from '@/components/taskers/TaskerGrid';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { id: 'all', label: 'All Services' },
  { id: 'dj', label: 'DJ Services' },
  { id: 'audio_rental', label: 'Audio Rental' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'photographer', label: 'Photography' },
  { id: 'live_music', label: 'Live Music' },
];

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialZip = urlParams.get('zip') || '';
  const initialCategory = urlParams.get('category') || 'all';

  const [zipCode, setZipCode] = useState(initialZip);
  const [searchZip, setSearchZip] = useState(initialZip);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: taskers, isLoading, refetch } = useQuery({
    queryKey: ['taskers', searchZip, category, priceRange],
    queryFn: async () => {
      let allTaskers = await base44.entities.Tasker.list('-average_rating');
      
      // Filter by zip code if provided
      if (searchZip) {
        allTaskers = allTaskers.filter(t => t.zip_code === searchZip || t.zip_code?.startsWith(searchZip.substring(0, 3)));
      }
      
      // Filter by category
      if (category && category !== 'all') {
        allTaskers = allTaskers.filter(t => t.service_category === category);
      }
      
      // Filter by price range
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        allTaskers = allTaskers.filter(t => t.hourly_rate >= min && (!max || t.hourly_rate <= max));
      }
      
      return allTaskers;
    },
    initialData: [],
  });

  const handleSearch = () => {
    setSearchZip(zipCode);
  };

  const activeFiltersCount = [
    category !== 'all',
    priceRange !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Search Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-20 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              <Input
                type="text"
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-14 pl-12 pr-4 rounded-2xl bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-14 px-5 rounded-2xl border-slate-700 bg-slate-800 text-white hover:bg-slate-700 relative"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={handleSearch}
                className="h-14 px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-2xl font-semibold shadow-lg shadow-red-500/25"
              >
                <SearchIcon className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-3 gap-4 pt-5 pb-2">
                  <div>
                    <label className="text-sm font-medium text-slate-400 mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-white focus:bg-slate-700">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400 mb-2 block">Price Range</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white focus:bg-slate-700">Any Price</SelectItem>
                        <SelectItem value="0-50" className="text-white focus:bg-slate-700">Under $50/hr</SelectItem>
                        <SelectItem value="50-100" className="text-white focus:bg-slate-700">$50 - $100/hr</SelectItem>
                        <SelectItem value="100-200" className="text-white focus:bg-slate-700">$100 - $200/hr</SelectItem>
                        <SelectItem value="200-99999" className="text-white focus:bg-slate-700">$200+/hr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCategory('all');
                        setPriceRange('all');
                      }}
                      className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {searchZip ? `Professionals near ${searchZip}` : 'All Professionals'}
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              {taskers?.length || 0} result{taskers?.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <TaskerGrid taskers={taskers} isLoading={isLoading} />
      </div>
    </div>
  );
}


