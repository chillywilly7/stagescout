import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BookingForm({ tasker, isOpen, onClose, onSuccess, user }) {
  const [formData, setFormData] = useState({
    event_date: '',
    start_time: '',
    end_time: '',
    event_location: '',
    event_zip_code: '',
    event_type: '',
    special_requests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotal = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    const hours = (end - start) / (1000 * 60 * 60);
    return Math.max(0, hours * tasker.hourly_rate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const booking = await base44.entities.Booking.create({
      ...formData,
      tasker_id: tasker.id,
      tasker_name: tasker.name,
      client_email: user.email,
      client_name: user.full_name,
      estimated_total: calculateTotal(),
      status: 'pending',
    });

    // Send initial message
    await base44.entities.Message.create({
      booking_id: booking.id,
      sender_email: user.email,
      sender_name: user.full_name,
      recipient_email: tasker.email,
      content: `Hi ${tasker.name}! I'd like to book you for my ${formData.event_type || 'event'} on ${formData.event_date}. Looking forward to hearing from you!`,
      is_read: false,
    });

    setIsSubmitting(false);
    onSuccess(booking);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Book {tasker.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Event Date
              </Label>
              <Input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Event Type</Label>
              <Input
                type="text"
                placeholder="Wedding, Party, Corporate..."
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                Start Time
              </Label>
              <Input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                End Time
              </Label>
              <Input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-slate-400" />
              Event Location
            </Label>
            <Input
              type="text"
              placeholder="Full address"
              required
              value={formData.event_location}
              onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Event Zip Code</Label>
            <Input
              type="text"
              placeholder="12345"
              required
              value={formData.event_zip_code}
              onChange={(e) => setFormData({ ...formData, event_zip_code: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Special Requests</Label>
            <Textarea
              placeholder="Any specific requirements or notes..."
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-5 h-5" />
              Estimated Total
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${calculateTotal().toFixed(2)}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-lg font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              'Send Booking Request'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

