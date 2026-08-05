/* Shared chalk-card modals (paywall + tier gate), mirroring app.js behavior. */

import {
  canSwitchTier,
  clearSession,
  getSession,
  getTier,
  setSession,
  toast,
} from './store';

type ModalOpts = {
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  primaryAction?: () => void;
};

function mountModal(card: string) {
  const modal = document.createElement('div');
  modal.className = 'lightbox';
  modal.innerHTML = `<button class="close" aria-label="Close">✕</button><div class="chalk-card" style="max-width:460px;padding:32px 28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;pointer-events:auto;cursor:default;">${card}</div>`;
  const close = () => modal.remove();
  modal.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === modal || t.classList.contains('close') || t.hasAttribute('data-close'))
      close();
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey);
    }
  });
  document.body.appendChild(modal);
  return { close };
}

function buttonsMarkup(primary: string, dataAttr: string, secondary: string) {
  return `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px;">
    <button class="btn btn-primary" ${dataAttr}>${primary}</button>
    <button class="btn" data-close>${secondary}</button>
  </div>`;
}

export function openPaywall({
  title = 'Locked',
  body = 'This feature is locked until the paid release.',
  primaryLabel = 'Notify me',
}: ModalOpts = {}) {
  const { close } = mountModal(
    `<svg viewBox="0 0 200 220" aria-hidden="true" style="width:110px;height:auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,0.5));">
      <path d="M60,100 V70 a40,40 0 0 1 80,0 V100" fill="none" stroke="rgba(244,241,230,0.92)" stroke-width="14" stroke-linecap="round"/>
      <rect x="38" y="100" width="124" height="100" rx="14" fill="rgba(244,241,230,0.92)" stroke="#0f2018" stroke-width="4"/>
      <circle cx="100" cy="142" r="11" fill="#0f2018"/>
      <rect x="95" y="148" width="10" height="28" rx="2" fill="#0f2018"/>
    </svg>
    <h2 style="font-family:'Caveat',cursive;margin:0;font-size:2rem;">${title}</h2>
    <p style="margin:0;color:var(--chalk-soft);max-width:38ch;">${body}</p>
    ${buttonsMarkup(primaryLabel, 'data-notify', 'Close')}`
  );
  const onBody = (e: Event) => {
    const t = e.target as HTMLElement;
    if (!t.closest('.lightbox')) return;
    if (t.hasAttribute('data-notify')) {
      toast("✓ We'll let you know when it opens.");
      close();
    }
    document.removeEventListener('click', onBody);
  };
  document.addEventListener('click', onBody);
}

export function openTierGate({
  title = 'Locked',
  body = '',
  primaryLabel = 'OK',
  primaryHref,
  primaryAction,
}: ModalOpts = {}) {
  const goAttr = primaryHref ? `data-go="${primaryHref}"` : 'data-go="action"';
  const { close } = mountModal(
    `<svg viewBox="0 0 200 200" aria-hidden="true" style="width:96px;height:auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,0.5));">
      <circle cx="78" cy="100" r="32" fill="none" stroke="rgba(244,241,230,0.92)" stroke-width="12"/>
      <rect x="100" y="92" width="78" height="16" rx="2" fill="rgba(244,241,230,0.92)"/>
      <rect x="150" y="108" width="10" height="20" fill="rgba(244,241,230,0.92)"/>
      <rect x="170" y="108" width="10" height="14" fill="rgba(244,241,230,0.92)"/>
      <circle cx="78" cy="100" r="8" fill="#0f2018"/>
    </svg>
    <h2 style="font-family:'Caveat',cursive;margin:0;font-size:2rem;">${title}</h2>
    <p style="margin:0;color:var(--chalk-soft);max-width:38ch;">${body}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px;">
      <button class="btn btn-primary" ${goAttr}>${primaryLabel}</button>
      <button class="btn" data-close>Cancel</button>
    </div>`
  );
  const onBody = (e: Event) => {
    const t = e.target as HTMLElement;
    if (!t.closest('.lightbox')) return;
    if (t.hasAttribute('data-go')) {
      const go = t.getAttribute('data-go');
      if (go === 'action' && typeof primaryAction === 'function') primaryAction();
      else if (go && go !== 'action') window.location.href = go;
    }
    document.removeEventListener('click', onBody);
  };
  document.addEventListener('click', onBody);
}

/* Result: true if applied, false if a modal was opened instead. */
export function setTier(tier: string): boolean {
  const verdict = canSwitchTier(tier);
  if (!verdict.ok) {
    if (verdict.reason === 'paid') {
      openPaywall({
        title: 'Emperor — Locked',
        body: "Emperor opens with the paid release. We'll notify you the moment it ships.",
        primaryLabel: '🔔 Notify me',
      });
    } else if (verdict.reason === 'needs-signup') {
      openTierGate({
        title: 'Regular needs an account',
        body: "You're browsing as a Guest. Sign up to become a Regular member — that's how you unlock monthly Heredita Coins and the free seasonal hat.",
        primaryLabel: 'Sign up',
        primaryHref: 'index.html',
      });
    } else if (verdict.reason === 'needs-signout') {
      openTierGate({
        title: 'Signed in as Regular',
        body: 'To browse as a Guest you need to sign out. Your saved profile stays safe — sign back in any time.',
        primaryLabel: 'Sign out',
        primaryAction: () => {
          clearSession();
          localStorage.removeItem('heredita.avatar');
          window.location.href = 'index.html';
        },
      });
    }
    return false;
  }
  const s = getSession() || {
    username: 'Guest' + Math.floor(Math.random() * 9000 + 1000),
    guest: true,
    coins: 0,
  };
  s.tier = tier;
  s.guest = tier === 'guest';
  setSession(s);
  return true;
}
