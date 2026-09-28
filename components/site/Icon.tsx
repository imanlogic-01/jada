// Drawn icons. Arrow and play characters (↗ ▶) show up as colour emoji on iPhones, so they're never typed as text.

type Props = { size?: number }

export function ArrowUpRight({ size = 12 }: Props) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 8.5l7-7M3.5 1.5h5v5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export function Play({ size = 16 }: Props) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}
