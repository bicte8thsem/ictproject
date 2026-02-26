# Production Deployment Guide

## 1. Prerequisites
- Supabase project is created.
- Vercel project is connected to this repository.
- Database schema in `database_schema.sql` has been reviewed and approved.

## 2. Environment Variables
Set these in Vercel Project Settings -> Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do **not** expose service role secrets in frontend runtime.

## 3. Database Apply Order
1. Open Supabase SQL editor.
2. Run `database_schema.sql` in full on a staging database.
3. Validate these objects exist:
- `programs`, `subjects`, `students` tables
- `save_complete_student`, `get_student_profile`, `get_semester_records` functions
- RLS policies for all main tables
4. Promote same SQL to production.

## 4. Deploy (Vercel)
- Framework: `Vite`
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`

`vercel.json` is already configured for SPA rewrites and security headers.

## 5. CI/CD
GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs on push/PR
- Executes:
  - `npm ci`
  - `npm run lint`
  - `npm run build`

## 6. Rollback Strategy
If a release fails:
1. Roll back frontend to previous Vercel deployment.
2. For database rollback:
- Prefer forward-fix migration.
- If required, restore from latest Supabase backup/snapshot.
3. Re-run smoke tests before reopening traffic.

## 7. Post-Deploy Smoke Tests
1. Login with valid admin account.
2. Dashboard loads dynamic totals and program charts.
3. Subject Setup:
- create/edit/delete program
- create/edit/delete subject
4. Add Student / Edit Student saves correctly.
5. Students listing filters and pagination work.
6. Academic Records:
- assignment/presentation/exam save
- signature auto-fills from subject teacher
7. Print/report page loads for semester records.

## 8. Monitoring Recommendations
- Add Sentry for frontend runtime errors.
- Monitor Supabase logs for auth/RPC/RLS errors.
- Track API latency and failed queries.
- Enable alerting for repeated login failures and SQL errors.
