import React, { useState } from 'react';
import { stagepro } from '@/api/stageproClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileForm({ customer }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [profileImage, setProfileImage] = useState(customer?.profile_image || '');
  const [uploading, setUploading] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      await stagepro.entities.CustomerAccount.update(customer.id, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customerAccount', customer.email]);
      toast.success('Profile updated successfully!');
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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
              className="bg-white/5 border-white/20 text-white" />

          </div>

          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white">

            {updateProfileMutation.isPending ?
            <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </> :

            <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            }
          </Button>
        </form>
      </CardContent>
    </Card>);

}