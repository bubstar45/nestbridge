import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key here — webhook runs server-side, bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session   = event.data.object
    const bookingId = session.metadata?.booking_id

    if (bookingId) {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status:   'paid',
          status:           'confirmed',
          stripe_session_id: session.id,
        })
        .eq('id', bookingId)

      if (error) console.error('Supabase update error:', error)
    }
  }

  return NextResponse.json({ received: true })
}

// Required: tell Next.js not to parse the body (Stripe needs raw bytes for signature)
export const config = { api: { bodyParser: false } }