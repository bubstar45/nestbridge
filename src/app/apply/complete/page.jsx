'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function SuccessContent() {
  const params = useSearchParams()
  const listing = params.get('listing')
  const applicationId = params.get('application_id')
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (!applicationId || emailSent) return

    const sendApplicationEmail = async () => {
      try {
        // Fetch the application details
        const { data: app } = await supabase
          .from('applications')
          .select('*, listings(*)')
          .eq('id', applicationId)
          .single()

        if (app?.email) {
          await fetch('/api/send-application-submission-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: app.email,
              fullName: app.full_name,
              listingTitle: app.listings?.title,
            }),
          })
          console.log('Application confirmation email sent')
          setEmailSent(true)
        }
      } catch (error) {
        console.error('Failed to send application email:', error)
      }
    }

    sendApplicationEmail()
  }, [applicationId, emailSent])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        {listing && (
          <p className="text-gray-500 text-sm mb-2">for <strong>{listing}</strong></p>
        )}
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          Your application is under review. We'll get back to you within 24 hours.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📧</span>
            <p className="text-sm font-semibold text-blue-800">Check your email</p>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            We've sent a confirmation to your email. You'll receive another email once 
            your background and credit checks are complete.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link href="/dashboard"
            className="block w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
            View My Applications
          </Link>
          <Link href="/rentals"
            className="block w-full py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Browse More Listings
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}