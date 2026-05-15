import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getApplicationStatusEmail } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

export async function POST(request) {
  try {
    const { email, fullName, listingTitle, status, adminNote } = await request.json();

    const html = getApplicationStatusEmail(fullName, listingTitle, status, adminNote || '');

    const subject = status === 'approved' 
      ? 'Application Approved!' 
      : 'Update on your rental application';

    const result = await resend.emails.send({
      from: `NestBridge <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Application status email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}