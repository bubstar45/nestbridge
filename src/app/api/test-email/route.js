import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'frrget2@gmail.com',  // your email
      subject: 'Test from NestBridge',
      html: '<p>If you see this, Resend works!</p>',
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}