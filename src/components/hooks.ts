import { useSyncExternalStore } from 'react';
import {
  avatarStore,
  sessionStore,
  prefStore,
  dmStore,
  type Session,
  type Avatar,
} from '../lib/store';

export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
}

export function useAvatar(): Avatar | null {
  return useSyncExternalStore(avatarStore.subscribe, avatarStore.getSnapshot, avatarStore.getServerSnapshot);
}

export function usePrefs(): { lang: string; region: string } {
  return useSyncExternalStore(prefStore.subscribe, prefStore.getSnapshot, prefStore.getServerSnapshot);
}

export function useDms(): string[] {
  return useSyncExternalStore(dmStore.subscribe, dmStore.getSnapshot, dmStore.getServerSnapshot);
}
