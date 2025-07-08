'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProfileForm } from '@/components/profile-form';
import { getProfile } from '@/lib/actions';
import { Profile } from '@/db/schema';

export function ProfileClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load profile when user is authenticated
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    const result = await getProfile(user.id);
    if (result?.data) {
      setProfile(result.data);
    }
    setProfileLoading(false);
  };

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show profile if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and avatar.
        </p>
      </div>

      {profileLoading ? (
        <div className="text-center py-8">
          <p>Loading profile...</p>
        </div>
      ) : (
        <ProfileForm 
          userId={user.id} 
          initialData={profile || undefined}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
} 