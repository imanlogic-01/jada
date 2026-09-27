'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { BOOKING_STATUSES, bookingSchema, type BookingInput } from '@/lib/content/booking'
import { fieldErrors, type FieldErrors, type ActionResult } from '@/lib/content/errors'
import { notifyBooking } from '@/lib/notify'
import { guarded } from './guard'

export type BookingFormState = { status: 'idle' | 'success' | 'error'; message?: string; errors?: FieldErrors; values?: Record<string, string>; key: number }

const FIELDS = ['name', 'email', 'phone', 'eventType', 'eventDate', 'location', 'budget', 'message'] as const

/** Public booking form. Stored privately (no public RLS policy) and optionally emailed to the team. */
export async function submitBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? '')]))
  const key = Date.now()

  // Spam trap 1: a hidden field people never see.
  if (formData.get('company')) return { status: 'success', key }

  const parsed = bookingSchema.safeParse(values)
  if (!parsed.success) return { status: 'error', message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error), values, key }
  const booking: BookingInput = parsed.data

  // Spam trap 2: a complete form sent within seconds of the page loading is a bot. Pretend it worked.
  const startedAt = Number(formData.get('startedAt'))
  if (!startedAt || key - startedAt < 3000) return { status: 'success', key }

  try {
    const supabase = adminClient()
    const since = new Date(key - 60 * 60_000).toISOString()
    const { count, error: countError } = await supabase
      .from('jada_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('email', booking.email.toLowerCase())
      .gte('created_at', since)
    if (countError) throw countError
    if ((count ?? 0) >= 3) return { status: 'error', message: 'We’ve already received your recent requests. The team will be in touch soon.', values, key }

    const { error } = await supabase.from('jada_bookings').insert({
      name: booking.name,
      email: booking.email.toLowerCase(),
      phone: booking.phone || null,
      event_type: booking.eventType,
      event_date: booking.eventDate || null,
      location: booking.location || null,
      budget: booking.budget || null,
      message: booking.message,
    })
    if (error) throw error
  } catch (error) {
    console.error('Booking request failed', error)
    return { status: 'error', message: 'Sorry, your request couldn’t be sent. Please try again in a moment.', values, key }
  }

  await notifyBooking(booking)
  revalidatePath('/admin', 'layout')
  return { status: 'success', key }
}

export async function setBookingStatus(id: string, status: string): Promise<ActionResult> {
  return guarded(async () => {
    const next = BOOKING_STATUSES.find((s) => s === status)
    if (!next) return { ok: false, message: 'Unknown status.' }
    const { error } = await adminClient().from('jada_bookings').update({ status: next }).eq('id', id)
    if (error) throw error
    revalidatePath('/admin', 'layout')
    return { ok: true }
  })
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { error } = await adminClient().from('jada_bookings').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/admin', 'layout')
    return { ok: true }
  })
}
