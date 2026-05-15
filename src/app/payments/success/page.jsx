'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function PaymentSuccessContent() {
  const sp = useSearchParams()
  const ref = sp.get('ref')

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" d="M5 13l4 4L19 7" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
        <p className="text-gray-500 mb-2">
          Your $50 application fee has been received. We'll review your
          application and notify you within 24 hours.
        </p>
        {ref && <p className="text-sm text-gray-400 mb-6">Reference: <code>{ref}</code></p>}
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard"
            className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Track My Application
          </Link>
          <Link href="/listings"
            className="px-5 py-2 border rounded-lg hover:bg-gray-50">
            Browse More
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}