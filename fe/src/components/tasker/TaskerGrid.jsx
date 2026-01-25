
import React from 'react';
import TaskerCard from './TaskerCard';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TaskerGrid({ taskers, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-slate-100 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!taskers || taskers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No professionals found</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Try adjusting your search criteria or expanding your search area to find more service providers.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {taskers.map((tasker, index) => (
        <TaskerCard key={tasker.id} tasker={tasker} index={index} />
      ))}
    </div>
  );
}