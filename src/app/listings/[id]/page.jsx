'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import useSWR from 'swr'
import { getListing, createApplication } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ListingDetail() {
  const { id } = useParams()
  const { isSignedIn } = useUser()
  const [applying, setApplying] = useState(false)

  const { data: listing, isLoading } = useSWR(
    `listing-${id}`,
    () => getListing(id).then(r => r.data)
  )

  const handleApply = async () => {
    if (!isSignedIn) return
    setApplying(true)
    try {
      await createApplication({ listing_id: id })
      toast.success('Application submitted!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  if (isLoading) return <div className="p-10 text-center">Loading...</div>
  if (!listing) return <div className="p-10 text-center">Listing not found.</div>

  const { title, city, state, price, price_per_night, listing_mode,
          bedrooms, bathrooms, sqft, type, description, amenities, available_from } = listing

  const displayPrice = price ?? price_per_night

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Photo placeholder */}
      <div className="h-64 rounded-xl overflow-hidden mb-8 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-lg capitalize">{type} in {city}</span>
      </div>

      <div className="flex gap-8">
        {/* Left column */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-gray-500 mb-4">{city}, {state} · <span className="capitalize">{type}</span></p>
          <div className="flex gap-6 text-sm text-gray-600 mb-6">
            <span>🛏 {bedrooms} beds</span>
            <span>🚿 {bathrooms} baths</span>
            <span>📐 {sqft?.toLocaleString()} sqft</span>
          </div>
          <p className="text-gray-700 leading-relaxed mb-8">{description}</p>
          <h3 className="font-semibold mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {(amenities ?? []).map(a => (
              <span key={a} className="px-3 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Right — apply card */}
        <div className="w-72 shrink-0">
          <div className="border rounded-xl p-6 sticky top-24">
            <p className="text-3xl font-bold text-brand-500">
              ${displayPrice?.toLocaleString()}
              <span className="text-base font-normal text-gray-400">
                {listing_mode === 'rental' ? '/mo' : '/night'}
              </span>
            </p>
            {available_from && (
              <p className="text-sm text-gray-500 mt-1 mb-5">
                Available from {new Date(available_from).toLocaleDateString()}
              </p>
            )}
            <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg mb-4">
              A <strong>$50 application fee</strong> is charged via Stripe.
              Refundable if not approved within 7 days.
            </div>
            {isSignedIn
              ? <button onClick={handleApply} disabled={applying}
                  className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50">
                  {applying ? 'Submitting...' : 'Apply — $50 fee'}
                </button>
              : <SignInButton mode="modal">
                  <button className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium">
                    Sign in to Apply
                  </button>
                </SignInButton>
            }
          </div>
        </div>
      </div>
    </div>
  )
}