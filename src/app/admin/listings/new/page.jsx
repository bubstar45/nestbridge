'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createListing, saveListingImages } from '@/lib/api'
import ImageUploader from '@/components/ImageUploader'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewListing() {
  const router = useRouter()
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    price: '',
    price_per_night: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    available_from: '',
    type: 'apartment',
    listing_mode: 'rental',
    amenities: '',
    is_active: true,
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let listingId = createdId

      if (!listingId) {
        // No draft saved yet — create listing now
        const { data: listing } = await createListing({
          title: form.title,
          description: form.description,
          city: form.city,
          state: form.state,
          zip: form.zip,
          address: form.address,
          price: form.price ? Number(form.price) : null,
          price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          sqft: form.sqft ? Number(form.sqft) : null,
          type: form.type,
          listing_mode: form.listing_mode,
          available_from: form.available_from || null,
          amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
          is_active: form.is_active,
        })
        listingId = listing.id
        setCreatedId(listingId)
      } else {
        // Draft already exists — just update it with full details + mark active
        const { updateListing } = await import('@/lib/api')
        await updateListing(listingId, {
          title: form.title,
          description: form.description,
          city: form.city,
          state: form.state,
          zip: form.zip,
          address: form.address,
          price: form.price ? Number(form.price) : null,
          price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          sqft: form.sqft ? Number(form.sqft) : null,
          type: form.type,
          listing_mode: form.listing_mode,
          available_from: form.available_from || null,
          amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
          is_active: form.is_active,
        })
      }

      if (images.length > 0) {
        await saveListingImages(listingId, images)
      }

      toast.success('Listing created!')
      router.push('/admin')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create listing.')
    } finally {
      setSaving(false)
    }
  }

  // Save a minimal draft so ImageUploader can upload files to a real storage path
  const handleSaveDraft = async () => {
    if (createdId || !form.title) return
    try {
      const { data: listing } = await createListing({
        title: form.title,
        listing_mode: form.listing_mode,
        type: form.type,
        is_active: false,
      })
      setCreatedId(listing.id)
      toast.success('Draft saved — you can now upload photos')
    } catch {
      toast.error('Could not save draft')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-500">
          ← Back to admin
        </Link>
        <h1 className="text-2xl font-bold">Add New Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 space-y-5">

        {/* Listing Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
          <select
            value={form.listing_mode}
            onChange={e => set('listing_mode', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="rental">Long-term Rental</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Address */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              required
              value={form.city}
              onChange={e => set('city', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              value={form.state}
              onChange={e => set('state', e.target.value)}
              placeholder="TX"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input
              value={form.zip}
              onChange={e => set('zip', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Price {form.listing_mode === 'rental' ? '*' : '(leave blank for short stays)'}
            </label>
            <input
              type="number"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="2500"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nightly Price {form.listing_mode === 'short_stay' ? '*' : '(leave blank for rentals)'}
            </label>
            <input
              type="number"
              value={form.price_per_night}
              onChange={e => set('price_per_night', e.target.value)}
              placeholder="150"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input
              type="number"
              value={form.bedrooms}
              onChange={e => set('bedrooms', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={e => set('bathrooms', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sqft</label>
            <input
              type="number"
              value={form.sqft}
              onChange={e => set('sqft', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Property Type + Available From */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {['apartment', 'house', 'condo', 'studio', 'townhouse'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
            <input
              type="date"
              value={form.available_from}
              onChange={e => set('available_from', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
          <input
            value={form.amenities}
            onChange={e => set('amenities', e.target.value)}
            placeholder="WiFi, Parking, Pool, Gym (comma separated)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Photos — URL input always visible; file upload needs a draft ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
          {!createdId ? (
            <div className="space-y-3">
              {/*
                Show the full ImageUploader but it will only allow URL-based images
                until a draft is saved. We pass listingId=null so file uploads are
                blocked inside ImageUploader, and show an inline prompt to save draft
                to unlock file uploads.
              */}
              <ImageUploader
                listingId={null}
                existingImages={images}
                onChange={setImages}
              />
              {/* Prompt to unlock file uploads */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <span className="text-sm text-gray-500 flex-1">
                  💾 Save a draft to unlock file uploads from your device.
                </span>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!form.title}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  Save Draft
                </button>
              </div>
            </div>
          ) : (
            <ImageUploader
              listingId={createdId}
              existingImages={images}
              onChange={setImages}
            />
          )}
        </div>

        {/* Active toggle — matches edit page */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 accent-brand-500"
          />
          <label htmlFor="active" className="text-sm text-gray-700">
            Listing is active and visible
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : createdId ? 'Publish Listing' : 'Create Listing'}
          </button>
          <Link
            href="/admin"
            className="px-6 py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}