import { useSession } from './hooks';
import { clearSession } from '../lib/store';
import PreviewShowcase from './PreviewShowcase';

export default function HomePage({ children }: { children?: React.ReactNode }) {
  const session = useSession();
  const name = session?.username || 'Guest';

  function onLogout(e: React.MouseEvent) {
    e.preventDefault();
    clearSession();
    window.location.href = '/';
  }

  return (
    <main className="container" style={{ paddingTop: 22 }}>
      <section className="chalk-card hero-card reveal" aria-labelledby="heroTitle">
        <div className="hero-text">
          <h1 id="heroTitle" className="tilt-l">
            Welcome back, <span className="accent">{name}</span>.
          </h1>
          <p>
            Your timeline is paused at <strong>December 3rd, 1945</strong>. Pick up the chalk and
            keep painting.
          </p>
          <div className="row" style={{ marginTop: 14 }}>
            <a href="https://app.heredita.net/app/" data-play className="btn btn-primary">
              ▶ Continue Playing
            </a>
            <button className="btn btn-ghost" onClick={onLogout}>
              Sign out
            </button>
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

      <div className="section-title reveal">
        <h2 className="tilt-r">Game Modes</h2>
        <span className="muted">pick a path</span>
      </div>
      <div className="mode-grid">
        <a className="chalk-card mode-card reveal delay-1" href="https://app.heredita.net/app/" data-play>
          <span className="tag">Sandbox</span>
          <h3>Free Paint</h3>
          <p>Solo on the map. No dice, no chat — just chalk, borders, and ideas.</p>
        </a>
        <a className="chalk-card mode-card reveal delay-2" href="https://app.heredita.net/app/" data-play>
          <span className="tag">Roleplay</span>
          <h3>Alternate History</h3>
          <p>Pick a year, change one event, and watch the cascade.</p>
        </a>
        <div className="chalk-card mode-card disabled reveal delay-3" aria-disabled="true">
          <span className="tag">Soon™</span>
          <h3>Multiplayer Servers</h3>
          <p>Join other historians. Dice rolls, treaties, betrayals. Coming soon.</p>
        </div>
        <div className="chalk-card mode-card disabled reveal delay-4" aria-disabled="true">
          <span className="tag">Soon™</span>
          <h3>Community Worlds</h3>
          <p>Custom rulesets shared by players. Coming soon.</p>
        </div>
      </div>

      <div className="section-title reveal">
        <h2 className="tilt-l">Latest Update</h2>
        <a className="see-all" href="/updates">
          see all →
        </a>
      </div>
      <a href="/updates" className="chalk-card updates-strip reveal" style={{ textDecoration: 'none' }}>
        <span className="label">v0.4 — Heredita Map Pack</span>
        <span className="muted">new loading screens, brush balancing, dice tweaks</span>
        <span className="spacer"></span>
        <span className="btn btn-ghost">Read notes →</span>
      </a>

      <div className="section-title reveal">
        <h2 className="tilt-r">Preview Footage</h2>
        <span className="muted">5 builds in rotation · click to expand</span>
      </div>

      <PreviewShowcase />

      <p className="muted text-center reveal" style={{ margin: '22px 0 8px' }}>
        All footage from the pre-alpha build. Art &amp; maps by the{' '}
        <strong>Heredita team</strong>.
      </p>
      {children}
    </main>
  );
}
