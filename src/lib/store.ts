/* Shared client store.
 *
 * Lightweight singleton stores backed by localStorage that components can
 * subscribe to. `useSyncExternalStore` lets separate Astro islands stay in
 * sync because they all read/write these same module instances.
 */

type Listener = () => void;

const SESSION_KEY = 'heredita.session';
const AVATAR_KEY = 'heredita.avatar';
const PREF_KEY = 'heredita.prefs';
const DM_KEY = 'heredita.chat.dms';

/* ---- tiny observable ---- */
function makeStore<T>(read: () => T, serverSnapshot: () => T) {
  const listeners = new Set<Listener>();
  return {
    subscribe(cb: Listener) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getSnapshot: read,
    getServerSnapshot: serverSnapshot,
    notify() {
      listeners.forEach((cb) => cb());
    },
  };
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}
function readJSON(key: string): any {
  if (!hasStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: any) {
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---- session ---- */
export interface Session {
  uid?: number | null;
  username?: string;
  token?: string;
  rank?: string;
  guest?: boolean;
  tier?: string;
  coins?: number;
  freeHatClaimed?: boolean;
}

function getSessionRaw(): Session | null {
  return readJSON(SESSION_KEY);
}
export const sessionStore = makeStore<Session | null>(getSessionRaw, () => null);

/* Cross-subdomain auth handoff via a shared `.heredita.net` cookie so the
 * game at app.heredita.net auto-recognizes the signed-in user. */
function syncAuthCookie(session: Session | null) {
  const onHeredita =
    typeof location !== 'undefined' &&
    (location.hostname === 'heredita.net' ||
      location.hostname.endsWith('.heredita.net'));
  if (!onHeredita) return;
  const signedIn =
    session && session.token && session.username && !session.guest;
  if (signedIn) {
    const payload = btoa(
      JSON.stringify({
        token: session.token,
        username: session.username,
        ts: Date.now(),
      })
    );
    const exp = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toUTCString();
    document.cookie = `heredita_auth=${payload}; Domain=.heredita.net; Path=/; Expires=${exp}; Secure; SameSite=Lax`;
  } else {
    document.cookie =
      'heredita_auth=; Domain=.heredita.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax';
  }
}

export function getSession(): Session | null {
  return getSessionRaw();
}
export function setSession(s: Session) {
  writeJSON(SESSION_KEY, s);
  syncAuthCookie(s);
  sessionStore.notify();
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  syncAuthCookie(null);
  sessionStore.notify();
}
export function isSignedIn(): boolean {
  const s = getSession();
  return !!(s && s.token && !s.guest && s.username);
}

/* ---- tier helpers ---- */
export const TIER_LABEL: Record<string, string> = {
  guest: 'Guest',
  regular: 'Regular',
  emperor: 'Emperor',
};
const PAID_TIERS = ['emperor'];
export function isTierPaid(tier?: string) {
  return PAID_TIERS.includes(tier || '');
}
export function getTier(): string {
  const s = getSession();
  if (!s) return 'guest';
  return s.tier || (s.guest ? 'guest' : 'regular');
}
export function canSwitchTier(
  targetTier: string
): { ok: true } | { ok: false; reason: 'paid' | 'needs-signup' | 'needs-signout' } {
  const current = getTier();
  if (targetTier === current) return { ok: true };
  if (isTierPaid(targetTier)) return { ok: false, reason: 'paid' };
  if (current === 'guest' && targetTier === 'regular')
    return { ok: false, reason: 'needs-signup' };
  if (current === 'regular' && targetTier === 'guest')
    return { ok: false, reason: 'needs-signout' };
  return { ok: true };
}

/* ---- avatar ---- */
export interface Avatar {
  country: string;
  hat: string;
  eyes: string;
  mouth: string;
  prop: string;
}
function getAvatarRaw(): Avatar | null {
  return readJSON(AVATAR_KEY);
}
export const avatarStore = makeStore<Avatar | null>(getAvatarRaw, () => null);
export function getAvatar(): Avatar | null {
  return getAvatarRaw();
}
export function saveAvatar(a: Avatar) {
  writeJSON(AVATAR_KEY, a);
  avatarStore.notify();
}
export function clearAvatar() {
  localStorage.removeItem(AVATAR_KEY);
  avatarStore.notify();
}

/* ---- prefs (language + region) ---- */
function getPrefsRaw(): { lang: string; region: string } {
  return Object.assign(
    { lang: 'en', region: 'Worldwide' },
    readJSON(PREF_KEY) || {}
  );
}
export const prefStore = makeStore(getPrefsRaw, () => ({ lang: 'en', region: 'Worldwide' }));
export function getPrefs() {
  return getPrefsRaw();
}
export function setPrefs(p: { lang: string; region: string }) {
  writeJSON(PREF_KEY, p);
  prefStore.notify();
}

/* ---- DMs ---- */
function getDmListRaw(): string[] {
  const v = readJSON(DM_KEY);
  return Array.isArray(v) ? v : [];
}
export const dmStore = makeStore<string[]>(getDmListRaw, () => []);
export function loadDmList(): string[] {
  return getDmListRaw();
}
export function saveDmList(arr: string[]) {
  writeJSON(DM_KEY, arr);
  dmStore.notify();
}

/* ---- toast + lightbox host ---- */
export function toast(msg: string, ms = 2400) {
  let el = document.querySelector<HTMLElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout((el as any)._t);
  (el as any)._t = setTimeout(() => el.classList.remove('show'), ms);
}
