'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProfile, uploadAvatar, deleteAvatar } from '@/lib/actions';
import { Profile } from '@/db/schema';
import { User, Upload, X, Loader2 } from 'lucide-react';

interface ProfileFormProps {
  userId: string;
  initialData?: Profile;
  userEmail: string;
}

export function ProfileForm({ userId, initialData, userEmail }: ProfileFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    const result = await updateProfile(userId, name, avatarUrl);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess('Profile updated successfully!');
    }
    
    setIsLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    // File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadAvatar(file, userId);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.data) {
        setAvatarUrl(result.data);
        setSuccess('Avatar uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) {
      setAvatarUrl('');
      setSuccess('Avatar removed');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteAvatar(avatarUrl);
      
      if (result?.error) {
        setError(result.error);
      } else {
        setAvatarUrl('');
        setSuccess('Avatar removed successfully');
      }
    } catch (error) {
      console.error('Remove avatar error:', error);
      setError('Failed to remove avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={userEmail}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Avatar
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <>
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <User className="w-8 h-8 text-muted-foreground" />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading || isLoading}
              />
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading || isLoading}
                className="flex items-center gap-2"
                onClick={() => {
                  document.getElementById('avatar-upload')?.click();
                }}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload Avatar'}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading || isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              )}

            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
            {success}
          </div>
        )}

        <Button type="submit" disabled={isLoading || isUploading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  );
} 