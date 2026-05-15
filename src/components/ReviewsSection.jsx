'use client'
import useSWR from 'swr'
import { getReviews } from '@/lib/api'
import ReviewCard from './ReviewCard'

export default function ReviewsSection({ listingId }) {
  const { data: reviews = [], isLoading } = useSWR(
    `reviews-${listingId}`,
    () => getReviews(listingId).then(r => r.data)
  )

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
    : null

  const avgCategory = (key) => reviews.length
    ? (reviews.reduce((sum, r) => sum + (r[key] ?? 5), 0) / reviews.length).toFixed(1)
    : '5.0'

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2].map(i => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  )

  if (reviews.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-3xl mb-2">💬</p>
      <p className="text-sm">No reviews yet.</p>
    </div>
  )

  return (
    <div>
      {/* Overall rating */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl font-bold text-gray-900">{avgRating}</span>
        <div>
          <div className="flex gap-0.5">
            {'★★★★★'.split('').map((s, i) => (
              <span key={i} className={`text-lg ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
          <p className="text-sm text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-2xl">
        {[
          { label: 'Cleanliness', key: 'cleanliness', icon: '🧹' },
          { label: 'Location', key: 'location', icon: '📍' },
          { label: 'Value', key: 'value', icon: '💰' },
        ].map(c => (
          <div key={c.label} className="text-center">
            <p className="text-xl mb-1">{c.icon}</p>
            <p className="font-bold text-gray-900">{avgCategory(c.key)}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Individual reviews */}
      <div>
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  )
}