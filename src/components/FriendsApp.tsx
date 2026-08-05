import { useCallback, useEffect, useState } from 'react';
import * as API from '../lib/heredita-api';
import { useSession } from './hooks';
import { clearSession, isSignedIn, toast } from '../lib/store';

interface UserPartial {
  username?: string;
  rank?: string;
}
type Tab = 'friends' | 'incoming' | 'outgoing';

function rankLabel(rank?: string) {
  return (
    {
      player: 'Player',
      moderator: '🛡 Moderator',
      administrator: '⚙ Administrator',
      developer: '🛠 Developer',
    }[rank || 'player'] || rank
  );
}

function FriendCard({
  u,
  kind,
  busyFor,
  onAction,
}: {
  u: UserPartial;
  kind: 'friend' | 'incoming' | 'outgoing';
  busyFor: string | null;
  onAction: (action: string, username: string) => void;
}) {
  const initial = (u.username || '?').charAt(0).toUpperCase();
  return (
    <article className="chalk-card" style={{ padding: 18 }}>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
            border: '2px solid var(--chalk)',
            color: 'var(--board-3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            fontSize: '1.4rem',
          }}
        >
          {initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: '1.4rem', lineHeight: 1.1, color: 'var(--chalk)' }}>
            {u.username}
          </div>
          <div className="muted" style={{ fontSize: '.9rem' }}>
            {rankLabel(u.rank)}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {kind === 'friend' && (
          <button className="btn btn-ghost" disabled={busyFor === u.username} onClick={() => onAction('remove', u.username!)}>
            {busyFor === u.username ? '…' : 'Remove'}
          </button>
        )}
        {kind === 'incoming' && (
          <>
            <button className="btn btn-primary" disabled={busyFor === u.username} onClick={() => onAction('accept', u.username!)}>
              {busyFor === u.username ? '…' : 'Accept'}
            </button>
            <button className="btn btn-ghost" disabled={busyFor === u.username} onClick={() => onAction('decline', u.username!)}>
              {busyFor === u.username ? '…' : 'Decline'}
            </button>
          </>
        )}
        {kind === 'outgoing' && (
          <button className="btn btn-ghost" disabled={busyFor === u.username} onClick={() => onAction('cancel', u.username!)}>
            {busyFor === u.username ? '…' : 'Cancel'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function FriendsApp() {
  const session = useSession();
  const [tab, setTab] = useState<Tab>('friends');
  const [data, setData] = useState<{
    friends: UserPartial[];
    incoming: UserPartial[];
    outgoing: UserPartial[];
  }>({ friends: [], incoming: [], outgoing: [] });
  const [busyFor, setBusyFor] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!session?.token) return;
    const r = await API.getMe(session.token);
    if (!r.ok) {
      if (r.error === 'cors' || r.error === 'network') return;
      if (r.error === 'unauthorized') {
        toast('Session expired — please sign in again.');
        clearSession();
        setTimeout(() => (window.location.href = '/'), 800);
        return;
      }
      return;
    }
    const me = r.user || {};
    setData({
      friends: me.friends || [],
      incoming: me.received_friend_requests || [],
      outgoing: me.sent_friend_requests || [],
    });
  }, [session?.token]);

  useEffect(() => {
    if (session?.token && isSignedIn()) refreshAll();
  }, [session?.token, refreshAll]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = addName.trim();
    if (!name) return;
    if (!session?.token) return;
    if (name.toLowerCase() === (session.username || '').toLowerCase()) {
      return toast("You can't friend yourself.");
    }
    const r = await API.sendFriendRequest(session.token, name);
    if (!r.ok) {
      if (r.error === 'notfound') return toast('No user named "' + name + '".');
      if (r.error === 'cors') return toast('Friends only work on heredita.net.');
      return toast(r.message || 'Could not send request.');
    }
    toast('✓ Friend request sent to ' + name + '.');
    setAddName('');
    await refreshAll();
    setTab('outgoing');
  }

  async function onAction(action: string, username: string) {
    if (!session?.token) return;
    setBusyFor(username);
    let r: API.ApiResult;
    if (action === 'remove') r = await API.removeFriend(session.token, username);
    else if (action === 'accept') r = await API.acceptFriendRequest(session.token, username);
    else r = await API.declineFriendRequest(session.token, username);
    setBusyFor(null);
    if (r && r.ok) {
      const msg =
        action === 'remove'
          ? '✓ Removed ' + username + ' from friends.'
          : action === 'accept'
            ? '🎉 You are now friends with ' + username + '.'
            : '✗ Declined ' + username + "'s request.";
      toast(msg);
      await refreshAll();
    } else {
      toast((r && r.message) || 'Action failed.');
    }
  }

  if (!isSignedIn()) {
    return (
      <section className="chalk-card reveal" style={{ padding: 28, textAlign: 'center' }}>
        <h2 className="tilt-r" style={{ marginTop: 0 }}>
          Sign in to manage friends
        </h2>
        <p className="muted">Friend lists need an account. Guests can still play and talk in the public rooms.</p>
        <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
          <a className="btn btn-primary" href="/">
            Sign in or sign up
          </a>
          <a className="btn btn-ghost" href="/chat">
            Open public chat
          </a>
        </div>
      </section>
    );
  }

  if (API.isCorsBlockedOrigin() && typeof window !== 'undefined' && !window.location.hostname.includes('heredita')) {
    return (
      <section className="chalk-card reveal" style={{ padding: 28, textAlign: 'center', marginTop: 18 }}>
        <h2 className="tilt-r" style={{ marginTop: 0 }}>
          Friends arrive with the real launch
        </h2>
        <p className="muted" style={{ maxWidth: '56ch', margin: '0 auto 12px' }}>
          The friends roster lives on the Heredita game backend at{' '}
          <code style={{ color: 'var(--accent-soft)' }}>app.heredita.net</code>, which currently
          only accepts requests from <code style={{ color: 'var(--accent-soft)' }}>heredita.net</code>.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <a className="btn btn-primary" href="/chat">
            Open chat instead
          </a>
          <a className="btn btn-ghost" href="/home">
            Back to home
          </a>
        </div>
      </section>
    );
  }

  const lists: Record<Tab, UserPartial[]> = {
    friends: data.friends,
    incoming: data.incoming,
    outgoing: data.outgoing,
  };
  const empties: Record<Tab, string> = {
    friends: 'No friends yet. Add someone above ↑',
    incoming: 'No incoming friend requests.',
    outgoing: 'No outgoing friend requests.',
  };

  return (
    <div>
      <div className="chalk-card reveal" style={{ padding: 18 }}>
        <h3 style={{ margin: '0 0 10px' }}>Add a friend</h3>
        <form autoComplete="off" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onSubmit={onAdd}>
          <input
            type="text"
            required
            minLength={3}
            maxLength={32}
            placeholder="Exact username…"
            className="text-input"
            style={{ flex: 1, minWidth: 220 }}
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Send request
          </button>
        </form>
        <p className="muted" style={{ fontSize: '.9rem', margin: '8px 0 0' }}>
          Type the player's <strong>exact</strong> username. If they exist, a friend request will be sent.
        </p>
      </div>

      <div className="auth-tabs reveal" role="tablist" aria-label="Friends sections" style={{ marginTop: 18, maxWidth: 520 }}>
        {(['friends', 'incoming', 'outgoing'] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}{' '}
            <span className="muted">({lists[t].length})</span>
          </button>
        ))}
      </div>

      <section className="fr-panel reveal" style={{ marginTop: 14 }}>
        {loading ? (
          <p className="muted text-center" style={{ padding: 20 }}>
            Loading…
          </p>
        ) : lists[tab].length === 0 ? (
          <p className="muted text-center" style={{ padding: '20px 0' }}>
            {empties[tab]}
          </p>
        ) : (
          <div className="mode-grid">
            {lists[tab].map((u) => (
              <FriendCard key={u.username} u={u} kind={tab as any} busyFor={busyFor} onAction={onAction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
