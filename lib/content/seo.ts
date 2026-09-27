import { z } from 'zod'
import { IMAGE_SRC } from './sections'


export const SEO_PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/journal', label: 'Journal' },
] as const
export type SeoPath = (typeof SEO_PAGES)[number]['path']
export const isSeoPath = (v: string): v is SeoPath => SEO_PAGES.some((p) => p.path === v)

export const seoSchema = z.object({
  title: z.string().trim().min(1, 'Required').max(70, 'Search engines cut titles after about 60–70 characters'),
  description: z.string().trim().min(1, 'Required').max(170, 'Search engines cut descriptions after about 160 characters'),
  ogImage: z.string().refine((v) => v === '' || IMAGE_SRC.test(v), 'Upload the image again'),
})
export type SeoInput = z.infer<typeof seoSchema>

export const seoDefaults: Record<SeoPath, SeoInput> = {
  '/': {
    title: 'JADA | Official Website',
    description: 'JADA official artist website. New music, visuals, press, bookings and updates.',
    ogImage: '/media/hero.webp',
  },
  '/journal': {
    title: 'Journal | JADA',
    description: 'Notes from the studio, the stage and everything in between from JADA.',
    ogImage: '/media/jada-portrait.webp',
  },
}
