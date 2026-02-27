# Academic Management System (React + Supabase)

A modern Academic Management System built with React (Vite) and powered by Supabase for authentication and database APIs.

## 1. Configure Supabase

1. Create a Supabase project.
2. Open Supabase Dashboard -> `Project Settings` -> `API`.
3. Copy:
   - `Project URL`
   - `anon public` key

## 2. Configure environment variables

1. Copy `.env.example` to `.env`.
2. Update `.env` with your real values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_REAL_ANON_PUBLIC_KEY
```

Important:
- Use `VITE_` prefix exactly.
- Do not keep placeholder values.
- Restart the dev server after editing `.env`.

## 3. Install and run

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

This project is configured for Vite static deployment.

Required Vercel settings:
- Framework Preset: `Vite`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: project root (where `package.json` is)

If deployment still fails:
1. Remove local link metadata and relink:
```bash
rm -rf .vercel
vercel
```
2. Confirm there is no `now.json` file.
3. Redeploy from Vercel dashboard.

## 5. Login troubleshooting

If login fails:

1. Confirm `.env` exists in project root.
2. Confirm both keys are present and correct:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Confirm the user exists in Supabase Auth (`Authentication` -> `Users`).
4. Stop and restart dev server:

```bash
npm run dev
```

The app will show a clear error if Supabase is not configured correctly.

## 6. Production Guide

For production rollout checklist, CI/CD, rollback, and smoke tests, see:

- `docs/PRODUCTION_DEPLOYMENT.md`
