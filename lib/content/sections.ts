import { z } from 'zod'

// Shared by the public site, the admin forms (client-side validation) and the server actions.

export const IMAGE_SRC = /^(\/media\/[\w.-]+|https?:\/\/[^/\s]+\/storage\/v1\/object\/public\/jada-media\/\S+)$/

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Accepts a YouTube link in any common form, or a bare 11-character video ID. */
export function youtubeId(input: string) {
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  const match = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/)
  return match ? match[1] : value
}

const required = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, `Keep this under ${max} characters`)
const optional = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`)
const link = z.string().trim().min(1, 'Required').refine(isHttpUrl, 'Enter a full link starting with https://')
export const youtube = z
  .string()
  .trim()
  .transform(youtubeId)
  .refine((v) => v === '' || /^[\w-]{11}$/.test(v), 'Paste a YouTube link or video ID')

export const imageSchema = z.object({
  src: z.string().min(1, 'Add an image').regex(IMAGE_SRC, 'Upload the image again'),
  alt: z.string().trim().min(1, 'Describe the image for screen readers').max(160, 'Keep this under 160 characters'),
})
const optionalImage = z.object({
  src: z.string().refine((v) => v === '' || IMAGE_SRC.test(v), 'Upload the image again'),
  alt: optional(160),
})
export type ImageValue = z.infer<typeof imageSchema>

const detailItem = z.object({ title: required(60), detail: required(200) })

export const sectionSchemas = {
  hero: z.object({ image: imageSchema }),
  film: z
    .object({
      video: z.string().refine((v) => v === '' || IMAGE_SRC.test(v), 'Upload the video again'),
      youtubeId: youtube,
      poster: optionalImage,
      label: optional(60),
      title: optional(80),
    })
    .refine((f) => f.video || f.youtubeId, { path: ['video'], message: 'Upload a video or paste a YouTube link below' }),
  ticker: z.object({ text: required(80), tag: required(30), url: link }),
  about: z.object({
    label: required(60),
    heading: required(80),
    body: required(600),
    linkLabel: required(40),
    image: imageSchema,
  }),
  release: z.object({
    label: required(40),
    heading: required(40),
    title: required(80),
    body: required(500),
    cover: imageSchema,
    titleArt: optionalImage,
    listenLabel: required(30),
    listenUrl: link,
    videoLabel: required(30),
    videoId: youtube,
    menuCaption: required(100),
  }),
  album: z.object({
    label: required(40),
    title: required(60),
    body: required(700),
    linkLabel: required(40),
    linkUrl: link,
    cover: imageSchema,
    titleArt: optionalImage,
    quoteLabel: required(40),
    quote: required(300),
  }),
  visuals: z.object({ label: required(60), heading: required(40), linkLabel: required(30) }),
  journal: z.object({ label: required(40), heading: required(40), intro: required(240), linkLabel: required(30) }),
  press: z.object({
    label: required(40),
    heading: required(40),
    lead: required(200),
    body: required(1200),
    image: imageSchema,
    stats: z.array(detailItem).max(6, 'Up to 6 facts'),
    assetsLabel: required(40),
    assetsUrl: link,
  }),
  booking: z.object({
    label: required(40),
    heading: required(40),
    intro: required(400),
    offerings: z.array(detailItem).max(6, 'Up to 6 services'),
    email: z.string().trim().refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address'),
    successMessage: required(200),
  }),
  join: z.object({
    label: required(40),
    heading: required(40),
    body: required(300),
    note: optional(200),
    successMessage: required(200),
  }),
  footer: z.object({
    socials: z.array(z.object({ label: required(30), url: link })).max(8, 'Up to 8 links'),
    copyright: required(60),
    note: optional(80),
  }),
}

export type SectionKey = keyof typeof sectionSchemas
export type SectionContent<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>
export type Sections = { [K in SectionKey]: SectionContent<K> }

export const SECTION_KEYS = Object.keys(sectionSchemas) as SectionKey[]
export const isSectionKey = (value: string): value is SectionKey => value in sectionSchemas

// Today's site copy. Used to seed the database and as a fallback if a row is missing.
export const sectionDefaults: Sections = {
  hero: { image: { src: '/media/hero.webp', alt: 'JADA' } },
  film: {
    video: '',
    youtubeId: 'oi8ZUCHzJcc',
    poster: { src: '/media/film-past-and-present.webp', alt: 'Past & Present album trailer' },
    label: '',
    title: '',
  },
  ticker: { text: "That's What I Like feat. MichaelTheVillain", tag: 'Out now', url: 'https://hypeddit.com/j02cru' },
  about: {
    label: 'JADA · The artist',
    heading: 'Music made\nto be *felt.*',
    body: 'JADA creates from the meeting point of musicianship, live performance and visual storytelling. Her world is expressive, soulful and built around connection.',
    linkLabel: 'Meet JADA',
    image: { src: '/media/jada-portrait.webp', alt: 'JADA portrait' },
  },
  release: {
    label: 'Current release',
    heading: 'Out now.',
    title: "That's What\nI *Like.*",
    body: 'JADA feat. MichaelTheVillain. Step into the latest chapter through the single, lyric film and visual world surrounding the release.',
    cover: { src: '/media/thats-what-i-like-cover.webp', alt: "That's What I Like cover art" },
    titleArt: { src: '/media/thats-what-i-like-title.png', alt: "That's What I Like" },
    listenLabel: 'Listen now',
    listenUrl: 'https://hypeddit.com/j02cru',
    videoLabel: 'Watch lyric video',
    videoId: 'NRkt5wpzRXw',
    menuCaption: "Current release · That's What I Like feat. MichaelTheVillain",
  },
  album: {
    label: 'Featured project',
    title: 'Past &\n*Present.*',
    body: 'Written from lessons learned across childhood and young adulthood, the project explores empowerment, love, vulnerability and growth. For JADA, telling the story through music became part of finding confidence in herself.',
    linkLabel: 'Explore the project',
    linkUrl: 'https://hypeddit.com/j02cru',
    cover: { src: '/media/past-and-present-cover.webp', alt: 'Past & Present album artwork' },
    titleArt: { src: '/media/past-and-present-title.png', alt: 'Past & Present' },
    quoteLabel: "In JADA's words",
    quote: '“This project represents *growth.* Telling my story in music form has healed me and allowed me to find a new confidence in myself.”',
  },
  visuals: { label: 'Films · campaign · process', heading: 'Visuals.', linkLabel: 'View the gallery' },
  journal: {
    label: 'From the journal',
    heading: 'Journal.',
    intro: 'Notes from the studio, the stage and everything in between.',
    linkLabel: 'Read the journal',
  },
  press: {
    label: 'Mini press kit',
    heading: 'JADA.',
    lead: 'Singer, songwriter, multi-instrumentalist and creative entrepreneur from Hertfordshire, England.',
    body: 'Rooted in powerful vocals, musicianship and a deep love for live performance, JADA creates music and experiences centred around storytelling, emotional connection and creative expression. Her musical journey began in church and has evolved into a multidisciplinary practice combining live music, movement, visual storytelling and audience connection.',
    image: { src: '/media/jada-portrait.webp', alt: 'JADA press portrait' },
    stats: [
      { title: '5 instruments', detail: 'Voice · Guitar · Bass · Drums · Piano' },
      { title: 'Artist + founder', detail: 'Synapse Recordings' },
      { title: 'Press ready', detail: 'Bio · photos · music · videos' },
    ],
    assetsLabel: 'Open press assets',
    assetsUrl: 'https://drive.google.com/drive/folders/1SRvnrz6tgEajEGSqfZgjzLK_iWQHAhLk',
  },
  booking: {
    label: 'Bookings',
    heading: 'Book\n*JADA.*',
    intro: 'For live performances, private and corporate events, session work and creative collaborations. Share a few details and the team will be in touch.',
    offerings: [
      { title: 'Live performance', detail: 'Full band or stripped-back acoustic sets for festivals, venues and showcases.' },
      { title: 'Private & corporate events', detail: 'Weddings, launches, galas and celebrations, shaped around the room.' },
      { title: 'Session work', detail: 'Vocals, guitar, bass, drums and piano for records and live shows.' },
      { title: 'Brand collaborations', detail: "Campaigns, content and partnerships that fit JADA's world." },
    ],
    email: '',
    successMessage: "Thank you. Your request is with the team and we'll be in touch soon.",
  },
  join: {
    label: 'JADA direct',
    heading: 'Stay\n*close.*',
    body: 'New music, visual releases, live dates and personal updates from JADA. Join the list and stay connected beyond the feed.',
    note: 'Mailing list powered by Brevo. Unsubscribe at any time.',
    successMessage: "You're on the list. Welcome to JADA's world.",
  },
  footer: {
    socials: [
      { label: 'Instagram', url: 'https://www.instagram.com/jadaukofficial/' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@jadaukofficial' },
      { label: 'YouTube', url: 'https://youtube.com/@jadaukofficial' },
      { label: 'Listen', url: 'https://hypeddit.com/j02cru' },
    ],
    copyright: 'JADA',
    note: 'Official website',
  },
}

// ---- Admin form description ----

export type FieldDef =
  | { name: string; label: string; kind: 'text' | 'url' | 'email' | 'youtube'; help?: string }
  | { name: string; label: string; kind: 'textarea' | 'heading'; help?: string; rows?: number }
  | { name: string; label: string; kind: 'image'; help?: string; optional?: boolean }
  | { name: string; label: string; kind: 'video'; help?: string }
  | { name: string; label: string; kind: 'list'; help?: string; itemLabel: string; titleField: string; max: number; min?: number; fields: FieldDef[]; empty: () => Record<string, unknown> }

const HEADING_HELP = 'Wrap words in *asterisks* for gold italics. Press Enter for a new line.'
const heading = (name: string, label: string): FieldDef => ({ name, label, kind: 'heading', help: HEADING_HELP, rows: 2 })
const text = (name: string, label: string, help?: string): FieldDef => ({ name, label, kind: 'text', help })
const area = (name: string, label: string, rows = 4, help?: string): FieldDef => ({ name, label, kind: 'textarea', rows, help })
const url = (name: string, label: string, help?: string): FieldDef => ({ name, label, kind: 'url', help })
const image = (name: string, label: string, help?: string, optional?: boolean): FieldDef => ({ name, label, kind: 'image', help, optional })
const detailFields = (title: string, detail: string): FieldDef[] => [text('title', title), area('detail', detail, 2)]

export const sectionEditors: { [K in SectionKey]: { title: string; blurb: string; anchor: string; fields: FieldDef[] } } = {
  hero: { title: 'Hero', blurb: 'The full-screen photo visitors see first. No text sits on top of it.', anchor: '#home', fields: [image('image', 'Hero photo', 'A large, high-resolution photo works best, at least 1800px wide.')] },
  film: {
    title: 'Full-screen video',
    blurb: 'Plays muted on a loop straight after the hero photo, with a sound button. Upload a video file for the smoothest playback, or use a YouTube link.',
    anchor: '#film',
    fields: [
      { name: 'video', label: 'Video file', kind: 'video', help: 'Short loops work best. In Canva: Share → Download → MP4 Video.' },
      { name: 'youtubeId', label: 'Or a YouTube video', kind: 'youtube', help: 'Used when no video file is uploaded.' },
      image('poster', 'Cover image (optional)', 'Shown while the video loads and for visitors who turn off motion.', true),
      text('label', 'Small label (optional)', 'For example “Past & Present · Album trailer”. Leave empty for no text.'),
      text('title', 'Title (optional)', 'Leave empty to let the video speak for itself.'),
    ],
  },
  ticker: {
    title: 'Release ticker',
    blurb: 'The scrolling strip that promotes the latest release.',
    anchor: '#home',
    fields: [text('text', 'Ticker text'), text('tag', 'Highlight', 'Shown in gold after the text, for example “Out now”.'), url('url', 'Link')],
  },
  about: {
    title: 'About',
    blurb: 'The artist statement and portrait.',
    anchor: '#about',
    fields: [text('label', 'Small label'), heading('heading', 'Heading'), area('body', 'Intro text'), text('linkLabel', 'Link text', 'Links to the press kit section.'), image('image', 'Portrait')],
  },
  release: {
    title: 'Current release',
    blurb: 'The single being promoted right now. The cover also appears in the menu.',
    anchor: '#music',
    fields: [
      text('label', 'Small label'),
      heading('heading', 'Section heading'),
      heading('title', 'Release title'),
      area('body', 'Description'),
      image('cover', 'Cover art', 'Square artwork, at least 1200 × 1200px.'),
      image('titleArt', 'Title artwork (optional)', 'A transparent PNG laid over the bottom of the cover.', true),
      text('listenLabel', 'Listen button text'),
      url('listenUrl', 'Listen link', 'Smart link, Spotify, Apple Music or similar.'),
      text('videoLabel', 'Video button text'),
      { name: 'videoId', label: 'YouTube video (optional)', kind: 'youtube', help: 'Paste the YouTube link. Leave empty to hide the video button.' },
      text('menuCaption', 'Menu caption', 'Shown under the cover in the site menu.'),
    ],
  },
  album: {
    title: 'Featured project',
    blurb: 'The album or EP feature with artwork and a quote.',
    anchor: '#album',
    fields: [
      text('label', 'Small label'),
      heading('title', 'Title'),
      area('body', 'Description'),
      text('linkLabel', 'Link text'),
      url('linkUrl', 'Link'),
      image('cover', 'Artwork', 'Square artwork, at least 1200 × 1200px.'),
      image('titleArt', 'Title artwork (optional)', 'A transparent PNG laid over the artwork.', true),
      text('quoteLabel', 'Quote label'),
      area('quote', 'Quote', 3, HEADING_HELP),
    ],
  },
  visuals: {
    title: 'Visuals',
    blurb: 'The homepage row of photos and videos. Add, reorder and caption them in Gallery.',
    anchor: '#visuals',
    fields: [text('label', 'Small label'), heading('heading', 'Heading'), text('linkLabel', 'Link text', 'Links to the full gallery page.')],
  },
  journal: {
    title: 'Journal panel',
    blurb: 'The homepage panel showing the three latest journal posts. It hides itself until a post is published.',
    anchor: '#journal',
    fields: [text('label', 'Small label'), heading('heading', 'Heading'), area('intro', 'Intro', 2), text('linkLabel', 'Link text')],
  },
  press: {
    title: 'Press kit',
    blurb: 'Biography, quick facts and the press assets link.',
    anchor: '#press',
    fields: [
      text('label', 'Small label'),
      heading('heading', 'Heading'),
      area('lead', 'Lead sentence', 2),
      area('body', 'Biography', 6),
      image('image', 'Press photo', 'Portrait orientation works best.'),
      { name: 'stats', label: 'Quick facts', kind: 'list', itemLabel: 'Fact', titleField: 'title', max: 6, empty: () => ({ title: '', detail: '' }), fields: detailFields('Fact', 'Detail') },
      text('assetsLabel', 'Press assets link text'),
      url('assetsUrl', 'Press assets link', 'For example a shared Google Drive folder.'),
    ],
  },
  booking: {
    title: 'Book JADA',
    blurb: 'What JADA can be booked for, next to the booking request form.',
    anchor: '#book',
    fields: [
      text('label', 'Small label'),
      heading('heading', 'Heading'),
      area('intro', 'Intro'),
      { name: 'offerings', label: 'Services', kind: 'list', itemLabel: 'Service', titleField: 'title', max: 6, empty: () => ({ title: '', detail: '' }), fields: detailFields('Service', 'Description') },
      { name: 'email', label: 'Bookings email (optional)', kind: 'email', help: 'Shown under the form for people who prefer to email.' },
      area('successMessage', 'Thank-you message', 2, 'Shown after someone sends a request.'),
    ],
  },
  join: {
    title: 'Mailing list',
    blurb: 'The sign-up panel.',
    anchor: '#join',
    fields: [text('label', 'Small label'), heading('heading', 'Heading'), area('body', 'Intro', 3), text('note', 'Small print'), area('successMessage', 'Thank-you message', 2)],
  },
  footer: {
    title: 'Footer & socials',
    blurb: 'Social links (also shown in the menu) and the copyright line.',
    anchor: '#contact',
    fields: [
      { name: 'socials', label: 'Social links', kind: 'list', itemLabel: 'Link', titleField: 'label', max: 8, empty: () => ({ label: '', url: '' }), fields: [text('label', 'Name'), url('url', 'Link')] },
      text('copyright', 'Copyright name', 'Shown as “© [year] [name]”.'),
      text('note', 'Small print'),
    ],
  },
}
