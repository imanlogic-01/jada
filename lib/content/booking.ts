import { z } from 'zod'

export const EVENT_TYPES = ['Live performance', 'Private or corporate event', 'Wedding', 'Session work', 'Brand collaboration', 'Press or interview', 'Something else'] as const
export const BUDGETS = ['Under £1,000', '£1,000 – £2,500', '£2,500 – £5,000', '£5,000+', 'Not sure yet'] as const
export const BOOKING_STATUSES = ['new', 'replied', 'archived'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

const todayInLondon = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())

export const bookingSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name').max(100, 'Keep this under 100 characters'),
  email: z.string().trim().toLowerCase().max(200, 'Keep this under 200 characters').pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().max(40, 'Keep this under 40 characters').regex(/^[\d\s()+-]*$/, 'Use numbers only'),
  eventType: z.enum(EVENT_TYPES, 'Choose what you’re booking for'),
  eventDate: z
    .string()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Enter a valid date')
    .refine((v) => v === '' || v >= todayInLondon(), 'Choose a date in the future'),
  location: z.string().trim().max(120, 'Keep this under 120 characters'),
  budget: z.union([z.literal(''), z.enum(BUDGETS)]),
  message: z.string().trim().min(20, 'Tell us a little more (at least 20 characters)').max(2000, 'Keep this under 2,000 characters'),
})
export type BookingInput = z.infer<typeof bookingSchema>

export type BookingRow = {
  id: string
  name: string
  email: string
  phone: string | null
  event_type: string
  event_date: string | null
  location: string | null
  budget: string | null
  message: string
  status: BookingStatus
  created_at: string
}
