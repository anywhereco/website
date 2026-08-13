import { useEffect, useState } from 'react';
import { useSession } from './hooks';
import { BASE } from '../lib/heredita-api';
import PreviewShowcase from './PreviewShowcase';

const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 4 20 12 7 20"/></svg>';

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

function LatestPatch() {
  const [latest, setLatest] = useState<UpdateEntry | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/updates`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const list: UpdateEntry[] = Array.isArray(data) ? data : data?.updates;
        if (!Array.isArray(list) || !list.length) return;
        const newest = [...list].sort((a, b) => versionNum(b.version) - versionNum(a.version))[0];
        setLatest(newest);
      } catch {
        /* keep the static fallback */
      }
    })();
  }, []);

  const label = latest
    ? latest.version
      ? `${latest.version}`
      : String(latest.version || '')
    : 'Click here to see the updates';
  const blurb = latest?.tagline ? latest.tagline : '';

  return (
    <a href="/updates" className="chalk-card updates-strip reveal" style={{ textDecoration: 'none' }}>
      <span className="version-number">{label}</span>
      <span className="version-tagline muted">{blurb}</span>
      <span className="spacer"></span>
      <span className="btn btn-ghost">Read the notes →</span>
    </a>
  );
}

export default function HomePage() {
  const session = useSession();
  const name = session?.username || 'Guest';

  return (
    <main className="container" style={{ paddingTop: 22 }}>
      <section className="chalk-card hero-card reveal" aria-labelledby="heroTitle">
        <div className="hero-text">
          <h1 id="heroTitle" className="tilt-l">
            Welcome back, <span className="accent">{name}</span>.
          </h1>
          <p>
            Let's find a lobby to join.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <a href="https://app.heredita.net/app/" data-play className="btn btn-primary">
              <span dangerouslySetInnerHTML={{ __html: PLAY_SVG }} />
              Play
            </a>
            <a className="btn btn-ghost" href="/updates">
              What's new
            </a>
          </div>
        </div>
        <a
          href="https://app.heredita.net/app/"
          data-play
          className="hero-art"
          role="img"
          aria-label="Open the Heredita app"
        ></a>
      </section>
      <div className="chalk-tray" aria-hidden="true"></div>

      <div className="section-title reveal">
        <h2>Latest patch</h2>
      </div>
      <LatestPatch />

      <div className="section-title reveal">
        <h2>From the build</h2>
      </div>

      <PreviewShowcase />

      <p className="muted text-center reveal" style={{ margin: '22px auto 8px', fontSize: '.88rem' }}>
        We're working on improving the game, so expect the UI to get better.
      </p>
    </main>
  );
}
