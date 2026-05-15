import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getBookingConfirmationEmail } from '@/lib/email';  // ✅ import from your email.js

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

export async function POST(request) {
  try {
    const { email, fullName, listingTitle, checkIn, checkOut, guests, totalPrice } = await request.json();

    const html = getBookingConfirmationEmail(
      fullName || 'Guest',
      listingTitle,
      checkIn,
      checkOut,
      guests,
      totalPrice
    );

    const result = await resend.emails.send({
      from: `NestBridge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your stay receipt – NestBridge',
      html,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Booking email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}