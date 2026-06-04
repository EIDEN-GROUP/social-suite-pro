
# Social Media Simulator & Approval Tool

A fresh rebuild of the EIDEN PHP tool on Lovable Cloud (React + Postgres + Auth + Storage). Superadmin uploads mock posts/reels for each client company across multiple platforms; clients log in to their own branded workspace, preview content exactly as it will appear on Instagram / TikTok / Facebook / X / LinkedIn, and approve or reject each item with comments.

## Design direction

Paper & Ink editorial — off-white `#f5f3ee` canvas, deep ink `#0d0d0d`, soft cream surfaces, generous whitespace, serif display (Instrument Serif / DM Serif) + clean sans body (Inter). Subtle dividers, no neon, refined hover micro-interactions. The simulated phone frames sit on the paper canvas like specimens in a magazine spread.

## Roles

- **Superadmin** — single account (seeded). Manages companies, uploads content per platform, reviews approval status.
- **Client** — one account per company. Sees only their own company's content, can approve / reject with a comment.

## Core features

### Superadmin dashboard
- Companies list (create / edit / delete) — each gets a slug, brand name, accent color, logo, client email/password.
- Per-company workspace with tabs per platform (Instagram, TikTok, Facebook, X, LinkedIn).
- Upload posts: image/video, caption, scheduled date, post type (feed post, reel, story, carousel).
- Drag-to-reorder grid; live preview in the platform mockup.
- Status overview: pending / approved / rejected counts + client comments feed.

### Client workspace
- Branded login (company accent color + logo).
- Realistic device mockups per platform:
  - **Instagram**: profile grid, post detail, reels vertical view
  - **TikTok**: vertical feed
  - **Facebook**: feed card
  - **X / LinkedIn**: timeline cards
- Desktop = side-by-side phone frames; mobile = native-feeling full-screen view.
- Tap any post → Approve / Reject + comment textarea → instantly synced.

### Shareable
- Each company has a stable URL: `/c/{slug}` (login) and `/c/{slug}/workspace` (after auth).
- Approvals timestamped; superadmin sees full history.

## Tech approach

- Lovable Cloud (Supabase) for auth, Postgres, storage (media uploads).
- TanStack Start routing: public `/`, `/login`, `/c/$slug`; authenticated `/_authenticated/admin/*` and `/_authenticated/workspace/*`.
- `user_roles` table with `app_role` enum (`superadmin`, `client`) + `has_role()` security-definer function; clients linked to a company via `company_members`.
- RLS: clients can only read/write their own company's rows; superadmin bypass via `has_role`.
- Tables: `companies`, `company_members`, `platforms` (enum), `posts` (company_id, platform, type, media_url, caption, position, status, scheduled_at), `approvals` (post_id, status, comment, decided_by, decided_at).
- Storage bucket `media` with RLS scoped by company.
- React component library: `<InstagramPhone>`, `<TikTokPhone>`, `<FacebookPhone>` etc., each consuming the same `Post` shape.

## What ships in v1

1. Auth (email/password) + superadmin seed + role enforcement.
2. Companies CRUD + client account creation.
3. Posts CRUD with media upload, drag-reorder, per-platform tabs.
4. Instagram + TikTok + Facebook phone mockups (X + LinkedIn as simpler card mocks).
5. Client approval/reject with comments, realtime status reflection in admin.
6. Paper & Ink design system applied across login, admin, workspace.

## Out of scope for v1 (can add later)

- Real publishing to actual social platforms (no TikTok/Meta API posting).
- Team/staff role between admin and client.
- Email notifications on approval decisions.
- AI-generated captions or image generation inside the tool.

After approval I'll enable Lovable Cloud, scaffold the DB + auth, then build the routes and phone mockups.
