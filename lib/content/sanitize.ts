import 'server-only'
import sanitizeHtml from 'sanitize-html'
import { IMAGE_SRC } from './sections'

/** Allows exactly what the journal editor can produce; everything else is stripped. */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'br', 'hr', 'img'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    exclusiveFilter: (frame) => frame.tag === 'img' && !IMAGE_SRC.test(frame.attribs.src ?? ''),
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? ''
        const safe: Record<string, string> = /^https?:/i.test(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href }
        return { tagName, attribs: safe }
      },
    },
  })
}
