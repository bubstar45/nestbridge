import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { listing_title, total, nights, booking_id } = body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing_title,
              description: `${nights} night${nights !== 1 ? 's' : ''} stay`,
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/stays/booking-complete?booking_id=${booking_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/stays`,
      metadata: {
        booking_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}