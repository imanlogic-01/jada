import Image from 'next/image'
import type { ImageValue } from '@/lib/content/sections'

type Props = { image: ImageValue; className?: string; sizes: string; priority?: boolean; width?: number; height?: number }

/**
 * Layout comes from the site CSS (width, height, aspect-ratio, object-fit), as in the original design.
 * width/height are only a hint for the optimiser and the initial aspect ratio.
 */
export function Img({ image, className, sizes, priority, width = 1600, height = 1600 }: Props) {
  if (!image.src) return null
  return <Image src={image.src} alt={image.alt} width={width} height={height} sizes={sizes} className={className} priority={priority} />
}

export const LOGO = { src: '/media/jada-logo.webp', alt: 'JADA' }
