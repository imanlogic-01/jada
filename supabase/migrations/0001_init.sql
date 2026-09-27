-- JADA CMS schema. Tables are prefixed jada_ because the Supabase project is shared.
-- The public (anon) key can only read published content. Every write goes through
-- Next.js server actions using the service-role key after a Clerk admin check.

create or replace function public.jada_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- One row per homepage section. content is validated by the zod schema for that key.
create table public.jada_sections (
  key        text primary key check (key in
             ('hero','ticker','about','release','album','visuals','journal','press','booking','join','footer')),
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.jada_page_seo (
  path        text primary key check (path in ('/', '/journal')),
  title       text not null check (char_length(title) between 1 and 70),
  description text not null check (char_length(description) between 1 and 170),
  og_image    text,
  updated_at  timestamptz not null default now()
);

create table public.jada_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 140),
  excerpt         text not null default '' check (char_length(excerpt) <= 300),
  body_html       text not null default '',
  cover_image     text,
  cover_alt       text not null default '',
  status          text not null default 'draft' check (status in ('draft','published')),
  published_at    timestamptz,
  seo_title       text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (status = 'draft' or published_at is not null)
);
create index jada_posts_published_idx on public.jada_posts (published_at desc) where status = 'published';

create table public.jada_bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  event_type text not null,
  event_date date,
  location   text,
  budget     text,
  message    text not null,
  status     text not null default 'new' check (status in ('new','replied','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jada_bookings_created_idx on public.jada_bookings (created_at desc);
create index jada_bookings_email_idx on public.jada_bookings (email, created_at desc);

create trigger jada_sections_updated before update on public.jada_sections for each row execute function public.jada_set_updated_at();
create trigger jada_page_seo_updated before update on public.jada_page_seo for each row execute function public.jada_set_updated_at();
create trigger jada_posts_updated before update on public.jada_posts for each row execute function public.jada_set_updated_at();
create trigger jada_bookings_updated before update on public.jada_bookings for each row execute function public.jada_set_updated_at();

alter table public.jada_sections enable row level security;
alter table public.jada_page_seo enable row level security;
alter table public.jada_posts    enable row level security;
alter table public.jada_bookings enable row level security;

create policy "Public can read sections" on public.jada_sections for select to anon, authenticated using (true);
create policy "Public can read page SEO" on public.jada_page_seo for select to anon, authenticated using (true);
create policy "Public can read published posts" on public.jada_posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());
-- jada_bookings: no policies, so it is private to the service role.

-- Images: public to read; uploads use signed URLs issued by the server after the admin check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jada-media', 'jada-media', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
