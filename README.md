# JADA — official website

Next.js site with a built-in editor at `/admin`, so content can be updated without touching code.

- **Public site:** a cinematic intro, the horizontal-scroll homepage (hero photo, full-screen muted film, upcoming live shows, release, visuals and more), the Gallery (`/gallery`), the Journal (`/journal`) and a Book JADA request form. Pages are static and regenerate the moment something is saved in the editor.
- **Editor (`/admin`):** list upcoming live shows with dates and ticket links (past shows drop off by themselves), edit every homepage section, swap images and the film by drag and drop, manage the gallery (bulk photo/video upload, captions, categories, order), write Journal posts (drafts and published), manage booking requests, and set SEO and share images per page.
- **Stack:** Next.js 16 (App Router) · Clerk (sign-in, one editor account) · Supabase (Postgres + Storage) · Vercel.

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (see `.env.example`).

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project settings → API keys (anon / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API keys (service_role). Server-only, never expose. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk → your app → API keys |
| `CLERK_ADMIN_USER_ID` | The editor's Clerk user ID (see below) |
| `NEXT_PUBLIC_BREVO_FORM_ACTION` | Optional. JADA's Brevo form is already built in (`lib/site/constants.ts`); set this only to switch to a different form. The value is the `action` URL from a Brevo subscription form (Brevo → Contacts → Forms → Share → Embed HTML), e.g. `https://…sibforms.com/serve/…` |
| `RESEND_API_KEY`, `BOOKING_NOTIFY_TO`, `BOOKING_NOTIFY_FROM` | Optional. Emails each booking request to the team via Resend |

The site's address, `https://www.jadaukofficial.com`, is set in `lib/site/constants.ts` and used for the sitemap, canonical links, share images and event data. Visits to `jadaukofficial.com` and `jada-taupe.vercel.app` redirect there (`next.config.ts`).

### Making the one editor account

1. In Clerk, turn off public sign-ups (Configure → Restrictions → Sign-up mode: Restricted) and invite the editor, or create their user.
2. Sign in at `/admin/sign-in`. The first time, the page shows the account's user ID.
3. Add it as `CLERK_ADMIN_USER_ID` in Vercel and redeploy. Every other account is refused.

## Database

Migrations live in `supabase/migrations`. They are already applied to the Supabase project, along with `supabase/seed.sql` (today's copy). To set up a fresh project, run the migrations in order, then the seed.

- Tables are prefixed `jada_` because the Supabase project is shared.
- The public key can only read published content (row-level security). Booking requests are private. All writes go through server actions that check the Clerk session first.
- Images (up to 8 MB) and videos (MP4/WebM, up to 50 MB, the free-plan limit) upload straight from the browser to the `jada-media` bucket using one-time signed URLs.

`npx tsx scripts/seed-sql.ts > supabase/seed.sql` regenerates the seed from `lib/content/sections.ts`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the keys
npm run dev
```

`npm run lint`, `npm run typecheck` and `npm run build` should all pass before deploying.

## Where things live

```
app/(site)/          public pages (homepage, journal) and site.css
app/admin/           editor: sign-in, overview, sections, journal, bookings, SEO
components/site/     homepage sections, horizontal scroll, booking form
components/admin/    form fields, image dropzone, rich text editor, save bar
lib/content/         content model and validation shared by editor and server
lib/actions/         server actions (save, upload, publish, bookings)
proxy.ts             runs Clerk on /admin only
```
