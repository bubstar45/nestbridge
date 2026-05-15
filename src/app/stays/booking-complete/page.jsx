'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function BookingCompleteContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const [booking, setBooking] = useState(null)
  const [updating, setUpdating] = useState(true)

  useEffect(() => {
    if (!bookingId) return

    const markPaid = async () => {
      // 1. Check current state
      const { data: existing, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        setUpdating(false);
        return;
      }

      // Already confirmed → just display
      if (existing.status === 'confirmed') {
        const { data, error } = await supabase
          .from('bookings')
          .select(`*, listing:listing_id ( title, city, state, images )`)
          .eq('id', bookingId)
          .single();
        if (!error && data) setBooking(data);
        setUpdating(false);
        return;
      }

      // 2. Update status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('id', bookingId);

      if (updateError) {
        setUpdating(false);
        return;
      }

      // 3. Fetch full booking with listing
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, listing:listing_id ( title, city, state, images )`)
        .eq('id', bookingId)
        .single();

      if (!error && data) {
        setBooking(data);

        // Send email only once
        if (data.email && !existing.email_sent) {
          try {
            await fetch('/api/send-booking-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.email,
                fullName: data.full_name,
                listingTitle: data.listing?.title,
                checkIn: data.check_in,
                checkOut: data.check_out,
                guests: data.guests,
                totalPrice: data.total_price,
              }),
            });
            await supabase
              .from('bookings')
              .update({ email_sent: true })
              .eq('id', bookingId);
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }
      }

      setUpdating(false);
    };

    markPaid();
  }, [bookingId]);

  const formatDate = (str) => {
    if (!str) return ''
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (updating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stay-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Confirming your booking…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white border rounded-2xl p-8 text-center shadow-sm mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're booked!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Payment confirmed. A receipt has been sent to your email.
          </p>
        </div>

        {booking && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm mb-4">
            {booking.listing?.images?.[0]?.url && (
              <img
                src={booking.listing.images[0].url}
                alt={booking.listing?.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Property</p>
                <p className="font-semibold text-gray-900">{booking.listing?.title}</p>
                <p className="text-sm text-gray-500">📍 {booking.listing?.city}, {booking.listing?.state}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Check-in</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(booking.check_in)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Check-out</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(booking.check_out)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-400">Total paid</p>
                  <p className="text-lg font-bold text-gray-900">${booking.total_price?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Guests</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.guests}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Booking reference</p>
                <p className="text-sm font-mono font-medium text-gray-700">
                  {bookingId?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {!booking && (
          <div className="bg-white border rounded-2xl p-6 mb-4">
            <p className="text-xs text-gray-400 mb-1">Booking reference</p>
            <p className="text-sm font-mono font-medium text-gray-700">
              {bookingId?.slice(0, 8).toUpperCase()}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/dashboard"
            className="block w-full py-3 bg-stay-500 text-white rounded-xl font-semibold text-center hover:bg-stay-600 transition-colors">
            View My Bookings
          </Link>
          <Link href="/stays"
            className="block w-full py-3 border rounded-xl text-sm font-medium text-center text-gray-600 hover:bg-gray-50 transition-colors">
            Browse More Stays
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookingCompletePage() {
  return (
    <Suspense>
      <BookingCompleteContent />
    </Suspense>
  )
}