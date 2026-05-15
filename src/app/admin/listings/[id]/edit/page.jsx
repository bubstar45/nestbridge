'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getListing, updateListing, getListingImages, saveListingImages } from '@/lib/api'  // ← added getListingImages, saveListingImages
import toast from 'react-hot-toast'
import Link from 'next/link'
import ImageUploader from '@/components/ImageUploader'  // ← added

export default function EditListing() {
  const { id } = useParams()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])  // ← added
  const [form, setForm] = useState({
    title: '', description: '', city: '', state: '', zip: '',
    address: '', price: '', price_per_night: '', bedrooms: '',
    bathrooms: '', sqft: '', type: 'apartment', listing_mode: 'rental',
    available_from: '', is_active: true, amenities: '',
  })

  useEffect(() => {
    getListing(id).then(r => {
      const l = r.data
      setForm({
        title: l.title ?? '',
        description: l.description ?? '',
        city: l.city ?? '',
        state: l.state ?? '',
        zip: l.zip ?? '',
        address: l.address ?? '',
        price: l.price ?? '',
        price_per_night: l.price_per_night ?? '',
        bedrooms: l.bedrooms ?? '',
        bathrooms: l.bathrooms ?? '',
        sqft: l.sqft ?? '',
        type: l.type ?? 'apartment',
        listing_mode: l.listing_mode ?? 'rental',
        available_from: l.available_from ?? '',
        is_active: l.is_active ?? true,
        amenities: (l.amenities ?? []).join(', '),
      })
      setLoading(false)
    })

    // ← added: load existing images
    getListingImages(id).then(r => setImages(r.data))
  }, [id])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateListing(id, {
        title: form.title,
        description: form.description,
        city: form.city,
        state: form.state,
        zip: form.zip,
        address: form.address,
        price: form.price ? Number(form.price) : null,
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sqft: Number(form.sqft),
        type: form.type,
        listing_mode: form.listing_mode,
        available_from: form.available_from || null,
        is_active: form.is_active,
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      })
      await saveListingImages(id, images)  // ← added
      toast.success('Listing updated!')
      router.push('/admin')
    } catch {
      toast.error('Failed to update listing.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-500">← Back to admin</Link>
        <h1 className="text-2xl font-bold">Edit Listing</h1>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
          <select value={form.listing_mode} onChange={e => set('listing_mode', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="rental">Long-term Rental</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
        </div>

        {/* Address */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input value={form.state} onChange={e => set('state', e.target.value)}
              placeholder="TX" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input value={form.zip} onChange={e => set('zip', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Price {form.listing_mode === 'rental' ? '*' : '(leave blank for short stays)'}
            </label>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="2500" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nightly Price {form.listing_mode === 'short_stay' ? '*' : '(leave blank for rentals)'}
            </label>
            <input type="number" value={form.price_per_night} onChange={e => set('price_per_night', e.target.value)}
              placeholder="150" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sqft</label>
            <input type="number" value={form.sqft} onChange={e => set('sqft', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {['apartment','house','condo','studio','townhouse'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
            <input type="date" value={form.available_from} onChange={e => set('available_from', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
          <input value={form.amenities} onChange={e => set('amenities', e.target.value)}
            placeholder="WiFi, Parking, Pool, Gym (comma separated)"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* ← PHOTOS — added right after amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
          <ImageUploader
            listingId={id}
            existingImages={images}
            onChange={setImages}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="active" checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 accent-brand-500" />
          <label htmlFor="active" className="text-sm text-gray-700">Listing is active and visible</label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin"
            className="px-6 py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}