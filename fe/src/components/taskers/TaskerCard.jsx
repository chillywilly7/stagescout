import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, DollarSign } from 'lucide-react';

export default function TaskerCard({ tasker = {} }) {
  const {
    id,
    full_name = 'Unknown Tasker',
    avatar_url,
    rating = 0,
    review_count = 0,
    hourly_rate = 0,
    location = 'Not specified',
    skills = [],
    bio = ''
  } = tasker;

  return (
    <Link to={`/tasker/${id}`}>
      <Card className="bg-slate-900 border-slate-700 hover:border-red-500 transition-colors duration-300 cursor-pointer h-full flex flex-col overflow-hidden group">
        <CardHeader className="p-0 relative overflow-hidden h-40">
          <img
            src={avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'}
            alt={full_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-semibold">{rating.toFixed(1)}</span>
            {review_count > 0 && <span className="text-white/60 text-xs">({review_count})</span>}
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-grow">
          <h3 className="text-white font-bold text-lg mb-2 truncate">{full_name}</h3>
          
          <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white font-semibold">${hourly_rate}/hr</span>
          </div>

          {bio && (
            <p className="text-white/60 text-sm line-clamp-2 mb-3">{bio}</p>
          )}

          {skills && skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-red-500/20 text-red-300 text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="secondary" className="bg-slate-700 text-white text-xs">
                  +{skills.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold">
            View Profile
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
