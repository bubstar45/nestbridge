import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// For testing, use Resend's default domain
// Once you verify your own domain, change 'onboarding@resend.dev' to 'noreply@nestbridge.homes'
const FROM_EMAIL = 'onboarding@resend.dev'

export async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: `NestBridge <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log('Email sent:', result)
    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

// Application Status Email - Approved & Rejected with Refund
export function getApplicationStatusEmail(name, listingTitle, status, adminNote = '', landlordName = '') {
  const isApproved = status === 'approved'
  const color = isApproved ? '#10b981' : '#ef4444'
  const statusText = isApproved ? 'Approved' : 'Not Selected'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application ${statusText} - NestBridge</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; color: #111111;">NestBridge</span>
          </div>
          
          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: ${color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
              ${statusText}
            </span>
          </div>
          
          ${isApproved ? `
            <!-- Approved Content -->
            <h1 style="font-size: 22px; font-weight: 600; color: #111111; margin: 0 0 8px 0; text-align: center;">
              Congratulations, ${name}!
            </h1>
            
            <p style="font-size: 15px; color: #4a4a4a; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
              Your application for <strong style="color: #111111;">${listingTitle}</strong> has been <strong style="color: ${color};">approved</strong>.
            </p>
            
            ${adminNote ? `
              <div style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 13px; color: #92400e; margin: 0;"><strong>Note from landlord:</strong> ${adminNote}</p>
              </div>
            ` : ''}
            
            <!-- What happens next -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 15px; font-weight: 600; margin: 0 0 12px 0; color: #111111;">
                What happens next:
              </p>
              <p style="font-size: 14px; color: #4a4a4a; line-height: 1.5; margin: 0 0 16px 0;">
                The landlord${landlordName ? ` (${landlordName})` : ''} will reach out to you directly via <strong>email and phone</strong> to schedule a viewing and move-in inspection.
              </p>
              <div style="background-color: #eef2ff; border-radius: 8px; padding: 12px;">
                <p style="font-size: 13px; color: #1e3a8a; margin: 0;">
                  💡 <strong>Tip:</strong> Keep an eye on your email and phone (including spam folder) for their message.
                </p>
              </div>
            </div>
            
            <!-- Note about timing -->
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0 0 24px 0;">
              The landlord typically responds within 1-2 business days.
            </p>
            
          ` : `
            <!-- Rejected Content with Refund -->
            <h1 style="font-size: 22px; font-weight: 600; color: #111111; margin: 0 0 8px 0; text-align: center;">
              Hi ${name},
            </h1>
            
            <p style="font-size: 15px; color: #4a4a4a; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
              Your application for <strong style="color: #111111;">${listingTitle}</strong> was <strong style="color: ${color};">not selected</strong>.
            </p>
            
            ${adminNote ? `
              <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 13px; color: #991b1b; margin: 0;"><strong>Note from landlord:</strong> ${adminNote}</p>
              </div>
            ` : ''}
            
            <!-- Refund Information -->
            <div style="background-color: #ecfdf5; border-left: 3px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #065f46;">
                💵 Application Fee Refund
              </p>
              <p style="font-size: 14px; color: #065f46; line-height: 1.4; margin: 0;">
                Your application fee of <strong>$50</strong> will be refunded to your original payment method within <strong>5-7 business days</strong>.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #4a4a4a; line-height: 1.5; margin: 0;">
                Don't worry — there are many other homes available. Browse new listings and apply again.
              </p>
            </div>
          `}
          
          <!-- Button -->
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #111111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;">
              ${isApproved ? 'Go to Dashboard' : 'Browse Listings'}
            </a>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">
              NestBridge — Find Your Perfect Home
            </p>
            <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">
              © ${new Date().getFullYear()} NestBridge. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Booking Confirmation Email
export function getBookingConfirmationEmail(name, listingTitle, checkIn, checkOut, guests, total) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; color: #e8590c;">NestBridge</span>
          </div>
          
          <!-- Confirmation Badge -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
              Booking Confirmed! ✅
            </span>
          </div>
          
          <!-- Greeting -->
          <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; text-align: center;">
            You're all set, ${name}!
          </h1>
          
          <p style="font-size: 15px; color: #4a4a4a; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
            Your stay at <strong style="color: #e8590c;">${listingTitle}</strong> is confirmed.
          </p>
          
          <!-- Booking Details -->
          <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
              📋 Booking Details
            </p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; color: #6b7280;">Check-in</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${new Date(checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; color: #6b7280;">Check-out</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${new Date(checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; color: #6b7280;">Guests</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${guests} guest${guests > 1 ? 's' : ''}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e5e5;">
              <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">Total Paid</span>
              <span style="font-size: 16px; font-weight: 700; color: #e8590c;">$${total.toLocaleString()}</span>
            </div>
          </div>
          
          <!-- NEXT STEPS - Important Information -->
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 700; color: #92400e; margin: 0 0 12px 0;">
              🏠 What happens next?
            </p>
            <div style="font-size: 13px; color: #92400e; line-height: 1.5; margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0;">✓ You will receive a separate email within 24 hours with:</p>
              <ul style="margin: 4px 0 0 20px; padding: 0;">
                <li>📍 Exact property address and access instructions</li>
                <li>🔑 Check-in details (door code, key location, etc.)</li>
                <li>📞 Host contact information</li>
                <li>📶 Wi-Fi password and house manual</li>
              </ul>
            </div>
          </div>
          
          <!-- Contact Support -->
          <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 700; color: #166534; margin: 0 0 8px 0;">
              ❓ Need help?
            </p>
            <p style="font-size: 13px; color: #166534; line-height: 1.5; margin: 0 0 12px 0;">
              If you don't receive the follow-up email within 24 hours, or if you have any questions about your stay, please contact us:
            </p>
            <div style="text-align: center;">
              <a href="mailto:support@nestbridge.com" style="display: inline-block; background-color: #e8590c; color: white; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; margin-bottom: 12px;">
                📧 Email Support
              </a>
              <p style="font-size: 12px; color: #166534; margin: 0;">
                Or call us at: <strong style="font-weight: 600;">+1 (555) 123-4567</strong>
              </p>
            </div>
          </div>
          
          <!-- Quick Tips -->
          <div style="background-color: #eff6ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 12px; font-weight: 600; color: #1e40af; margin: 0 0 8px 0;">
              💡 Quick Tips
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1e40af; line-height: 1.5;">
              <li>Save this email for easy reference</li>
              <li>Check your spam folder for the follow-up email</li>
              <li>Have your ID ready for check-in</li>
              <li>Review the cancellation policy in your dashboard</li>
            </ul>
          </div>
          
          <!-- Dashboard Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #e8590c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;">
              View My Bookings
            </a>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">
              NestBridge — Short Stays & Long-term Rentals
            </p>
            <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">
              © ${new Date().getFullYear()} NestBridge. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Booking Cancellation Email
export function getBookingCancellationEmail(name, listingTitle) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; color: #e8590c;">NestBridge</span>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
              Booking Cancelled
            </span>
          </div>
          
          <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; text-align: center;">
            Hi ${name},
          </h1>
          
          <p style="font-size: 15px; color: #4a4a4a; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
            Your booking for <strong style="color: #e8590c;">${listingTitle}</strong> has been cancelled.
          </p>
          
          <!-- Refund Info -->
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #92400e;">
              💰 Refund Information
            </p>
            <p style="font-size: 13px; color: #92400e; line-height: 1.4; margin: 0;">
              Your refund will be processed within 5-10 business days to your original payment method. No further action is needed from you.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/stays" style="display: inline-block; background-color: #e8590c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500;">
              Browse More Stays
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">
              NestBridge — Short Stays & Long-term Rentals
            </p>
            <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">
              © ${new Date().getFullYear()} NestBridge. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}