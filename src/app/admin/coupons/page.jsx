'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  getAdminCoupons, createCoupon, updateCoupon, deleteCoupon
} from '@/lib/api'

export default function AdminCoupons() {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <div className="p-10 text-center">Loading...</div>
  if (user?.publicMetadata?.role !== 'admin') return <div className="p-10 text-center">Access denied.</div>

  const { data: coupons = [], mutate } = useSWR('admin-coupons',
    () => getAdminCoupons().then(r => r.data))

  const [form, setForm] = useState({
    code: '', discount_percent: '', max_uses: '',
    expires_at: '', description: '', is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleCreate = async () => {
    if (!form.code || !form.discount_percent) return toast.error('Code and discount % are required.')
    setSaving(true)
    try {
      await createCoupon({
        code: form.code.toUpperCase().trim(),
        discount_percent: Number(form.discount_percent),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
        description: form.description || null,
        is_active: form.is_active,
      })
      toast.success('Coupon created!')
      mutate()
      setForm({ code: '', discount_percent: '', max_uses: '', expires_at: '', description: '', is_active: true })
      setShowForm(false)
    } catch {
      toast.error('Failed to create coupon.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active })
      mutate()
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
    } catch {
      toast.error('Failed to update coupon.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id)
      mutate()
      toast.success('Coupon deleted')
    } catch {
      toast.error('Failed to delete coupon.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-500 mb-1 inline-block">← Back to admin</Link>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm">Create and manage discount codes for short stays.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="px-5 py-2.5 bg-stay-500 text-white rounded-xl font-semibold hover:bg-stay-600 transition-colors text-sm">
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">New Coupon</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-stay-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount % *</label>
              <div className="relative">
                <input type="number" min="1" max="100" value={form.discount_percent}
                  onChange={e => set('discount_percent', e.target.value)}
                  placeholder="20"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stay-500" />
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses <span className="text-gray-400">(blank = unlimited)</span></label>
              <input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                placeholder="e.g. 100"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stay-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date <span className="text-gray-400">(blank = no expiry)</span></label>
              <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stay-500" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(internal note)</span></label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="e.g. Welcome discount for new users"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stay-500" />
          </div>
          <div className="flex items-center gap-3 mb-5">
            <input type="checkbox" id="active" checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 accent-stay-500" />
            <label htmlFor="active" className="text-sm text-gray-700">Active immediately</label>
          </div>

          {form.code && form.discount_percent && (
            <div className="bg-stay-50 border border-stay-100 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-stay-600 mb-1 uppercase tracking-wide">Preview</p>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-stay-700 text-lg">{form.code}</span>
                <span className="text-stay-600 text-sm">— {form.discount_percent}% off</span>
                {form.max_uses && <span className="text-xs text-gray-400">· {form.max_uses} uses max</span>}
                {form.expires_at && <span className="text-xs text-gray-400">· Expires {new Date(form.expires_at).toLocaleDateString()}</span>}
              </div>
            </div>
          )}

          <button onClick={handleCreate} disabled={saving}
            className="w-full py-3 bg-stay-500 text-white rounded-xl font-semibold hover:bg-stay-600 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-2xl">
          <p className="text-4xl mb-3">🎟</p>
          <p className="font-semibold text-gray-900 mb-1">No coupons yet</p>
          <p className="text-gray-400 text-sm">Create your first coupon to start offering discounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date()
            const isExhausted = c.max_uses && c.uses_count >= c.max_uses
            const effectivelyActive = c.is_active && !isExpired && !isExhausted
            return (
              <div key={c.id} className="bg-white border rounded-2xl p-5 flex items-center gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-gray-900 text-lg">{c.code}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      effectivelyActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-semibold text-stay-600">{c.discount_percent}% off</span>
                    <span>·</span>
                    <span>{c.uses_count} / {c.max_uses ?? '∞'} uses</span>
                    {c.expires_at && <><span>·</span><span>Expires {new Date(c.expires_at).toLocaleDateString()}</span></>}
                    {c.description && <><span>·</span><span className="italic">{c.description}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      c.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}