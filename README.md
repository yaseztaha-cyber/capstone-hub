# Capstone Hub — STEM Capstone Project Workspace

A Next.js platform for managing STEM capstone projects: project pages, collaboration, rich-text editing (TipTap), drag-and-drop, and Supabase-backed data. Includes tests (Vitest) and Playwright configuration.

## Technology stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS.
- **Backend/Data:** Supabase (PostgreSQL, auth, storage).
- **Editor:** TipTap.
- **DnD:** dnd-kit.
- **Testing:** Vitest, Playwright.

## Running locally

Prerequisites: Node.js 20+, a Supabase project.

```bash
npm install
cp .env.example .env.local
# fill Supabase keys
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — development server.
- `npm run build` — production build.
- `npm run lint` — ESLint.
- `npm run test` / `npm run test:run` — Vitest.

## Status

In development.

## License

No license file is present; licensing decision required.
