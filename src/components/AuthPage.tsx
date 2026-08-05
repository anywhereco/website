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
    if (!/^[A-Za-z0-9_.\-]+$/.test(u))
      return toast('Username: letters, numbers, _ . - only.');
    if (!sf.dob) return toast('Please enter your date of birth.');
    if (pw.length < 6) return toast('Password must be 6+ characters.');
    if (pw !== sf.confirm) return toast('Passwords do not match.');

    setBusy('signup');
    try {
      const reg = await API.register(u, pw);
      if (!reg.ok) {
        if (reg.error === 'taken')
          return toast('Username already taken — try signing in instead.');
        if (reg.error === 'ratelimited')
          return toast('Too many sign-ups — wait a minute and try again.');
        return toast(reg.message || 'Could not create account.');
      }
      const lg = await API.login(u, pw);
      if (!lg.ok) {
        toast('Account created — please sign in: ' + (lg.message || ''));
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
          return toast('Too many sign-in attempts — wait a minute.');
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
      <img className="auth-logo" src="/assets/heredita-logo-full.webp" alt="Heredita" />
      <p className="auth-tagline">
        Roll the dice. Paint the map. <span className="accent">Rewrite history.</span>
      </p>

      <section className="chalk-card auth-card" aria-labelledby="authTitle">
        <h2 id="authTitle" className="text-center tilt-l" style={{ marginTop: 0 }}>
          Join the timeline
        </h2>

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
                Play as Guest
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

      <p className="muted text-center" style={{ marginTop: 18, fontSize: '.95rem' }}>
        By continuing you confirm you've read our{' '}
        <a href="/terms">Terms &amp; Conditions</a>.
      </p>
    </main>
  );
}
