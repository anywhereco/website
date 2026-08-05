import { useEffect, useState } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { rewireReveal } from '../scripts/site';

interface UpdateEntry {
  version?: string;
  date?: string;
  title?: string;
  tagline?: string;
  body?: string;
}

const TILT = ['tilt-r', 'tilt-l'];
const DELAYS = ['delay-1', 'delay-2', 'delay-3', 'delay-4'];

function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso || '';
  }
}

export default function UpdatesFeed() {
  const [items, setItems] = useState<UpdateEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/updates', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data?.updates || []);
      } catch (err: any) {
        console.error('[updates] failed to load', err);
        setError(err?.message || 'Unknown error');
      }
    })();
  }, []);

  useEffect(() => {
    rewireReveal();
  }, [items]);

  if (error) {
    return (
      <article className="chalk-card update-entry">
        <h2 className="tilt-l">Couldn't load patch notes</h2>
        <p className="muted">{error}. Try a hard refresh.</p>
      </article>
    );
  }

  if (items === null) {
    return <p className="muted text-center" style={{ padding: '30px 0' }}>Loading patch notes…</p>;
  }

  if (items.length === 0) {
    return <p className="muted text-center" style={{ padding: '30px 0' }}>No patch notes yet.</p>;
  }

  return (
    <>
      {items.map((u, i) => (
        <article
          key={i}
          className={'chalk-card update-entry reveal ' + DELAYS[i % DELAYS.length]}
        >
          <div className="meta">
            <span className="version">{u.version || ''}</span>
            <span className="date">{fmtDate(u.date)}</span>
            {u.tagline ? <span className="muted">— {u.tagline}</span> : null}
          </div>
          <h2 className={TILT[i % TILT.length]}>{u.title || ''}</h2>
          {u.body ? (
            <div className="md-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(u.body) }} />
          ) : null}
        </article>
      ))}
    </>
  );
}
