-- Use the wording from JADA's Brevo form for the mailing-list panel, unless it has been edited in /admin.
update public.jada_sections set content = jsonb_set(content, '{label}', '"Personal updates from JADA"')
 where key = 'join' and content->>'label' = 'JADA direct';
update public.jada_sections set content = jsonb_set(content, '{successMessage}', '"Thank you for signing up to Jada''s Mailing List!"')
 where key = 'join' and content->>'successMessage' = 'You''re on the list. Welcome to JADA''s world.';
