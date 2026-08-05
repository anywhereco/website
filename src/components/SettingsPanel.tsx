import { useState } from 'react';
import { useSession, usePrefs } from './hooks';
import {
  getTier,
  clearSession,
  canSwitchTier,
  setPrefs,
  TIER_LABEL,
  toast,
} from '../lib/store';
import { setTier as applyTier } from '../lib/modals';

const REASON_TEXT: Record<string, string> = {
  paid: 'Emperor unlocks with the paid release.',
  'needs-signup': 'Sign up to become Regular.',
  'needs-signout': 'Sign out to browse as a Guest.',
};

export default function SettingsPanel() {
  const session = useSession();
  const prefs = usePrefs();
  const tier = getTier();

  function refresh() {
    // Re-read tier so rows update after a switch (re-render triggered by state).
    // The getTier() call above re-evaluates each render.
    return getTier();
  }
  const current = refresh();

  const tierButtons: Record<string, boolean> = {};
  (['guest', 'regular', 'emperor'] as const).forEach((t) => {
    if (t === current) tierButtons[t] = true;
    else tierButtons[t] = canSwitchTier(t).ok;
  });
  const reasons = (['guest', 'regular', 'emperor'] as const)
    .filter((t) => t !== current)
    .map((t) => canSwitchTier(t))
    .filter((v) => !v.ok)
    .map((v) => REASON_TEXT[(v as any).reason]);

  function onSignOut() {
    clearSession();
    localStorage.removeItem('heredita.avatar');
    window.location.href = '/';
  }

  function onTier(t: string) {
    if (applyTier(t)) {
      toast('✓ Switched to ' + t.charAt(0).toUpperCase() + t.slice(1) + ' tier.');
    }
  }

  return (
    <div className="settings-grid">
      {/* ACCOUNT */}
      <section className="chalk-card settings-card reveal delay-1">
        <h3>Account</h3>
        <p className="muted" style={{ margin: '0 0 8px', fontSize: '.95rem' }}>
          Sign in to sync your timelines across devices.
        </p>
        <div className="settings-row">
          <div className="label">
            <span className="key">{session?.username ? session.username : 'Signed out'}</span>
            <span className="desc">
              {session?.username
                ? session.tier === 'guest'
                  ? 'Guest profile — saved locally on this device.'
                  : 'Signed in as ' + (TIER_LABEL[session.tier || 'regular'] || 'Regular') + ' member.'
                : "You're browsing without a profile."}
            </span>
          </div>
        </div>
        <div className="settings-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <a className="btn btn-primary" href="/">
            {session?.username ? 'Switch account' : 'Sign in'}
          </a>
          {session?.username && (
            <button className="btn" type="button" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>
      </section>

      {/* TIER */}
      <section className="chalk-card settings-card reveal delay-2">
        <h3>Membership tier</h3>
        <p className="muted" style={{ margin: '0 0 8px', fontSize: '.95rem' }}>
          Your tier is tied to your account type.
        </p>
        <div className="tier-switch" role="radiogroup" aria-label="Tier">
          {(['guest', 'regular', 'emperor'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={t === current ? 'active' : tierButtons[t] ? '' : 'locked'}
              aria-disabled={!tierButtons[t] || undefined}
              title={
                t === current
                  ? 'Current tier'
                  : tierButtons[t]
                    ? 'Switch to ' + t
                    : REASON_TEXT[(canSwitchTier(t) as any).reason] || 'Locked'
              }
              onClick={() => onTier(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: '0.9rem', margin: '6px 0 0' }} id="tierHint">
          {reasons.length ? reasons.map((r) => '🔒 ' + r).join('  ·  ') : '✓ Free to switch.'}
        </p>
        <div className="settings-row">
          <div className="label">
            <span className="key">Compare tiers</span>
            <span className="desc">See what each membership unlocks.</span>
          </div>
          <a className="btn btn-ghost" href="/membership">
            Membership →
          </a>
        </div>
      </section>

      {/* LANGUAGE */}
      <section className="chalk-card settings-card reveal delay-3">
        <h3>Language</h3>
        <div className="settings-row">
          <div className="label">
            <span className="key">Display language</span>
            <span className="desc">More languages arriving with v0.6.</span>
          </div>
          <select
            aria-label="Language"
            value={prefs.lang}
            onChange={(e) => setPrefs({ ...prefs, lang: e.target.value })}
          >
            <option value="en">English</option>
            <option value="fr" disabled>Français — soon</option>
            <option value="es" disabled>Español — soon</option>
            <option value="de" disabled>Deutsch — soon</option>
            <option value="pl" disabled>Polski — soon</option>
            <option value="ja" disabled>日本語 — soon</option>
          </select>
        </div>
        <div className="settings-row">
          <div className="label">
            <span className="key">Region (for in-game holidays)</span>
            <span className="desc">Affects local holiday events.</span>
          </div>
          <select
            aria-label="Region"
            value={prefs.region}
            onChange={(e) => setPrefs({ ...prefs, region: e.target.value })}
          >
            <option>Worldwide</option>
            <option>Europe</option>
            <option>Americas</option>
            <option>Asia</option>
            <option>Africa</option>
            <option>Oceania</option>
          </select>
        </div>
      </section>
    </div>
  );
}
