'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import {
  getAdminStats, getAdminApplications,
  getAdminListings, updateApplication, deleteListing
} from '@/lib/api'
import supabase from '@/lib/api'

// ── Delete Modal ──────────────────────────────────────────
function DeleteModal({ listing, onConfirm, onCancel }) {
  if (!listing) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">🗑</div>
        <h2 className="text-lg font-bold text-center text-gray-900 mb-1">Delete Listing</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to delete <span className="font-semibold">"{listing.title}"</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Application Detail Modal ──────────────────────────────
function ApplicationDetail({ app, onClose, onDecide }) {
  if (!app) return null
  const listing = app.listings
  const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-700' }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
          <div><h2 className="font-bold text-gray-900 text-base sm:text-lg">Application Review</h2><p className="text-[10px] sm:text-xs text-gray-400">Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—'}</p></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium ${STATUS_COLOR[app.status] ?? 'bg-gray-100 text-gray-600'}`}>{app.status ?? 'pending'}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {listing && (
            <div className="bg-brand-50 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl">🏠</div>
              <div><p className="font-semibold text-gray-900 text-sm sm:text-base">{listing.title}</p><p className="text-xs sm:text-sm text-gray-500">{listing.city}, {listing.state} · ${listing.price?.toLocaleString()}/mo</p></div>
            </div>
          )}
          <Section title="Personal Information" items={[{ label: 'Full Name', value: app.full_name }, { label: 'Email', value: app.email }, { label: 'Phone', value: app.phone }, { label: 'Date of Birth', value: app.dob }, { label: 'Current Address', value: app.current_address }]} />
          <Section title="Employment & Income" items={[{ label: 'Status', value: app.employment_status?.replace('_', ' ') }, { label: 'Employer', value: app.employer }, { label: 'Monthly Income', value: app.monthly_income ? `$${Number(app.monthly_income).toLocaleString()}` : null }, { label: 'Years Employed', value: app.years_employed }]} />
          <Section title="Rental History" items={[{ label: 'Current Landlord', value: app.landlord_name }, { label: 'Landlord Phone', value: app.landlord_phone }, { label: 'Reason for Moving', value: app.reason_for_moving }, { label: 'Move-in Date', value: app.move_in_date }, { label: 'Intended Stay', value: app.intended_stay }]} />
          <Section title="Additional Info" items={[{ label: 'Occupants', value: app.num_occupants }, { label: 'Pets', value: app.has_pets ? `Yes — ${app.pet_details}` : 'No' }, { label: 'Prior Eviction', value: app.prior_eviction ? '⚠ Yes' : '✓ No' }, { label: 'Criminal History', value: app.criminal_history ? '⚠ Yes' : '✓ No' }, { label: 'Notes', value: app.additional_notes }]} />
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4"><p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-2 sm:mb-3">Payment</p><div className="flex justify-between text-xs sm:text-sm"><span className="text-gray-500">Application Fee</span><span className="font-bold text-gray-900">$50</span></div><div className="flex justify-between text-xs sm:text-sm mt-1"><span className="text-gray-500">Payment Status</span><span className="text-green-600 font-medium">✓ Paid</span></div></div>
          {app.status === 'pending' && (<div className="flex gap-3"><button onClick={() => { onDecide(app.id, 'approved'); onClose() }} className="flex-1 py-2 sm:py-3 bg-green-500 text-white rounded-xl font-semibold text-sm">✓ Approve</button><button onClick={() => { onDecide(app.id, 'denied'); onClose() }} className="flex-1 py-2 sm:py-3 bg-red-100 text-red-600 rounded-xl font-semibold text-sm">✕ Deny</button></div>)}
          {app.status === 'approved' && (<div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center text-green-700 text-xs sm:text-sm font-medium">✓ This application has been approved</div>)}
          {app.status === 'denied' && (<div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center text-red-600 text-xs sm:text-sm font-medium">✕ This application has been denied</div>)}
        </div>
      </div>
    </div>
  )
}

function Section({ title, items }) {
  const filtered = items.filter(i => i.value !== null && i.value !== undefined && i.value !== '')
  if (filtered.length === 0) return null
  return (
    <div>
      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">{title}</p>
      <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
        {filtered.map(item => (<div key={item.label} className="flex justify-between text-xs sm:text-sm"><span className="text-gray-500">{item.label}</span><span className="font-medium text-gray-800 capitalize">{item.value}</span></div>))}
      </div>
    </div>
  )
}

// ── Booking Detail Modal ──────────────────────────────────
function BookingDetail({ booking, onClose }) {
  if (!booking) return null
  const listing = booking.listings
  const totalAmount = booking.total_price || booking.total
  const statusClass = booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
          <div><h2 className="font-bold text-gray-900 text-base sm:text-lg">Booking Details</h2><p className="text-[10px] sm:text-xs text-gray-400">Ref: {booking.id?.slice(0, 8).toUpperCase()}</p></div>
          <div className="flex items-center gap-2 sm:gap-3"><span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium ${statusClass}`}>{booking.status || 'pending'}</span><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {listing && (<div className="bg-orange-50 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl">🌴</div><div><p className="font-semibold text-gray-900 text-sm sm:text-base">{listing.title}</p><p className="text-xs sm:text-sm text-gray-500">{listing.city}, {listing.state}</p></div></div>)}
          <div className="grid grid-cols-2 gap-3 sm:gap-4"><div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center"><p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">CHECK-IN</p><p className="font-bold text-gray-800 text-sm sm:text-lg">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div><div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center"><p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">CHECK-OUT</p><p className="font-bold text-gray-800 text-sm sm:text-lg">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div></div>
          <div className="space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4"><p className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1.5 sm:mb-2">Guest Information</p>{[{ label: 'Guest Name', value: booking.full_name }, { label: 'Email', value: booking.email }, { label: 'Guests', value: `${booking.guests} guest${booking.guests > 1 ? 's' : ''}` }, { label: 'Nights', value: `${booking.nights} night${booking.nights > 1 ? 's' : ''}` }].filter(i => i.value).map(item => (<div key={item.label} className="flex justify-between text-xs sm:text-sm py-0.5 sm:py-1"><span className="text-gray-500">{item.label}</span><span className="font-medium text-gray-800">{item.value}</span></div>))}</div>
          <div className="bg-gradient-to-r from-stay-50 to-orange-50 rounded-xl p-3 sm:p-4"><div className="flex justify-between items-center"><span className="text-gray-500 text-xs sm:text-sm">Total Paid</span><span className="text-lg sm:text-xl font-bold text-stay-600">${totalAmount?.toLocaleString()}</span></div><div className="flex justify-between text-[10px] sm:text-xs text-gray-500 pt-2 mt-2 border-t border-stay-200"><span>Status</span><span className="text-emerald-600 font-medium">✓ Confirmed</span></div></div>
          {booking.status === 'cancelled' && (<div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center text-red-600 text-xs sm:text-sm">🗑 This booking has been cancelled. Refund will be processed within 5-10 business days.</div>)}
        </div>
      </div>
    </div>
  )
}

// ── Mobile Card Components ─────────────────────────────────
function ApplicationCard({ app, onClick }) {
  const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-700' }
  return (
    <div onClick={() => onClick(app)} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div><p className="font-semibold text-gray-900">{app.full_name || '—'}</p><p className="text-xs text-gray-400">{app.email || '—'}</p></div>
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${STATUS_COLOR[app.status] || 'bg-gray-100 text-gray-600'}`}>{app.status || 'pending'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2"><span className="text-gray-500">Listing:</span><span className="text-gray-700 truncate">{app.listings?.title || '—'}</span><span className="text-gray-500">Date:</span><span className="text-gray-700">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—'}</span><span className="text-gray-500">Income:</span><span className="text-gray-700">{app.monthly_income ? `$${Number(app.monthly_income).toLocaleString()}/mo` : '—'}</span></div>
      {app.status === 'pending' && (<div className="flex gap-2 mt-2"><button onClick={(e) => { e.stopPropagation(); decide(app.id, 'approved') }} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium">Approve</button><button onClick={(e) => { e.stopPropagation(); decide(app.id, 'denied') }} className="flex-1 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium">Deny</button></div>)}
    </div>
  )
}

function ListingCard({ listing, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <div className="flex justify-between items-start mb-2"><p className="font-semibold text-gray-900 text-sm">{listing.title}</p><span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${listing.listing_mode === 'rental' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-700'}`}>{listing.listing_mode === 'rental' ? 'Rental' : 'Short Stay'}</span></div>
      <div className="grid grid-cols-2 gap-1 text-xs mb-3"><span className="text-gray-500">Location:</span><span className="text-gray-700">{listing.city}, {listing.state}</span><span className="text-gray-500">Price:</span><span className="text-gray-700">{listing.price ? `$${listing.price.toLocaleString()}/mo` : `$${listing.price_per_night}/night`}</span><span className="text-gray-500">Type:</span><span className="text-gray-700 capitalize">{listing.type}</span></div>
      <div className="flex gap-2"><button onClick={() => onEdit(listing.id)} className="flex-1 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button><button onClick={() => onDelete(listing)} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">Delete</button></div>
    </div>
  )
}

function BookingCard({ booking, onClick }) {
  const totalAmount = booking.total_price || booking.total
  const statusClass = booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
  return (
    <div onClick={() => onClick(booking)} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50">
      <div className="flex justify-between items-start mb-2"><div><p className="font-semibold text-gray-900 text-sm">{booking.full_name || '—'}</p><p className="text-xs text-gray-400">{booking.email || '—'}</p></div><span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${statusClass}`}>{booking.status || 'pending'}</span></div>
      <div className="grid grid-cols-2 gap-1 text-xs mb-2"><span className="text-gray-500">Property:</span><span className="text-gray-700 truncate">{booking.listings?.title || '—'}</span><span className="text-gray-500">Dates:</span><span className="text-gray-700 text-[10px]">{booking.check_in ? new Date(booking.check_in).toLocaleDateString() : '—'} → {booking.check_out ? new Date(booking.check_out).toLocaleDateString() : '—'}</span><span className="text-gray-500">Guests:</span><span className="text-gray-700">{booking.guests}</span><span className="text-gray-500">Total:</span><span className="text-gray-700">${totalAmount?.toLocaleString()}</span></div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function AdminPage() {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <div className="p-10 text-center">Loading...</div>
  if (!user) return <div className="p-10 text-center">Please sign in.</div>
  if (user?.publicMetadata?.role !== 'admin') return <div className="p-10 text-center">Access denied.</div>

  const [tab, setTab] = useState('applications')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  const { data: stats } = useSWR('admin-stats', () => getAdminStats().then(r => r.data))
  const { data: apps = [], mutate: mutateApps } = useSWR('admin-apps', () => getAdminApplications().then(r => r.data))
  const { data: listings = [], mutate: mutateListings } = useSWR('admin-listings', () => getAdminListings().then(r => r.data))
  const { data: bookings = [], mutate: mutateBookings } = useSWR('admin-bookings', () => supabase.from('bookings').select('*, listings(*)').order('booked_at', { ascending: false }).then(r => r.data))

  const decide = async (id, status) => {
    const app = apps.find(a => a.id === id);
    await updateApplication(id, { status });
    if (app?.email) {
      try {
        const res = await fetch('/api/send-application-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: app.email, fullName: app.full_name, listingTitle: app.listings?.title, status, adminNote: '' }) });
        const result = await res.json();
        toast.success(result.success ? `Application ${status} & email sent` : `Application ${status} (email failed)`);
      } catch (err) { toast.success(`Application ${status} (email failed)`); }
    } else { toast.success(`Application ${status}`); }
    mutateApps();
  };

  const confirmDelete = async () => {
    try { await deleteListing(deleteTarget.id); mutateListings(); toast.success('Listing removed'); } catch { toast.error('Failed to delete listing'); } finally { setDeleteTarget(null); }
  }

  const KPI = [
    { label: 'Total Listings', value: stats?.listings ?? '—' },
    { label: 'Applications', value: stats?.applications ?? '—' },
    { label: 'Bookings', value: bookings?.length ?? '—' },
    { label: 'Pending Review', value: apps.filter(a => a.status === 'pending').length },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <DeleteModal listing={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <ApplicationDetail app={selectedApp} onClose={() => setSelectedApp(null)} onDecide={decide} />
      <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Admin Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {KPI.map(k => (<div key={k.label} className="bg-gray-50 rounded-xl p-3 sm:p-5"><p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">{k.label}</p><p className="text-xl sm:text-2xl font-bold">{k.value}</p></div>))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 sm:gap-4 mb-6 border-b">
        {['applications', 'listings', 'bookings'].map(t => (<button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400'}`}>{t}</button>))}
      </div>

      {/* Applications Tab - Cards on mobile, Table on desktop */}
      {tab === 'applications' && (
        <div>
          <div className="block lg:hidden">
            {apps.length === 0 ? (<div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">📋</p><p>No applications yet.</p></div>) : (apps.map(a => <ApplicationCard key={a.id} app={a} onClick={setSelectedApp} />))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 border-b">{['Applicant', 'Listing', 'Date', 'Income', 'Status', 'Actions'].map(h => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
              <tbody>{apps.map(a => (<tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApp(a)}><td className="py-3 pr-4"><p className="font-medium text-gray-900">{a.full_name ?? '—'}</p><p className="text-xs text-gray-400">{a.email ?? '—'}</p></td><td className="py-3 pr-4">{a.listings?.title ?? '—'}</td><td className="py-3 pr-4 text-gray-400">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}</td><td className="py-3 pr-4">{a.monthly_income ? `$${Number(a.monthly_income).toLocaleString()}/mo` : '—'}</td><td className="py-3 pr-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-600'}`}>{a.status ?? 'pending'}</span></td><td className="py-3 pr-4" onClick={e => e.stopPropagation()}>{a.status === 'pending' && (<div className="flex gap-2"><button onClick={() => decide(a.id, 'approved')} className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg">Approve</button><button onClick={() => decide(a.id, 'denied')} className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg">Deny</button></div>)}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {tab === 'listings' && (
        <div>
          <div className="flex justify-end gap-3 mb-4">
            <a href="/admin/reviews" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-stay-500 text-white rounded-lg text-xs sm:text-sm">+ Add Review</a>
            <a href="/admin/listings/new" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-500 text-white rounded-lg text-xs sm:text-sm">+ Add Listing</a>
          </div>
          <div className="block lg:hidden">
            {listings.length === 0 ? (<div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">📦</p><p>No listings yet.</p></div>) : (listings.map(l => <ListingCard key={l.id} listing={l} onEdit={(id) => window.location.href = `/admin/listings/${id}/edit`} onDelete={setDeleteTarget} />))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-gray-400 border-b">{['Title', 'Location', 'Price', 'Type', 'Mode', 'Actions'].map(h => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
            <tbody>{listings.map(l => (<tr key={l.id} className="border-b hover:bg-gray-50"><td className="py-3 pr-4 font-medium">{l.title}</td><td className="py-3 pr-4 text-gray-400">{l.city}, {l.state}</td><td className="py-3 pr-4">{l.price ? `$${l.price.toLocaleString()}/mo` : `$${l.price_per_night}/night`}</td><td className="py-3 pr-4 capitalize">{l.type}</td><td className="py-3 pr-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${l.listing_mode === 'rental' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-700'}`}>{l.listing_mode === 'rental' ? 'Rental' : 'Short Stay'}</span></td><td className="py-3 flex gap-2"><a href={`/admin/listings/${l.id}/edit`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Edit</a><button onClick={() => setDeleteTarget(l)} className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg">Delete</button></td></tr>))}</tbody></table>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <div>
          <div className="block lg:hidden">
            {bookings.length === 0 ? (<div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">🌴</p><p>No bookings yet.</p></div>) : (bookings.map(b => <BookingCard key={b.id} booking={b} onClick={setSelectedBooking} />))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="text-left text-gray-400 border-b">{['Guest', 'Property', 'Dates', 'Guests', 'Total', 'Status'].map(h => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
            <tbody>{bookings.map(b => { const totalAmount = b.total_price || b.total; const statusClass = b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'; return (<tr key={b.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}><td className="py-3 pr-4"><p className="font-medium text-gray-900">{b.full_name || '—'}</p><p className="text-xs text-gray-400">{b.email || '—'}</p></td><td className="py-3 pr-4">{b.listings?.title || '—'}</td><td className="py-3 pr-4 text-[10px]">{b.check_in ? new Date(b.check_in).toLocaleDateString() : '—'} →<br/>{b.check_out ? new Date(b.check_out).toLocaleDateString() : '—'}</td><td className="py-3 pr-4">{b.guests}</td><td className="py-3 pr-4">${totalAmount?.toLocaleString()}</td><td className="py-3 pr-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${statusClass}`}>{b.status || 'pending'}</span></td></tr>)})}</tbody></table>
          </div>
        </div>
      )}
    </div>
  )
}