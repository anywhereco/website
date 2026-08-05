import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
  off,
  push,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { FIREBASE_CONFIG, CHAT_ROOMS, isChatConfigured } from '../lib/chat-config';
import { useSession, useDms } from './hooks';
import { isSignedIn, loadDmList, saveDmList, toast, dmStore } from '../lib/store';

interface Msg {
  _id: string;
  from?: string;
  text?: string;
  ts?: number;
}

function dmRoomKey(a: string, b: string) {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()].sort();
  return `dm__${x}__${y}`;
}
function fmtTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatApp() {
  const session = useSession();
  const dms = useDms();
  const signedIn = isSignedIn();

  const [db, setDb] = useState<ReturnType<typeof getDatabase> | null>(null);
  const [refs, setRefs] = useState<any>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const [room, setRoom] = useState<{ id: string; name: string; blurb: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [newDm, setNewDm] = useState('');
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    if (!isChatConfigured()) {
      setBootError('Chat not yet configured.');
      return;
    }
    const app = initializeApp(FIREBASE_CONFIG);
    const database = getDatabase(app);
    setDb(database);
    setRefs({ ref, query, orderByChild, limitToLast, onValue, off, push, serverTimestamp });
  }, [signedIn]);

  useEffect(() => {
    if (!db || !refs) return;
    // Auto-join first public room
    if (CHAT_ROOMS.length) joinRoom(CHAT_ROOMS[0]);
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  function joinRoom(next: { id: string; name: string; blurb: string }) {
    if (!db || !refs) return;
    if (unsubRef.current) {
      try {
        unsubRef.current();
      } catch {
        /* ignore */
      }
      unsubRef.current = null;
    }
    setRoom(next);
    setMessages([]);
    const q = query(
      refs.ref(db, `rooms/${next.id}/messages`),
      refs.orderByChild('ts'),
      refs.limitToLast(100)
    );
    const cb = refs.onValue(
      q,
      (snap: any) => {
        const items: Msg[] = [];
        snap.forEach((child: any) => items.push(Object.assign({ _id: child.key }, child.val())));
        setMessages(items);
      },
      (err: any) => {
        console.error('[chat] read error', err);
        setBootError('Could not read messages: ' + (err?.message || err?.code || 'unknown'));
      }
    );
    unsubRef.current = () => refs.off(q, 'value', cb);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!room || !db || !refs || !session?.username) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await refs.push(refs.ref(db, `rooms/${room.id}/messages`), {
        from: session.username,
        text: text.slice(0, 800),
        ts: refs.serverTimestamp(),
      });
    } catch (err: any) {
      console.error('[chat] send failed', err);
      toast('Could not send: ' + (err?.message || err?.code || 'unknown'));
      setDraft(text);
    }
  }

  function startDm(e: React.FormEvent) {
    e.preventDefault();
    const other = newDm.trim();
    if (!other) return;
    if (!session?.username) return;
    if (other.toLowerCase() === session.username.toLowerCase()) {
      toast("You can't DM yourself.");
      return;
    }
    const list = loadDmList();
    if (!list.includes(other)) {
      saveDmList([...list, other]);
      dmStore.notify();
    }
    setNewDm('');
    joinRoom({ id: dmRoomKey(session.username, other), name: '@ ' + other, blurb: 'Direct message with ' + other });
  }

  /* ---- gates ---- */
  if (!signedIn) {
    return (
      <section className="chalk-card reveal" style={{ padding: '32px 24px', textAlign: 'center', maxWidth: 560, margin: '18px auto' }}>
        <h2 className="tilt-r" style={{ marginTop: 0 }}>
          Sign in to chat
        </h2>
        <p className="muted" style={{ maxWidth: '46ch', margin: '0 auto 16px' }}>
          {session?.guest
            ? "Guest sessions can't post in chat. Create a free account to join the conversation."
            : 'Chat is for signed-in Heredita members. Make a free account or sign in to join.'}
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
          <a className="btn btn-primary" href="/">
            Sign in or sign up
          </a>
          <a className="btn btn-ghost" href="/home">
            Back to home
          </a>
        </div>
      </section>
    );
  }

  if (bootError === 'Chat not yet configured.') {
    return (
      <section className="chalk-card reveal" style={{ padding: 28, textAlign: 'center' }}>
        <h2 className="tilt-r" style={{ marginTop: 0 }}>
          Chat not yet configured
        </h2>
        <p className="muted" style={{ maxWidth: '60ch', margin: '0 auto 12px' }}>
          The chat backend uses <strong>Firebase Realtime Database</strong>. Set it up and this
          page becomes a live chat.
        </p>
      </section>
    );
  }

  return (
    <div>
      <div className="section-title reveal">
        <h1 className="tilt-l">Community Chat</h1>
        <span className="muted">
          real-time · signed in as{' '}
          <strong style={{ color: 'var(--accent-soft)' }}>{session?.username}</strong>
        </span>
      </div>
      <div className="chat-layout">
        <aside className="chalk-card chat-sidebar">
          <h3 style={{ fontFamily: "'Caveat',cursive", margin: '0 0 8px' }}>Rooms</h3>
          <ul className="chat-room-list">
            {CHAT_ROOMS.map((r) => (
              <li key={r.id}>
                <button
                  className={'chat-room-btn' + (room?.id === r.id ? ' active' : '')}
                  onClick={() => joinRoom(r)}
                >
                  <span className="dot" aria-hidden="true"></span>
                  <span className="rname">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <h3 style={{ fontFamily: "'Caveat',cursive", margin: '14px 0 6px' }}>Direct messages</h3>
          <ul className="chat-room-list">
            {dms.length === 0 && (
              <li className="muted" style={{ fontSize: '.85rem', padding: '4px 8px' }}>
                No DMs yet.
              </li>
            )}
            {dms.map((other) => (
              <li key={other}>
                <button
                  className={
                    'chat-room-btn' +
                    (room?.name === '@ ' + other ? ' active' : '')
                  }
                  onClick={() =>
                    session?.username &&
                    joinRoom({
                      id: dmRoomKey(session.username, other),
                      name: '@ ' + other,
                      blurb: 'Direct message with ' + other,
                    })
                  }
                >
                  <span className="dot" aria-hidden="true"></span>
                  <span className="rname">@ {other}</span>
                </button>
              </li>
            ))}
          </ul>
          <form className="chat-new-dm" autoComplete="off" onSubmit={startDm}>
            <input
              type="text"
              minLength={3}
              maxLength={32}
              placeholder="Start DM with username…"
              required
              value={newDm}
              onChange={(e) => setNewDm(e.target.value)}
            />
            <button className="btn btn-ghost" type="submit" title="Start DM">
              +
            </button>
          </form>
        </aside>

        <section className="chalk-card chat-main" aria-live="polite">
          <header className="chat-header">
            <div>
              <h2 style={{ fontFamily: "'Caveat',cursive", margin: 0 }}>
                {room?.name || 'Select a room'}
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>
                {room?.blurb || ''}
              </p>
            </div>
            <div className="chat-me muted">
              You are <strong style={{ color: 'var(--accent-soft)' }}>{session?.username}</strong>
            </div>
          </header>

          <div className="chat-messages" style={{ overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p className="muted" style={{ textAlign: 'center', padding: 20 }}>
                No messages yet. Be the first.
              </p>
            ) : (
              messages.map((m) => {
                const mine = (m.from || '') === session?.username;
                return (
                  <div key={m._id} className={'chat-msg' + (mine ? ' me' : '')}>
                    {!mine && <div className="chat-from">{m.from || '?'}</div>}
                    <div className="chat-bubble">{m.text || ''}</div>
                    <div className="chat-time">{fmtTime(m.ts)}</div>
                  </div>
                );
              })
            )}
          </div>

          <form className="chat-composer" autoComplete="off" onSubmit={onSend}>
            <input
              type="text"
              maxLength={800}
              placeholder={room ? 'Say something…' : 'Pick a room or DM first…'}
              disabled={!room}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={!room}>
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
