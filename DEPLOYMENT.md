# Deployment Guide

This guide describes how to deploy **STEM Capstone Hub** to Vercel with Supabase, configure environment variables, enable PWA/offline support, and verify the deployment.

## Vercel Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: STEM Capstone Hub"
git branch -M main
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

Ensure the repository is public or that Vercel has access if private.

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Click **Import Project** and select your GitHub repository.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default).
5. Output directory: `.next` (default).
6. Node.js version: 20+ (Vercel default).

### 3. Configure Environment Variables in Vercel

In Vercel Dashboard → **Settings → Environment Variables**, add the following (scope: Production, Preview, Development as needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional, for analytics)

> **Note:** `NEXT_PUBLIC_` prefixed vars are exposed to the browser. `SUPABASE_SECRET_KEY` and `OPENROUTER_API_KEY` are server-only and must not be prefixed with `NEXT_PUBLIC`.

See **Environment variables** table below for details.

### 4. Deploy

- Click **Deploy**.
- Vercel will run `next build`. Check the build logs for errors.
- After success, assign a custom domain in **Settings → Domains** if needed.
- Enable **Automatic deployments** on `main` branch pushes.

### 5. Post-deploy checks

- Visit `https://<your-domain>/` and verify the app loads.
- Check `/manifest.json` serves with `Content-Type: application/manifest+json`.
- Check `/sw.js` registers (DevTools → Application → Service Workers).
- Test PWA install prompt on Chrome Android / desktop (see PWA notes).

---

## Supabase Setup

### 1. Create Supabase project

1. Go to https://supabase.com/dashboard
2. **New project** → choose org, name, region, DB password.
3. Wait for provisioning.

### 2. Get credentials

In **Project Settings → API**:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` secret key (or `SUPABASE_SECRET_KEY` in new API keys) → `SUPABASE_SECRET_KEY`
- JWKS URL (optional, for auth): `SUPABASE_JWKS_URL`

Add these to `.env.local` locally and to Vercel env vars.

### 3. Run schema

Execute the SQL schema located at `supabase/schema.sql` in the Supabase SQL Editor:

1. Open **SQL Editor** → **New query**.
2. Paste the contents of `supabase/schema.sql` (drop/create tables, RLS, storage buckets `project-files`).
3. Run the query.

Verify tables: `profiles`, `teams`, `team_members`, `projects`, `tasks`, `milestones`, `calendar_events`, `files`, `rubrics`, `logbook_entries`, etc., and that RLS is enabled.

Alternatively via Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push --file supabase/schema.sql
# or
psql "postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres" -f supabase/schema.sql
```

### 4. Storage

The schema creates bucket `project-files` (private). Verify in **Storage** dashboard. Policies allow authenticated `INSERT`/`SELECT`/`DELETE` on `storage.objects` where `bucket_id = 'project-files'`.

### 5. Auth

- Enable **Email** provider in **Authentication → Providers**.
- Configure **Site URL** to your Vercel domain and add redirect URLs (`https://<domain>/auth/callback` if using magic link).
- `handle_new_user()` trigger auto-creates `profiles` rows on `auth.users` insert.

---

## PWA Notes

- **Manifest:** `public/manifest.json`
  - `start_url: "/"`, `display: "standalone"`, `theme_color: "#0f766e"`, `background_color: "#ffffff"`
  - Icons: `/icon-192.png` (192x192), `/icon-512.png` (512x512) with `purpose: "any maskable"`
  - Shortcuts: `Dashboard` → `/dashboard`, `Tasks` → `/tasks` (Chrome/Edge long-press app icon)
  - Served with header `Content-Type: application/manifest+json` via `next.config.ts` headers.
- **Service Worker:** `public/sw.js` (cache name `capstone-hub-v1`)
  - Caches app shell `"/"` and `"/offline.html"` on install.
  - Stale-while-revalidate for same-origin GET, network-first for Supabase.
  - Offline fallback to `/offline.html` for navigation requests.
  - Registered via `src/components/sw-register.tsx` on `window.load` if `navigator.serviceWorker` available.
  - Headers: `Cache-Control: public, max-age=0, must-revalidate`, `Service-Worker-Allowed: /`.
- **Install prompts:**
  - `src/components/InstallPrompt.tsx` listens to `beforeinstallprompt`, stores `deferredPrompt`, shows banner “Install STEM Capstone Hub” with Install (calls `prompt()` + `userChoice`) and Dismiss (hides + persists `sch_install_dismissed` in localStorage).
  - `src/components/layout/MobileNav.tsx` also listens to `beforeinstallprompt` and shows an **Install** button (Download + Smartphone icons) in the bottom nav when available, handling `prompt()` and `userChoice`, clearing on `appinstalled`.
  - Icons from `lucide-react`: `Download`, `Smartphone`.
- **Testing PWA:**
  - Chrome DevTools → Application → Manifest (verify fields, icons, shortcuts).
  - Application → Service Workers (check activated, offline checkbox).
  - Lighthouse → PWA audit (installable, theme color, offline).
  - On Android/Chrome, trigger `beforeinstallprompt` by serving over HTTPS and meeting install criteria; banner/button should appear, Install should trigger native prompt.

---

## Environment Variables

| Variable | Description | Required | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (public). Used by `@supabase/supabase-js` and `@supabase/ssr` client. | Yes | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (public). Client-side auth and RLS. | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SECRET_KEY` | Supabase secret/service_role key (server-only). Used server-side for elevated DB access. Never expose to client. | Yes | `sb_secret_xxx...` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features. Server-only. | Yes | `sk-or-v1-...` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Domain for Plausible analytics (plausible.io). Optional, enables `AnalyticsProvider`. | No | `capstone.example.com` |

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
# edit .env.local
npm run dev
```

On Vercel, add the same variables in **Settings → Environment Variables** and redeploy.

> Keep `.env.local` gitignored. Do not commit secrets. `.env.example` contains only placeholder values.

---

## Build & Verify

```bash
npm install
npm run build
npm start
```

Build must pass (`next build` completes without TypeScript errors; `typescript.ignoreBuildErrors: true` still requires no runtime export errors). Check no eslint errors blocking build.

---

## Troubleshooting

- **Supabase RLS errors (403):** Ensure user is `team_members` of the project’s team and `NEXT_PUBLIC_SUPABASE_*` correct.
- **PWA not installable:** Verify HTTPS, manifest served correctly, icons exist, SW registered, and `beforeinstallprompt` not already dismissed (`localStorage.removeItem('sch_install_dismissed')` to reset).
- **Env missing on Vercel:** Check build logs for “missing env” and ensure vars are set for the correct environment (Production/Preview).
