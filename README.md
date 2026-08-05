# Heredita

A roleplay geopolitical simulator — paint the map, roll the dice, rewrite history.

Marketing + sign-in site built with **Astro + React**. The game itself lives at <https://app.heredita.net/app/>.

## Stack

- [Astro](https://astro.build) (SSG) — static pages, clean URLs, no `.html`.
- React islands for the interactive parts: auth, chat (Firebase), avatar customizer, friends, search, settings, membership, updates.
- Vanilla site chrome (scroll reveal, chalk dust, launch CTA) inlined per page.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:4321/
```

## Build / preview

```bash
npm run build    # outputs to dist/
npm run preview  # serve the built output
```

## Testing against a debug API server

The API base URL, play URL, and the CORS gate are all configurable via Astro
env vars. Copy `.env.example` to `.env`, set your debug server, and run `npm run dev`.

```bash
cp .env.example .env
```

For a local game backend, put this in `.env`:

```dotenv
# Base of your debug game API (auth + friends + search)
PUBLIC_HEREDITA_API=http://localhost:8000

# What PLAY / Continue buttons open (usually <API>/app/)
PUBLIC_HEREDITA_PLAY_URL=http://localhost:8000/app/

# Debug servers usually accept any origin — skip the heredita.net CORS gate
PUBLIC_HEREDITA_ALLOW_ALL_CORS=true
```

Notes:

- `PUBLIC_*` vars are inlined into the client bundle at **build/dev time**, so
  change them and restart `npm run dev` (or rebuild) for them to take effect.
- `PUBLIC_HEREDITA_ALLOW_ALL_CORS=true` makes Friends/Search work locally;
  without it those pages show the "arrives with the real launch" gate unless
  the origin is allowed.
- `PUBLIC_HEREDITA_CORS_ORIGINS=https://a.example,https://b.example` adds extra
  allowed origins (e.g. for preview deploys) without disabling the check.
- `.env` is gitignored; only `.env.example` is committed.

## Routes

| Route       | Purpose                                |
|-------------|----------------------------------------|
| `/`         | auth landing (sign up / sign in / guest) |
| `/home`     | dashboard                              |
| `/play`     | launch page + preview footage carousel |
| `/store`    | static marketplace preview             |
| `/avatar`   | countryball avatar (country picker)    |
| `/chat`     | community chat (Firebase Realtime DB)  |
| `/friends`  | friend roster + requests               |
| `/search`   | find player by username                |
| `/updates`  | patch notes                            |
| `/membership` | tier comparison                      |
| `/settings` | account, tier, language, region        |
| `/about`    | mission + features                     |
| `/terms`    | Terms & Conditions (static, always visible) |

> Legacy `.html` routes (e.g. `/home.html`) 301-redirect to their clean-URL equivalents via `vercel.json`.

## Services

- **Hosting / deploy:** Vercel (`outputDirectory: dist`)
- **Chat:** Firebase Realtime Database (config in `src/lib/chat-config.ts`, rules in `database.rules.json`)
- **Game API:** `app.heredita.net`, used for auth + friends. CORS-whitelists `heredita.net` origins.

## Structure

```
src/
├── layouts/BaseLayout.astro   shared head + TopBar + footer + site chrome script
├── components/                React islands (AuthPage, TopBar, ChatApp, …)
├── lib/                       store (session/avatar/prefs), heredita-api, chat-config, countryballs, markdown
├── pages/                     Astro routes
└── styles/chalkboard.css
public/assets/                 logos + screenshots
```
