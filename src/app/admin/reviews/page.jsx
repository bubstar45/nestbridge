'use client'
import { useState } from 'react'
import { createReview, getAdminListings, deleteReview } from '@/lib/api'
import useSWR from 'swr'
import toast from 'react-hot-toast'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const YEARS = ['2023','2024','2025']

export default function AdminReviews() {
  const { data: listings = [] } = useSWR('admin-listings', () => getAdminListings().then(r => r.data))

  const [form, setForm] = useState({
    listing_id: '',
    reviewer_name: '',
    reviewer_city: '',
    reviewer_avatar: '',
    rating: '5',
    cleanliness: '5',
    location: '5',
    value: '5',
    review_text: '',
    stay_month: 'January',
    stay_year: '2024',
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async () => {
    if (!form.listing_id || !form.reviewer_name || !form.review_text) {
      return toast.error('Please fill all required fields.')
    }
    setSaving(true)
    try {
      await createReview({
        listing_id: form.listing_id,
        reviewer_name: form.reviewer_name,
        reviewer_city: form.reviewer_city,
        reviewer_avatar: form.reviewer_avatar || null,
        rating: parseFloat(form.rating),
        cleanliness: parseFloat(form.cleanliness),
        location: parseFloat(form.location),
        value: parseFloat(form.value),
        review_text: form.review_text,
        stay_date: `${form.stay_month} ${form.stay_year}`,
      })
      toast.success('Review created!')
      setForm(p => ({ ...p, reviewer_name: '', reviewer_city: '', reviewer_avatar: '', review_text: '', rating: '5' }))
    } catch {
      toast.error('Failed to create review.')
    } finally {
      setSaving(false)
    }
  }

  const stayListings = listings.filter(l => l.listing_mode === 'short_stay')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Create Review</h1>
      <p className="text-gray-500 text-sm mb-8">Add a verified guest review to a short stay listing.</p>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        {/* Listing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing *</label>
          <select
            value={form.listing_id}
            onChange={e => set('listing_id', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Select a listing...</option>
            {stayListings.map(l => (
              <option key={l.id} value={l.id}>{l.title} — {l.city}, {l.state}</option>
            ))}
          </select>
        </div>

        {/* Reviewer */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name *</label>
            <input
              value={form.reviewer_name}
              onChange={e => set('reviewer_name', e.target.value)}
              placeholder="e.g. Sarah M."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer City *</label>
            <input
              value={form.reviewer_city}
              onChange={e => set('reviewer_city', e.target.value)}
              placeholder="e.g. Chicago, IL"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (optional)</label>
          <input
            value={form.reviewer_avatar}
            onChange={e => set('reviewer_avatar', e.target.value)}
            placeholder="https://..."
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Use a photo from unsplash.com/photos for realism</p>
        </div>

        {/* Stay date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stay Month</label>
            <select
              value={form.stay_month}
              onChange={e => set('stay_month', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stay Year</label>
            <select
              value={form.stay_year}
              onChange={e => set('stay_year', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Ratings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Ratings</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Overall Rating', key: 'rating' },
              { label: 'Cleanliness', key: 'cleanliness' },
              { label: 'Location', key: 'location' },
              { label: 'Value', key: 'value' },
            ].map(r => (
              <div key={r.key}>
                <label className="block text-xs text-gray-500 mb-1">{r.label}</label>
                <select
                  value={form[r.key]}
                  onChange={e => set(r.key, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {['5', '4.9', '4.8', '4.7', '4.5', '4.0', '3.5', '3.0'].map(v => (
                    <option key={v} value={v}>{'★'.repeat(Math.round(parseFloat(v)))} {v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Text *</label>
          <textarea
            rows={5}
            value={form.review_text}
            onChange={e => set('review_text', e.target.value)}
            placeholder="Write a natural, authentic-sounding review from the guest's perspective..."
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.review_text.length} characters — aim for 80–200 for realism</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-stay-500 text-white rounded-xl font-semibold hover:bg-stay-600 disabled:opacity-50 transition-colors">
          {saving ? 'Creating...' : 'Create Review'}
        </button>
      </div>
    </div>
  )
}