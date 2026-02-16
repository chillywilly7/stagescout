import React, { useState, useEffect } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, UserRound, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// Debounce hook for real-time validation
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProfileForm({ customer }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [profileImage, setProfileImage] = useState(customer?.profile_image || '');
  const [uploading, setUploading] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState({ checking: false, valid: null, message: '' });
  const [saved, setSaved] = useState(false);

  const debouncedPhone = useDebounce(phone, 500);

  // Real-time phone validation via backend
  useEffect(() => {
    const normalizedCurrent = phone.replace(/\D/g, '');
    const normalizedOriginal = (customer?.phone || '').replace(/\D/g, '');

    // If phone hasn't changed from original, skip validation
    if (normalizedCurrent === normalizedOriginal) {
      setPhoneStatus({ checking: false, valid: null, message: '' });
      return;
    }

    const phoneDigits = debouncedPhone.replace(/\D/g, '');
    if (!debouncedPhone || phoneDigits.length === 0) {
      setPhoneStatus({ checking: false, valid: null, message: '' });
      return;
    }
    if (phoneDigits.length < 10) {
      setPhoneStatus({ checking: false, valid: false, message: 'Phone number must be exactly 10 digits (US format)' });
      return;
    }

    const checkPhone = async () => {
      setPhoneStatus({ checking: true, valid: null, message: 'Checking...' });
      try {
        const result = await stagepro.auth.checkPhone(debouncedPhone, customer?.user_type || 'customer');
        if (result.valid === false) {
          setPhoneStatus({ checking: false, valid: false, message: result.error || 'Invalid phone format' });
        } else if (result.exists) {
          const existingType = result.user_type || 'user';
          const message = existingType === 'pro'
            ? 'Phone registered as Pro account'
            : 'Phone already registered';
          setPhoneStatus({ checking: false, valid: false, message });
        } else {
          setPhoneStatus({ checking: false, valid: true, message: 'Phone available' });
        }
      } catch (err) {
        setPhoneStatus({ checking: false, valid: null, message: '' });
      }
    };
    checkPhone();
  }, [debouncedPhone]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      await stagepro.entities.CustomerAccount.update(customer.id, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customerAccount', customer.email]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      toast.error('Failed to update profile');
    }
  });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await stagepro.integrations.Core.UploadFile({ file });
      setProfileImage(file_url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    }
    setUploading(false);
  };

  const phoneChanged = phone.replace(/\D/g, '') !== (customer?.phone || '').replace(/\D/g, '');
  const isPhoneInvalid = phoneChanged && phoneStatus.valid === false;
  const isPhoneChecking = phoneChanged && phoneStatus.checking;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    // Check digit count directly in case debounce hasn't fired yet
    if (phoneChanged && phone.trim()) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith('1'))) {
        toast.error('Phone number must be exactly 10 digits (US format)');
        return;
      }
    }
    if (isPhoneInvalid) {
      toast.error(phoneStatus.message || 'Please fix the phone number before saving');
      return;
    }
    if (isPhoneChecking) {
      toast.error('Please wait for phone validation to complete');
      return;
    }
    const updatedData = { name, phone, profile_image: profileImage };
    await updateProfileMutation.mutateAsync(updatedData);
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserRound className="w-5 h-5 text-burnt-orange" />
          Your Profile
        </CardTitle>
        <CardDescription className="text-gray-400">
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <Label className="text-white mb-2 block">Profile Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {profileImage ?
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> :

                <UserRound className="w-12 h-12 text-gray-400" />
                }
              </div>
              <div>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploading} />

                <Label htmlFor="profile-image">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="border-white/20 text-white hover:bg-white/10"
                    asChild>

                    <span className="bg-stone-600 text-white px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10 cursor-pointer flex">
                      {uploading ?
                      <Loader2 className="w-4 h-4 animate-spin" /> :

                      <Upload className="w-4 h-4" />
                      }
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-white mb-2 block">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-white/5 border-white/20 text-white" />

          </div>

          <div>
            <Label htmlFor="phone" className="text-white mb-2 block">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(512) 555-0123"
              className={`bg-white/5 border-white/20 text-white ${phoneChanged && phoneStatus.valid === false ? 'border-red-500' : ''} ${phoneChanged && phoneStatus.valid === true ? 'border-green-500' : ''}`} />
            {phoneStatus.checking && (
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{phoneStatus.message}</span>
              </div>
            )}
            {!phoneStatus.checking && phoneStatus.valid === true && (
              <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                <Check className="w-3 h-3" />
                <span>{phoneStatus.message}</span>
              </div>
            )}
            {!phoneStatus.checking && phoneStatus.valid === false && (
              <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                <X className="w-3 h-3" />
                <span>{phoneStatus.message}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={updateProfileMutation.isPending || isPhoneInvalid || isPhoneChecking || saved}
            className={`w-full text-white transition-colors duration-300 ${
              saved
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-burnt-orange hover:bg-burnt-orange/90'
            }`}>

            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Changes Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>);

}