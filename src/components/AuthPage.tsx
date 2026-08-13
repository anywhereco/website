import { useState } from 'react';
import * as API from '../lib/heredita-api';
import { getMe } from '../lib/heredita-api';
import { setSession, toast } from '../lib/store';

type Tab = 'signup' | 'signin';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('signup');
  const [tos, setTos] = useState(false);
  const [busy, setBusy] = useState<'signup' | 'signin' | null>(null);
  const [sf, setSf] = useState({ username: '', dob: '', password: '', confirm: '' });
  const [li, setLi] = useState({ username: '', password: '' });

  async function persistAndGo(username: string, token: string) {
    let rank = 'player';
    let userId: number | null = null;
    try {
      const me = await getMe(token);
      if (me.ok) {
        rank = me.user.rank || 'player';
        userId = me.user.id;
      }
    } catch {
      /* ignore */
    }
    setSession({ uid: userId, username, token, rank, guest: false, tier: 'regular', coins: 0 });
    toast('Welcome, ' + username + '!');
    setTimeout(() => (window.location.href = '/home'), 500);
  }

  function requireTos(): boolean {
    if (!tos) {
      toast('Please agree to the Terms first.');
      return false;
    }
    return true;
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!requireTos()) return;
    const u = sf.username.trim();
    const pw = sf.password;
    if (u.length < 3) return toast('Username must be 3+ characters.');
    if (!/^[A-Za-z0-9_]+$/.test(u))
      return toast('Your username should only have letters, numbers, or underscores.');
    if (!sf.dob) return toast('Please enter your date of birth.');
    if (pw.length < 6) return toast('Password must be 6+ characters.');
    if (pw !== sf.confirm) return toast('Passwords do not match.');

    setBusy('signup');
    try {
      const reg = await API.register(u, pw);
      if (!reg.ok) {
        if (reg.error === 'taken')
          return toast('Username already taken, maybe try signing in instead?');
        if (reg.error === 'ratelimited')
          return toast('Why are you making so many accounts?');
        return toast(reg.message || 'Could not create account.');
      }
      const lg = await API.login(u, pw);
      if (!lg.ok) {
        toast('Account created, please sign in: ' + (lg.message || ''));
        setLi((p) => ({ ...p, username: u }));
        setTab('signin');
        return;
      }
      await persistAndGo(u, lg.token);
    } catch (err) {
      console.error('[heredita][auth] signup threw', err);
      toast('Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  async function onSignin(e: React.FormEvent) {
    e.preventDefault();
    const u = li.username.trim();
    const pw = li.password;
    if (!u || !pw) return toast('Enter your credentials.');
    setBusy('signin');
    try {
      const lg = await API.login(u, pw);
      if (!lg.ok) {
        if (lg.error === 'unauthorized') return toast('Wrong username or password.');
        if (lg.error === 'ratelimited')
          return toast('Too many sign-in attempts, wait a minute.');
        return toast(lg.message || 'Could not sign in.');
      }
      await persistAndGo(u, lg.token);
    } catch (err) {
      console.error('[heredita][auth] signin threw', err);
      toast('Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  function onGuest() {
    if (!requireTos()) return;
    setSession({
      username: 'Guest' + Math.floor(Math.random() * 9000 + 1000),
      guest: true,
      tier: 'guest',
      coins: 0,
    });
    window.location.href = '/home';
  }

  return (
    <main className="auth-wrap container">
      <div className="auth-pitch">
        <img className="auth-logo" src="/assets/heredita-logo-full.webp" alt="Heredita" />
        <p className="auth-tagline">
          Roll, paint, and <span className="accent">roleplay through history.</span>
        </p>

        <ul className="auth-facts">
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.6" y="4" width="18.8" height="13.4" rx="2" /><path d="M8.4 20.4h7.2M12 17.4v3" /></svg>
            <span><strong>Runs in the browser, without an install</strong></span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.8" /><path d="M12 6.6V12l3.6 2.2" /></svg>
            <span><strong>Start in 1935, 2025 or from nothing</strong></span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4" /><circle cx="8.8" cy="8.8" r="1.1" fill="currentColor" /><circle cx="15.2" cy="15.2" r="1.1" fill="currentColor" /><circle cx="12" cy="12" r="1.1" fill="currentColor" /></svg>
            <span><strong>Roleplay in the public chat</strong></span>
          </li>
        </ul>

        <div className="auth-shot" role="img" aria-label="Europe, December 1945, mid-game"></div>
      </div>

      <section className="chalk-card auth-card" aria-labelledby="authTitle">
        <h2 id="authTitle" style={{ marginTop: 0 }}>Pick up the chalk</h2>

        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <button
            className={tab === 'signup' ? 'active' : ''}
            data-tab="signup"
            role="tab"
            aria-selected={tab === 'signup'}
            onClick={() => setTab('signup')}
          >
            Sign up
          </button>
          <button
            className={tab === 'signin' ? 'active' : ''}
            data-tab="signin"
            role="tab"
            aria-selected={tab === 'signin'}
            onClick={() => setTab('signin')}
          >
            Sign in
          </button>
        </div>

        {tab === 'signup' && (
          <form className="auth-panel" data-panel="signup" noValidate onSubmit={onSignup}>
            <div className="field">
              <label htmlFor="su-username">Username</label>
              <input
                id="su-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="e.g. CountDookuEnjoyer"
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_.\-]+"
                required
                value={sf.username}
                onChange={(e) => setSf((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="su-dob">Date of birth</label>
              <input
                id="su-dob"
                name="dob"
                type="date"
                required
                value={sf.dob}
                onChange={(e) => setSf((p) => ({ ...p, dob: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="su-pw">Password</label>
              <input
                id="su-pw"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
                required
                value={sf.password}
                onChange={(e) => setSf((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="su-pw2">Confirm password</label>
              <input
                id="su-pw2"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={sf.confirm}
                onChange={(e) => setSf((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>

            <label className="checkbox" style={{ margin: '8px 0 4px' }}>
              <input
                id="tosCheck"
                type="checkbox"
                checked={tos}
                onChange={(e) => setTos(e.target.checked)}
              />
              <span className="box" aria-hidden="true"></span>
              <span>
                I agree to the <a href="/terms">Terms &amp; Conditions</a>.
              </span>
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={!tos || !!busy}>
                {busy === 'signup' ? 'Creating account…' : 'Create account'}
              </button>
              <div className="row-or">or</div>
              <button
                id="guestBtn"
                className="btn"
                type="button"
                disabled={!tos}
                onClick={onGuest}
              >
                Play as Guest {!tos && <small className={"muted"}>(you need to agree to the ToS)</small>}
              </button>
            </div>
          </form>
        )}

        {tab === 'signin' && (
          <form className="auth-panel" data-panel="signin" noValidate onSubmit={onSignin}>
            <div className="field">
              <label htmlFor="si-username">Username</label>
              <input
                id="si-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={li.username}
                onChange={(e) => setLi((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="si-pw">Password</label>
              <input
                id="si-pw"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={li.password}
                onChange={(e) => setLi((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={!!busy}>
                {busy === 'signin' ? 'Signing in…' : 'Sign in'}
              </button>
              <div className="row-or">or</div>
              <button className="btn" type="button" onClick={() => setTab('signup')}>
                Create a new account
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
