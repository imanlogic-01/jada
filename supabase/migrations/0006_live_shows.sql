-- Live shows: upcoming gigs with dates, venues and ticket links, edited in /admin.

alter table public.jada_sections drop constraint jada_sections_key_check;
alter table public.jada_sections add constraint jada_sections_key_check check (key in
  ('hero','film','ticker','live','about','release','album','visuals','journal','press','booking','join','footer'));

insert into public.jada_sections (key, content) values ('live', '{"label":"Upcoming shows","heading":"Live *Session*","titleArt":{"src":"/media/live-session-title.webp","alt":"Live Session"},"intro":"Catch JADA live with her all-female band.","poster":{"src":"/media/live-poster.webp","alt":"JADA Live poster with show dates in October and November"},"events":[{"date":"2026-10-21","time":"20:00","title":"The Spotlight Lounge","note":"Live music showcase presented by Accelerando Records","venue":"The Fabwick","city":"London","price":"From £9.38","ticketUrl":"https://www.eventbrite.co.uk/e/the-spotlight-lounge-live-music-showcase-fabwick-tickets-2002210644937?aff=jada","ticketLabel":"Tickets"},{"date":"2026-11-19","time":"19:00","title":"JADA: Past & Present – The Album Experience","note":"Presented by Synapse Recordings","venue":"The Upper Place","city":"London","price":"Free entry","ticketUrl":"https://www.eventbrite.com/e/jada-past-present-the-album-experience-tickets-2002522977131","ticketLabel":"Get free tickets"}],"emptyMessage":"New dates are on the way. Join the mailing list to hear about them first."}'::jsonb) on conflict (key) do nothing;

notify pgrst, 'reload schema';
