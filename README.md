# Heredita

A roleplay geopolitical simulator — paint the map, roll the dice, rewrite history.

Static marketing + sign-in site. The game itself lives at <https://app.heredita.net/app/>.

## Stack

Plain HTML + CSS + vanilla JS. No build step.

## Local dev

```bash
cd site && python3 -m http.server 8000
```

Then open <http://localhost:8000/>. There's also a dependency-free Node
equivalent, which serves with caching disabled so edits show up on a plain
reload:

```bash
node scripts/dev-server.js 8765
```

## Deploy

Configured for Vercel via `vercel.json` (publish dir = `site/`).

1. Import this repo on <https://vercel.com/new>
2. Framework Preset: **Other**
3. Build command: *(none)*
4. Output directory: `site` (already declared in `vercel.json`)
5. Deploy

## Structure

```
site/
├── index.html      auth landing (sign up / sign in / guest)
├── home.html       dashboard
├── play.html       launch page + preview footage carousel
├── about.html      mission + features
├── updates.html    patch notes, rendered from content/updates.json
├── terms.html      T&C
├── css/chalkboard.css
├── js/app.js       session, play CTAs, carousel; PLAY_URL → app.heredita.net
├── js/nav.js       top-nav behaviour (sliding marker, menus, mobile drawer)
└── assets/         logos + 5 screenshots
```

## Design conventions

The chalkboard theme leans on one rule that keeps the whole site legible at a
glance:

| Border | Means |
| --- | --- |
| Solid hairline | A real, finished thing |
| **Dashed** | A sketch — locked, unbuilt, coming soon |
| Accent solid | The thing you're on right now |

So dashes are never decoration. If something is dashed, it isn't shipped yet.

Type has three roles: **Caveat** for display headings and the brand, **Special
Elite** for typewritten metadata (dates, versions, stamps, kickers), and
**Cabin** for body copy and every control.

The header markup is duplicated verbatim across pages (no build step, by
design) — `js/nav.js` only enhances it, so the nav still works with JS off. If
you change a nav item, change it in every page.

## Legal

Heredita is operated by Anywhere Connection Corporation.
