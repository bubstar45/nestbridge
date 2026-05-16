'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createApplication } from '@/lib/api'

function CompleteContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState('loading')
  const [listing, setListing] = useState('')

  useEffect(() => {
    if (!sessionId) return

    const saveApplication = async () => {
      try {
        // Fetch session from Stripe to get form data
        const res = await fetch(`/api/verify-payment?session_id=${sessionId}`)
        const { form_data, listing_title, listing_id } = await res.json()

        if (!form_data) throw new Error('No form data')

        const form = JSON.parse(form_data)

        // Now save application to DB
        await createApplication({
          listing_id,
          ...form,
          status: 'pending',
          payment_status: 'paid',
        })

        setListing(listing_title)
        setStatus('success')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }

    saveApplication()
  }, [sessionId])

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Confirming your payment...</p>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border rounded-2xl p-10 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-6">Your payment was received but we couldn't save your application. Please contact support.</p>
        <Link href="/rentals" className="text-brand-500 text-sm">← Back to rentals</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white border rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        {listing && <p className="text-gray-500 text-sm mb-2">for <strong>{listing}</strong></p>}
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Your payment was confirmed and your application is now under review. We'll get back to you within 24 hours.
        </p>
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
  return <Suspense><CompleteContent /></Suspense>
}