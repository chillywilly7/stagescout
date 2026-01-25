import React from 'react';
import TaskerCard from '@/components/tasker/TaskerCard';

export default function TaskerGrid({ taskers = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {taskers.length > 0 ? (
        taskers.map((tasker) => (
          <TaskerCard key={tasker.id} tasker={tasker} />
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p>No taskers found</p>
        </div>
      )}
    </div>
  );
}
