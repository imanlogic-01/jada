-- Defence in depth on top of row-level security: the public roles can only read content,
-- and can't see booking requests at all (they are read and written with the service role only).
revoke all on public.jada_bookings from anon, authenticated;
revoke insert, update, delete, truncate on public.jada_sections, public.jada_page_seo, public.jada_posts from anon, authenticated;
