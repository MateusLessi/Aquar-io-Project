import { createContext, useContext } from 'react';

import { useLiveQuery } from '../database/useLiveQuery';
import type { ProfileRepository } from './profileRepository';

export const ProfileContext = createContext<ProfileRepository | null>(null);

export function useProfileRepository(): ProfileRepository {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfileRepository must be used inside ProfileContext.');
  return profile;
}

/** The person's name and avatar, live (also when another device changes them). */
export function useProfile() {
  const profile = useProfileRepository();
  return useLiveQuery('profile', ['profile'], () => profile.get());
}
