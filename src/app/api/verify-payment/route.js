import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      form_data: session.metadata?.form_data,
      listing_id: session.metadata?.listing_id,
      listing_title: session.metadata?.listing_title,
      payment_status: session.payment_status,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}