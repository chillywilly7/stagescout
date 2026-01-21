import React from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="pb-6 border-b border-slate-100 last:border-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-900">{review.reviewer_name}</h4>
              {review.event_type && (
                <p className="text-sm text-slate-500">{review.event_type}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">{review.comment}</p>
          <p className="text-sm text-slate-400 mt-3">
            {format(new Date(review.created_date), 'MMMM d, yyyy')}
          </p>
        </div>
      ))}
    </div>
  );
}

