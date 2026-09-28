-- Full-screen film section, a gallery of photos and videos, and video uploads.

alter table public.jada_sections drop constraint jada_sections_key_check;
alter table public.jada_sections add constraint jada_sections_key_check check (key in
  ('hero','film','ticker','about','release','album','visuals','journal','press','booking','join','footer'));

create table public.jada_gallery (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('image','video')),
  category   text not null default 'project' check (category in ('project','behind-the-scenes')),
  image      text,                 -- the photo, or a video's cover image
  video_url  text,                 -- an uploaded video file
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  caption    text not null default '' check (char_length(caption) <= 140),
  alt        text not null default '' check (char_length(alt) <= 160),
  width      int check (width > 0),
  height     int check (height > 0),
  position   double precision not null default extract(epoch from now()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'video' or image is not null),
  check (kind = 'image' or video_url is not null or youtube_id is not null)
);
create index jada_gallery_position_idx on public.jada_gallery (position);
create trigger jada_gallery_updated before update on public.jada_gallery for each row execute function public.jada_set_updated_at();

alter table public.jada_gallery enable row level security;
create policy "Public can read gallery" on public.jada_gallery for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.jada_gallery from anon, authenticated;

-- Videos up to 50 MB (the Supabase free-plan upload limit); images stay limited to 8 MB in the app.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']
where id = 'jada-media';

-- The three film stills that used to live in the Visuals section.
insert into public.jada_gallery (kind, category, image, youtube_id, caption, alt, width, height, position) values
  ('video', 'project', '/media/film-past-and-present.webp', 'oi8ZUCHzJcc', 'Past & Present · Album trailer', 'Past & Present album trailer still', 1600, 900, 1),
  ('image', 'project', '/media/film-visual-review-01.webp', null, 'Inside the visual world', 'JADA visual review still', 735, 1600, 2),
  ('image', 'behind-the-scenes', '/media/film-visual-review-02.webp', null, 'Process & movement', 'JADA visual review still', 1600, 1092, 3);

-- SEO settings for the new /gallery page.
alter table public.jada_page_seo drop constraint jada_page_seo_path_check;
alter table public.jada_page_seo add constraint jada_page_seo_path_check check (path in ('/', '/journal', '/gallery'));

-- Make the API pick up the new table straight away.
notify pgrst, 'reload schema';
