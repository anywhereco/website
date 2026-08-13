/* Global site chrome: scroll-reveal, chalk-dust, and the shared "Play"
 * launch behavior for any element tagged with [data-play]. This runs once
 * per page (inlined by BaseLayout), mirroring the old app.js site-wide
 * behaviors that operate on static markup rather than a single island. */

import { BASE, PLAY_URL } from '../lib/heredita-api';

function wireReveal() {
  const els = Array.from(document.querySelectorAll('.reveal:not(.in)'));
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((e) => io.observe(e));
}

export function rewireReveal() {
  wireReveal();
}

function hasSession() {
  try {
    return JSON.parse(localStorage.getItem('heredita.session') || 'null');
  } catch {
    return null;
  }
}

function buildPlayURL(): string {
  const s = hasSession();
  if (!s || !s.token || s.guest) return PLAY_URL;
  const hash = new URLSearchParams({
    token: s.token,
    username: s.username || '',
  }).toString();
  return PLAY_URL + '#' + hash;
}

function wirePlayCtas() {
  document.querySelectorAll('[data-play]').forEach((el) => {
    const refreshHref = () => {
      const url = buildPlayURL();
      if (el.tagName === 'A') {
        el.setAttribute('href', url);
        el.setAttribute('rel', 'noopener');
      }
      return url;
    };
    refreshHref();
    el.addEventListener('click', (e) => {
      const url = refreshHref();
      window.location.href = url;
    });
  });
}

export function initSiteChrome() {
  ensureSessionHealth();
  wireReveal();
  wirePlayCtas();
}

/* ---- session health: run once per load, mirroring the old app.js init ---- */
function hasStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}
function getSession() {
  if (!hasStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem('heredita.session') || 'null');
  } catch {
    return null;
  }
}
function setSessionStore(s: any) {
  if (!hasStorage()) return;
  localStorage.setItem('heredita.session', JSON.stringify(s));
  syncAuthCookie(s);
}
function clearSessionStore() {
  if (!hasStorage()) return;
  localStorage.removeItem('heredita.session');
  syncAuthCookie(null);
}
function syncAuthCookie(session: any) {
  if (typeof location === 'undefined') return;
  const onHeredita =
    location.hostname === 'heredita.net' || location.hostname.endsWith('.heredita.net');
  if (!onHeredita) return;
  const signedIn = session && session.token && session.username && !session.guest;
  if (signedIn) {
    const payload = btoa(
      JSON.stringify({ token: session.token, username: session.username, ts: Date.now() })
    );
    const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `heredita_auth=${payload}; Domain=.heredita.net; Path=/; Expires=${exp}; Secure; SameSite=Lax`;
  } else {
    document.cookie =
      'heredita_auth=; Domain=.heredita.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax';
  }
}
function getTier(s: any): string {
  return s ? s.tier || (s.guest ? 'guest' : 'regular') : 'guest';
}
const PAID = ['emperor'];
function isTierPaid(t?: string) {
  return PAID.includes(t || '');
}

// Sanitize any previously-stored paid tier (pre-paywall leftovers).
function sanitizeStoredTier() {
  const s = getSession();
  if (s && isTierPaid(s.tier)) {
    s.tier = s.guest ? 'guest' : 'regular';
    setSessionStore(s);
  }
}

// Free-hat promo: Regular tier gets a tophat until 2026-08-28.
// (The avatar engine is removed, so this just records the claim.)
const FREE_HAT_DEADLINE = new Date('2026-08-28T23:59:59');
function applyFreeHatIfEligible() {
  const s = getSession();
  if (!s || s.freeHatClaimed || getTier(s) !== 'regular') return;
  if (new Date() > FREE_HAT_DEADLINE) return;
  if (!hasStorage()) return;
  s.freeHatClaimed = true;
  setSessionStore(s);
}

// Verify stored game-API token in the background; demote to guest if expired.
async function verifyStoredToken() {
  const s = getSession();
  if (!s || !s.token || !s.username || s.guest) return;
  try {
    const res = await fetch(
      `${BASE}/users/verify/id?${new URLSearchParams({ username: s.username, token: s.token })}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const id = await res.json();
      if (typeof id === 'number' && id >= 0) return;
    }
    if (res.status === 0 || res.type === 'error') return; // network/CORS — don't punish
    if (res.status >= 500 || res.status === 429) return;
    clearSessionStore();
  } catch {
    /* offline — leave session alone */
  }
}

function ensureSessionHealth() {
  sanitizeStoredTier();
  applyFreeHatIfEligible();
  syncAuthCookie(getSession());
  verifyStoredToken();
}

export function apiFriendlyMessage(code: string): string {
  switch (code) {
    case 'cors':
      return 'Heredita API not reachable from this origin.';
    default:
      return 'Something went wrong.';
  }
}
