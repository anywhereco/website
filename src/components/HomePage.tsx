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
  const m = String(v || '').match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return -1;
  return Number(m[1]) * 1e6 + Number(m[2] || 0) * 1e3 + Number(m[3] || 0);
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
    ? latest.tagline
      ? `${latest.version} — ${latest.tagline}`
      : String(latest.version || '')
    : 'Pre-alpha';
  const blurb = latest?.title ? latest.title + '.' : 'The board goes up.';

  return (
    <a href="/updates" className="chalk-card updates-strip reveal" style={{ textDecoration: 'none' }}>
      <span className="label">{label}</span>
      <span className="muted">{blurb}</span>
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
          <span className="kicker">Your board</span>
          <h1 id="heroTitle" className="tilt-l">
            Welcome back, <span className="accent">{name}</span>.
          </h1>
          <p>
            You left off on <strong>3 December 1945</strong>, halfway through redrawing central Europe.
            It's still there.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <a href="https://app.heredita.net/app/" data-play className="btn btn-primary">
              <span dangerouslySetInnerHTML={{ __html: PLAY_SVG }} />
              Continue playing
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
        <h2>Game modes</h2>
        <span className="muted">Two open, two on the way</span>
      </div>
      <div className="mode-grid">
        <a className="chalk-card mode-card reveal delay-1" href="https://app.heredita.net/app/" data-play>
          <span className="mode-era">1936 · 1945 · 1991</span>
          <h3>Historical</h3>
          <p>Start on a real map and play the century as it actually went — or as far as your neighbours let you.</p>
        </a>
        <a className="chalk-card mode-card reveal delay-2" href="https://app.heredita.net/app/" data-play>
          <span className="mode-era">Same maps, one change</span>
          <h3>Alternate History</h3>
          <p>Keep Poland off the partition table. Restore Constantinople. Then find out who panics first.</p>
        </a>
        <div className="chalk-card mode-card disabled reveal delay-3" aria-disabled="true">
          <span className="mode-flag">Not built yet</span>
          <span className="mode-era">Sandbox</span>
          <h3>Freepaint</h3>
          <p>No dice, no rules, no turn order. Just a brush and a blank continent.</p>
        </div>
        <div className="chalk-card mode-card disabled reveal delay-4" aria-disabled="true">
          <span className="mode-flag">Not built yet</span>
          <span className="mode-era">Custom worlds</span>
          <h3>Customs &amp; Fantasy</h3>
          <p>Invent the nations, write the rulebook, then hand it to five friends and watch it fall apart.</p>
        </div>
      </div>

      <div className="section-title reveal">
        <h2>Latest patch</h2>
        <a className="see-all" href="/updates">
          All notes →
        </a>
      </div>
      <LatestPatch />

      <div className="section-title reveal">
        <h2>From the build</h2>
        <span className="muted">Five captures · click to enlarge</span>
      </div>

      <PreviewShowcase />

      <p className="muted text-center reveal" style={{ margin: '22px auto 8px', fontSize: '.88rem' }}>
        Everything above is from the pre-alpha build, so expect it to look different next month.
        Maps and art drawn in-house.
      </p>
    </main>
  );
}
