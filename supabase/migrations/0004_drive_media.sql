-- Use the full-quality media from JADA's Drive folder, and fix a video mix-up:
-- YouTube oi8ZUCHzJcc is the "That's What I Like" lyric video, not the Past & Present trailer.
-- Only rows that still hold the original defaults are changed, so edits made in /admin are kept.

-- Gallery: the album trailer becomes the self-hosted file, the two Visual Review stills become
-- playable films, and the lyric video gets its own item.
update public.jada_gallery set youtube_id = null, video_url = '/media/past-and-present-trailer.mp4'
 where image = '/media/film-past-and-present.webp' and youtube_id = 'oi8ZUCHzJcc';
update public.jada_gallery set kind = 'video', video_url = '/media/visual-review-01.mp4'
 where image = '/media/film-visual-review-01.webp' and kind = 'image';
update public.jada_gallery set kind = 'video', video_url = '/media/visual-review-02.mp4'
 where image = '/media/film-visual-review-02.webp' and kind = 'image';
insert into public.jada_gallery (kind, category, image, youtube_id, caption, alt, width, height, position)
select 'video', 'project', '/media/still-lyric-video.webp', 'oi8ZUCHzJcc', 'That''s What I Like · Lyric video', 'That''s What I Like lyric video still', 1600, 900, 1.5
where not exists (select 1 from public.jada_gallery where youtube_id = 'oi8ZUCHzJcc');

-- Homepage sections.
update public.jada_sections set content = jsonb_set(content, '{videoId}', '"oi8ZUCHzJcc"')
 where key = 'release' and content->>'videoId' = 'NRkt5wpzRXw';
update public.jada_sections set content = jsonb_set(content, '{titleArt,src}', '"/media/thats-what-i-like-title.webp"')
 where key = 'release' and content#>>'{titleArt,src}' = '/media/thats-what-i-like-title.png';
update public.jada_sections set content = jsonb_set(content, '{titleArt,src}', '"/media/past-and-present-title.webp"')
 where key = 'album' and content#>>'{titleArt,src}' = '/media/past-and-present-title.png';
update public.jada_sections set content = jsonb_set(content, '{image}', '{"src":"/media/press-photo.webp","alt":"JADA press photo"}')
 where key = 'press' and content#>>'{image,src}' = '/media/jada-portrait.webp';
update public.jada_sections set content = content || '{"video":"/media/past-and-present-trailer.mp4","youtubeId":""}'
 where key = 'film' and content->>'video' = '' and content->>'youtubeId' = 'oi8ZUCHzJcc';
