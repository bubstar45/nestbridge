import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getBookingCancellationEmail } from '@/lib/email';  // ✅ import the HTML function

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

export async function POST(request) {
  try {
    const { email, fullName, listingTitle } = await request.json();

    const html = getBookingCancellationEmail(fullName || 'Guest', listingTitle);

    const result = await resend.emails.send({
      from: `NestBridge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Booking Cancellation Confirmed',
      html,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Cancellation email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}