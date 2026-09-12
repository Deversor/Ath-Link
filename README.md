# Ath-Link

**An Integrated System for Automated PalawanSU Sports Office Operations, Resource Planning, and Athlete Information Accessibility**

A capstone project for Palawan State University's Sports Division. Digitizes athlete registration, document verification, facility reservations, coaching workflows, and academic eligibility checks across six role-based portals.

**Live site:** _add your Vercel URL here_

## Tech Stack

React + TypeScript + Vite · Tailwind CSS + shadcn/ui · React Router · React Hook Form + Zod · Zustand · Supabase (Postgres, Auth, Storage, RLS) · Vercel

## Roles

| Role | Access |
|---|---|
| Student Athlete | Self-signup (whitelisted) |
| Coach | Self-signup (whitelisted per sport) |
| Staff Admin | Whitelisted by Super Admin, requires login key |
| Registrar | Whitelisted by Super Admin, requires login key |
| Super Admin | Bootstrapped once via SQL, requires login key |

Document pipeline: **Coach → Staff Admin → Registrar → Approved / Sent back for revision**.

## Getting Started

```bash
git clone https://github.com/<your-username>/ath-link.git
cd ath-link
npm install
```

Create `.env` from `.env.example`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

## Database Setup

Run every file in `supabase/` **in numeric order** (`schema.sql` first, then `002_...` through `015_...`) via Supabase's SQL Editor.

**Bootstrap the first Super Admin** (the only manual account — everyone else self-registers via whitelist):

1. Supabase Dashboard → Authentication → Users → Add User.
2. Run: `insert into public.profiles (id, email, full_name, role) values ('uid', 'email', 'name', 'superadmin');`
3. Set real admin login keys at the bottom of `005_admin_auth_schema.sql` before running it.

**Also required:** in Authentication → URL Configuration, whitelist your local and deployed domains for `/reset-password`, `/profile-setup`, `/coach-profile-setup`, and `/complete-admin-signup`.

## Deployment

Hosted on Vercel, auto-deploys on push to `main`. Same two env vars as local. Run `npm run build` locally before pushing to catch type errors early.

## Known Limitations

- No real email notifications for whitelisting (would need an Edge Function + email provider)
- No database restore feature (backups/export are real; restore was intentionally left out — use Supabase's own backup tools)
- Password Policy, Session Timeout, and 2FA settings save a value but aren't enforced yet
- No SMTP/email server connected beyond Supabase's built-in auth emails
- Deleting a user removes their profile, not their underlying login (would need Supabase's Admin API)

## Contributors

_Add your team's names here._