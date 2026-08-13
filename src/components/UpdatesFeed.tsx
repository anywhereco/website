import { useEffect, useState } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { rewireReveal } from '../scripts/site';
import { BASE } from '../lib/heredita-api';
import { date } from 'astro:schema';

interface UpdateEntry {
  version?: string;
  date?: string;
  title?: string;
  tagline?: string;
  body?: string;
}

/* Parse a loose version tag (e.g. "v0.4.1", "0.10") into a comparable number. */
function versionNum(v?: string): number {
  const m = String(v || '').match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return -1;
  return Number(m[1]) * 1e9 + Number(m[2] || 0) * 1e6 + Number(m[3] || 0) * 1e3 + Number(m[4] || 0);
}

function sortNewest(list: UpdateEntry[]): UpdateEntry[] {
  return [...list].sort((a, b) => versionNum(b.version) - versionNum(a.version));
}

const TILT = ['tilt-r', 'tilt-l'];

function fmtDate(dateString?: string) { // We do this manually to allow for silly dates like the 32nd of December
  if (dateString == undefined) {
    return ""
  }
  // Array mapping month numbers (1-12) to month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Split the "dd-mm-yyyy" string into its component parts
  const [dayStr, monthStr, yearStr] = dateString.split("-");
  
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);

  // Helper function to get the correct ordinal suffix (st, nd, rd, th)
  function getOrdinalSuffix(n: number) {
    const mod100 = n % 100;
    // 11th, 12th, and 13th are special cases
    if (mod100 >= 11 && mod100 <= 13) {
      return "th";
    }
    
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  const monthName = months[month - 1];
  const dayWithSuffix = day + getOrdinalSuffix(day);

  return `${monthName} ${dayWithSuffix}, ${yearStr}`;
}

export default function UpdatesFeed() {
  const [items, setItems] = useState<UpdateEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/updates`, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const list: UpdateEntry[] = Array.isArray(data) ? data : data?.updates || [];
        setItems(sortNewest(list));
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
          className={'update-entry'}
        >
          <h2 className={TILT[i % TILT.length]}>{u.title || ''} <span className="date">{fmtDate(u.date)}</span></h2>
          {u.tagline ? <div className="tagline">{u.tagline}</div> : null}
          {u.body ? (
            <div className="md-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(u.body) }} />
          ) : null}
        </article>
      ))}
    </>
  );
}
