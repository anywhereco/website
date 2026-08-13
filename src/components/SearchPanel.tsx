import { useState } from 'react';
import * as API from '../lib/heredita-api';
import { useSession } from './hooks';
import { isSignedIn, toast } from '../lib/store';

type Result =
  | { kind: 'self' }
  | { kind: 'loading'; name: string }
  | { kind: 'found'; name: string }
  | { kind: 'notfound'; name: string }
  | { kind: 'error'; message: string };

export default function SearchPanel() {
  const session = useSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = name.trim();
    if (!q) return;
    if (!session?.token) return;
    if (q.toLowerCase() === (session.username || '').toLowerCase()) {
      setResult({ kind: 'self' });
      return;
    }
    setBusy(true);
    setResult({ kind: 'loading', name: q });
    const r = await API.sendFriendRequest(session.token, q);
    setBusy(false);
    if (r.ok) {
      setResult({ kind: 'found', name: q });
      setName('');
      return;
    }
    if (r.error === 'notfound') setResult({ kind: 'notfound', name: q });
    else if (r.error === 'cors') setResult({ kind: 'error', message: 'Search only works on heredita.net.' });
    else setResult({ kind: 'error', message: r.message || 'Unknown error.' });
  }

  if (!isSignedIn()) {
    return (
      <section className="chalk-card reveal" style={{ padding: 28, textAlign: 'center', marginTop: 18 }}>
        <h2 className="tilt-r" style={{ marginTop: 0 }}>
          Sign in to look people up
        </h2>
        <p className="muted">Looking people up needs an account.</p>
        <a className="btn btn-primary" href="/">
          Sign in or sign up
        </a>
      </section>
    );
  }

  const corsBlocked = API.isCorsBlockedOrigin();

  return (
    <div>
      <section className="chalk-card reveal" style={{ padding: 22 }}>
        <form autoComplete="off" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onSubmit={onSubmit}>
          <input
            type="search"
            required
            minLength={3}
            maxLength={32}
            placeholder="Type a player's exact username…"
            className="text-input"
            style={{ flex: 1, minWidth: 220 }}
            value={name}
            disabled={corsBlocked}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={corsBlocked || busy}>
            {busy ? 'Searching…' : 'Find & add'}
          </button>
        </form>
        <p className="muted" style={{ fontSize: '.9rem', margin: '10px 0 0' }}>
          Partial search is not wired up yet, so spelling counts. If the name exists, a friend
          request goes out straight away.
        </p>
      </section>

      {corsBlocked && (
        <section className="chalk-card reveal" style={{ padding: 28, textAlign: 'center', marginTop: 18 }}>
          <h2 className="tilt-r" style={{ marginTop: 0 }}>
            Player search arrives with the real launch
          </h2>
          <p className="muted" style={{ maxWidth: '56ch', margin: '0 auto 12px' }}>
            Player lookup lives on the Heredita game backend at{' '}
            <code style={{ color: 'var(--accent-soft)' }}>app.heredita.net</code>, which currently
            only accepts requests from <code style={{ color: 'var(--accent-soft)' }}>heredita.net</code>.
          </p>
        </section>
      )}

      {result && (
        <section style={{ marginTop: 18 }}>
          {result.kind === 'self' && (
            <div className="chalk-card" style={{ padding: 22 }}>
              <p>
                That's <strong>you</strong>. Try searching for another player.
              </p>
            </div>
          )}
          {result.kind === 'loading' && (
            <div className="chalk-card" style={{ padding: 22 }}>
              <p className="muted">
                Looking up <strong>{result.name}</strong>…
              </p>
            </div>
          )}
          {result.kind === 'found' && (
            <article className="chalk-card" style={{ padding: 22 }}>
              <div className="row" style={{ gap: 14, alignItems: 'center' }}>
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
                    border: '2px solid var(--chalk)',
                    color: 'var(--board-3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: '1.8rem',
                  }}
                >
                  {result.name.charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Caveat',cursive", fontSize: '1.8rem', lineHeight: 1 }}>
                    {result.name}
                  </div>
                  <div className="muted">✓ Player exists — friend request sent.</div>
                </div>
                <a className="btn btn-ghost" href="/friends">
                  View in Friends →
                </a>
              </div>
            </article>
          )}
          {result.kind === 'notfound' && (
            <article className="chalk-card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "'Caveat',cursive", margin: '0 0 4px' }}>
                No player named <em>{result.name}</em>
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                Usernames are case-sensitive. Double-check the spelling and try again.
              </p>
            </article>
          )}
          {result.kind === 'error' && (
            <article className="chalk-card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "'Caveat',cursive", margin: '0 0 4px' }}>
                Couldn't complete that
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                {result.message}
              </p>
            </article>
          )}
        </section>
      )}
    </div>
  );
}
