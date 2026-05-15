import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  try {
    const { listing_id, listing_title, application_id } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Rental Application Fee',
              description: `Application for ${listing_title}`,
            },
            unit_amount: 5000, // $50 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/complete?listing=${encodeURIComponent(listing_title)}&application_id=${application_id}&paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/${listing_id}`,
      metadata: {
        listing_id,
        application_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}