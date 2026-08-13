import { useSyncExternalStore } from 'react';
import { sessionStore, dmStore, type Session } from '../lib/store';

export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
}

export function useDms(): string[] {
  return useSyncExternalStore(dmStore.subscribe, dmStore.getSnapshot, dmStore.getServerSnapshot);
}
