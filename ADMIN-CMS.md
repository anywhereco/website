# Editing the Updates page — guide for admins

The patch notes at **heredita.net/updates** are not written in code. They live in
one file that a small web editor writes for you: **Decap CMS**.

You do not need Git, an editor, or any developer tooling. You need a browser and
an invite.

---

## 1. Getting an account

Registration is **invite only** — there is no sign-up form, by design. The site
owner sends you an invite from the Netlify dashboard:

> Netlify → the Heredita site → **Identity** → **Invite users** → your email

You get an email titled roughly *"You've been invited to join …"*. Click
**Accept the invite**, set a password, and you're done. That link works once, so
if it expires just ask for another.

## 2. Signing in

1. Go to **https://heredita.net/admin/** (bookmark it — nothing on the site links
   to it).
2. Enter the email and password from step 1.
3. You land on **Updates / Patch Notes**.

## 3. Writing a patch note

Open **All patch notes**. You get a list of entries; the **top one is what
visitors see first**, and it's also the one the home page pulls into its "Latest
patch" strip.

Click **Add patch note**, then drag it to the top of the list. Fields:

| Field | What it is | Example |
| --- | --- | --- |
| **Version tag** | Short label on the left of the card | `v0.5` or `Pre-alpha` |
| **Date** | Shown next to the version | `2026-08-14` |
| **Tagline** | Optional short suffix after the date | `Map Pack` |
| **Headline** | The big handwritten title on the card | `Loading screens and dice tweaks` |
| **Bullet list** | One bullet per change | see below |

For bullets, wrap words in `**` to bold them — that's the only formatting the
page renders:

```
**New:** six hand-drawn loading screens.
**Fix:** chat no longer crashes with 4+ players.
```

renders as **New:** six hand-drawn loading screens.

## 4. Publishing

Press **Publish** (top right). That's it — the change is committed to the
`main` branch on GitHub, which triggers a rebuild, and the new note is live in
roughly a minute. Hard-refresh if you still see the old one.

**Publishing goes straight live.** There is no draft or review step
(`publish_mode: simple`), so read it once before you press the button.

## 5. Deleting or reordering

Same screen. Use the trash icon on an entry to remove it, or drag entries to
reorder. Newest belongs at the top.

---

## Notes for whoever maintains this

- **What the CMS actually writes:** `site/content/updates.json`. Both
  `updates.html` and the home page's "Latest patch" strip fetch that file at
  runtime, so a published note updates both. Nothing else needs editing.
- **Schema:** `site/admin/config.yml`. Add a field there and it appears in the
  editor.
- **Auth:** Netlify Identity + Git Gateway. The live site is on **Vercel**;
  the Netlify project exists only to run Identity and Git Gateway
  (see `netlify.toml`) and never serves pages.
- **Two things to confirm in the Netlify dashboard** if login misbehaves:
  - Identity → **Registration preferences → Invite only** (the admin page also
    hides the sign-up tab in CSS, but that is cosmetic — the server-side
    setting is what actually stops a forged sign-up).
  - Identity → **Services → Git Gateway** enabled, with repo access to
    `Zeyy21/HERE`.
- **Split-hosting setup:** the public site is served from Vercel, while Identity
  and Git Gateway live at `capable-sawine-7fa143.netlify.app`. Both
  `site/admin/index.html` and `site/index.html` explicitly initialize the
  Identity widget with that project's API endpoint. The Decap backend also
  declares the same project via `backend.site_domain` in
  `site/admin/config.yml`. Keep these values in sync if the Netlify project is
  ever renamed.
