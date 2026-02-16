import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import BookingAuthModal from '@/components/scouts/BookingAuthModal';

export default function ScoutAvailability() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scoutId = urlParams.get('id');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: scout, isLoading } = useQuery({
    queryKey: ['scout', scoutId],
    queryFn: async () => {
      const results = await stagepro.entities.Scout.filter({ id: scoutId });
      return results[0];
    },
    enabled: !!scoutId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-8 w-32 bg-white/10 mb-8" />
          <Skeleton className="h-64 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!scout) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Scout not found</h2>
          <Button onClick={() => navigate(createPageUrl('FindScouts'))} variant="outline" className="border-white/20 text-white">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  const availabilityDates = scout.availability_dates?.map(d => parseISO(d)) || [];
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for first day to calculate offset
  const firstDayOfWeek = monthStart.getDay();
  
  const isDateAvailable = (date) => {
    return availabilityDates.some(availDate => isSameDay(availDate, date));
  };

  const handleDateClick = (date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setShowBookingModal(true);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back button */}
        <Button 
          onClick={() => navigate(createPageUrl('ScoutProfile') + `?id=${scoutId}`)}
          variant="ghost" 
          className="text-gray-400 hover:text-white mb-6 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {scout.profile_image && (
              <img 
                src={scout.profile_image} 
                alt={scout.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-black text-white">
                {scout.name}
              </h1>
              <p className="text-gray-400">Select a date to book</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-neon-teal/20 text-neon-teal border-neon-teal/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Available Dates
            </Badge>
            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
              <XCircle className="w-3 h-3 mr-1" />
              Unavailable
            </Badge>
          </div>
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              className="text-white hover:bg-white/5"
            >
              ← Previous
            </Button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-burnt-orange" />
              {format(selectedMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="ghost"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="text-white hover:bg-white/5"
            >
              Next →
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-gray-500 text-sm font-semibold py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Date cells */}
            {daysInMonth.map(date => {
              const available = isDateAvailable(date);
              const isPast = date < new Date().setHours(0, 0, 0, 0);
              const isDisabled = !available || isPast;
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square rounded-xl p-2 text-center transition-all font-semibold
                    ${available && !isPast ? 'bg-neon-teal/20 text-neon-teal border-2 border-neon-teal/40 hover:bg-neon-teal/30 hover:scale-105 cursor-pointer' : ''}
                    ${!available && !isPast ? 'bg-white/5 text-gray-600 border border-white/10' : ''}
                    ${isPast ? 'bg-transparent text-gray-700 cursor-not-allowed' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="text-lg">{format(date, 'd')}</div>
                  {available && !isPast && (
                    <div className="text-xs mt-1">✓</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-gray-400 text-sm mb-2">
              <strong className="text-white">Tip:</strong> Click any available (green) date to start booking
            </p>
            <p className="text-gray-500 text-xs">
              Gray dates are unavailable or in the past
            </p>
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      {selectedDate && (
        <BookingAuthModal
          scout={scout}
          selectedDate={selectedDate}
          open={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}