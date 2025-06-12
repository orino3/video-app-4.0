'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Using the structure from authStore
interface TeamMembership {
  id: string;
  name: string;
  sport: string;
  role: string;
  jersey_number?: number | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export default function ProfileForm() {
  const { user } = useAuth();
  const { teams } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
        })
        .eq('id', user.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh auth state to update user info
        const {
          data: { user: updatedUser },
        } = await supabase.auth.getUser();
        if (updatedUser) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', updatedUser.id)
            .single();
          if (profile) {
            useAuthStore.getState().setUser(profile);
          }
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });

      // Refresh auth state
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();
      if (updatedUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', updatedUser.id)
          .single();
        if (profile) {
          useAuthStore.getState().setUser(profile);
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Message Display */}
      {message && (
        <div
          className={`rounded-md p-4 mb-6 ${
            message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Contact support to change email
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </div>

          {/* Team Memberships */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Team Memberships
            </h2>

            {teams.length === 0 ? (
              <p className="text-gray-500">
                You are not a member of any teams yet.
              </p>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">
                        {team.sport} •{' '}
                        {team.organization?.name || 'Organization'}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {team.role}
                        </span>
                        {team.jersey_number && (
                          <span className="text-sm text-gray-600">
                            Jersey #{team.jersey_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {new Date(team.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Use the "Forgot Password" option on the login page to reset
                  your password.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Account Created
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {user
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Avatar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Profile Picture
            </h2>

            <div className="flex flex-col items-center">
              {/* Avatar Display */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-gray-400">
                      {formData.full_name?.charAt(0).toUpperCase() ||
                        formData.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </label>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                JPG, GIF or PNG. Max size 5MB.
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account Actions
            </h2>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    createClient().auth.signOut();
                  }
                }}
              >
                Sign Out
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Need to delete your account? <br />
                Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
