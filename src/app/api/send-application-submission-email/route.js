import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

function getApplicationSubmissionEmail(name, listingTitle) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Application Received</title></head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; color: #3b5bdb;">NestBridge</span>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #3b5bdb; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Application Received 📋</span>
          </div>
          <h1 style="font-size: 20px; font-weight: 600; text-align: center;">Thanks, ${name}!</h1>
          <p style="text-align: center; color: #4a4a4a;">We received your application for</p>
          <p style="text-align: center; font-weight: bold; color: #3b5bdb;">${listingTitle}</p>
          <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-weight: bold; margin: 0 0 8px 0;">⏳ What happens next?</p>
            <p style="margin: 0;">Our team will review your application within <strong>24 hours</strong>.</p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #3b5bdb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none;">Track Your Application</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request) {
  try {
    const { email, fullName, listingTitle } = await request.json();
    const html = getApplicationSubmissionEmail(fullName || 'Guest', listingTitle);
    const result = await resend.emails.send({
      from: `NestBridge <${FROM_EMAIL}>`,
      to: email,
      subject: 'Application Received - We\'re reviewing it! 📋',
      html,
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Application submission email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}