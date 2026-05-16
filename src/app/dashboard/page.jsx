'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import useSWR from 'swr'
import { getMyApplications, getMyBookings } from '@/lib/api'
import supabase from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  denied:    'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_STEPS = ['Submitted', 'Under Review', 'Decision']

function StatusTimeline({ status }) {
  const step = status === 'pending' ? 1 : status === 'approved' || status === 'denied' ? 2 : 0
  return (
    <div className="flex items-center gap-1 sm:gap-2 mt-3">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 sm:gap-2 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${
              i <= step ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] sm:text-xs whitespace-nowrap ${i <= step ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-brand-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ApplicationCard({ app, onClick }) {
  const statusColor = STATUS_COLOR[app.status] || STATUS_COLOR.pending
  
  return (
    <div onClick={() => onClick(app)}
      className="group border border-gray-200 rounded-xl p-4 sm:p-5 mb-3 bg-white hover:border-brand-300 hover:shadow-lg transition-all duration-200 cursor-pointer active:bg-gray-50">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base sm:text-lg">🏠</span>
            <p className="font-semibold text-gray-900 text-sm sm:text-base group-hover:text-brand-600 transition-colors truncate">
              {app.listings?.title ?? 'Rental Application'}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {app.listings?.city && `${app.listings.city}, ${app.listings.state}`}
            <span className="text-gray-300 mx-1 sm:mx-2">•</span>
            Applied {app.submitted_at
              ? new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'recently'}
          </p>
        </div>
        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium border shrink-0 ${statusColor}`}>
          {app.status ?? 'pending'}
        </span>
      </div>
      <StatusTimeline status={app.status} />
      <p className="text-[10px] sm:text-xs text-gray-400 mt-3 flex items-center gap-1 group-hover:text-brand-500 transition-colors">
        Click to view full application details
        <span className="text-brand-400 group-hover:translate-x-1 transition-transform">→</span>
      </p>
    </div>
  )
}

function ApplicationDetail({ app, onClose }) {
  if (!app) return null
  const listing = app.listings
  const statusColor = STATUS_COLOR[app.status] || STATUS_COLOR.pending
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900 text-base sm:text-lg">Application Details</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'recently'}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium border ${statusColor}`}>
              {app.status ?? 'pending'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl">✕</button>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {listing && (
            <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-brand-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">🏠</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{listing.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{listing.city}, {listing.state} · ${listing.price?.toLocaleString()}/mo</p>
              </div>
            </div>
          )}
          <StatusTimeline status={app.status} />
          {app.status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-emerald-700 flex items-start gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">🎉</span>
              <div><p className="font-semibold text-sm sm:text-base mb-0.5">Congratulations!</p><p className="text-xs sm:text-sm">Your application has been approved. We'll contact you shortly.</p></div>
            </div>
          )}
          {app.status === 'denied' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-rose-700 flex items-start gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">📋</span>
              <div><p className="font-semibold text-sm sm:text-base mb-0.5">Not Approved</p><p className="text-xs sm:text-sm">You may apply for other listings.</p></div>
            </div>
          )}
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Personal Info</h3>
              <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
                {[
                  { label: 'Name', value: app.full_name, icon: '👤' },
                  { label: 'Email', value: app.email, icon: '📧' },
                  { label: 'Phone', value: app.phone, icon: '📞' },
                  { label: 'DOB', value: app.dob, icon: '🎂' },
                  { label: 'Address', value: app.current_address, icon: '📍' },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm py-0.5 sm:py-1">
                    <span className="text-gray-500 flex items-center gap-1.5 sm:gap-2"><span className="text-sm sm:text-base">{item.icon}</span> {item.label}</span>
                    <span className="font-medium text-gray-800 text-right break-words max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Employment</h3>
              <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
                {[
                  { label: 'Status', value: app.employment_status?.replace('_', ' '), icon: '💼' },
                  { label: 'Employer', value: app.employer, icon: '🏢' },
                  { label: 'Income', value: app.monthly_income ? `$${Number(app.monthly_income).toLocaleString()}` : null, icon: '💰' },
                  { label: 'Years', value: app.years_employed, icon: '📅' },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm py-0.5 sm:py-1">
                    <span className="text-gray-500 flex items-center gap-1.5 sm:gap-2"><span className="text-sm sm:text-base">{item.icon}</span> {item.label}</span>
                    <span className="font-medium text-gray-800 capitalize text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Rental History</h3>
              <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
                {[
                  { label: 'Landlord', value: app.landlord_name, icon: '🏠' },
                  { label: 'Landlord Phone', value: app.landlord_phone, icon: '📞' },
                  { label: 'Reason', value: app.reason_for_moving, icon: '📦' },
                  { label: 'Move-in', value: app.move_in_date, icon: '📅' },
                  { label: 'Stay Length', value: app.intended_stay, icon: '⏱️' },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm py-0.5 sm:py-1">
                    <span className="text-gray-500 flex items-center gap-1.5 sm:gap-2"><span className="text-sm sm:text-base">{item.icon}</span> {item.label}</span>
                    <span className="font-medium text-gray-800 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Additional</h3>
              <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
                {[
                  { label: 'Occupants', value: app.num_occupants, icon: '👥' },
                  { label: 'Pets', value: app.has_pets ? `Yes — ${app.pet_details}` : 'No', icon: '🐾' },
                  { label: 'Eviction', value: app.prior_eviction ? 'Yes' : 'No', icon: '📋' },
                  { label: 'Criminal', value: app.criminal_history ? 'Yes' : 'No', icon: '⚖️' },
                  { label: 'Notes', value: app.additional_notes, icon: '📝' },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm py-0.5 sm:py-1">
                    <span className="text-gray-500 flex items-center gap-1.5 sm:gap-2"><span className="text-sm sm:text-base">{item.icon}</span> {item.label}</span>
                    <span className="font-medium text-gray-800 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-brand-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-brand-100">
              <div className="flex justify-between items-center">
                <div><p className="text-[10px] sm:text-xs text-gray-500">Application Fee</p><p className="text-xl sm:text-2xl font-bold text-brand-600">$50</p></div>
                <div className="text-right"><p className="text-[10px] sm:text-xs text-gray-500">Payment Status</p><p className="text-xs sm:text-sm font-semibold text-emerald-600 flex items-center gap-1"><span>✓</span> Paid</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingDetail({ booking, onClose, onCancel }) {
  if (!booking) return null
  const listing = booking.listings
  const cancelled = booking.status === 'cancelled'
  const totalAmount = booking.total_price || booking.total
  const statusColor = STATUS_COLOR[booking.status] || STATUS_COLOR.confirmed

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900 text-base sm:text-lg">Booking Details</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono mt-0.5">Ref: {booking.id?.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium border ${statusColor}`}>
              {booking.status || 'confirmed'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl">✕</button>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {listing && (
            <div className="bg-gradient-to-br from-stay-50 to-orange-50 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-stay-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-stay-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">🌴</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{listing.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{listing.city}, {listing.state}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">CHECK-IN</p>
              <p className="font-bold text-gray-800 text-base sm:text-lg">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{new Date(booking.check_in).toLocaleDateString('en-US', { year: 'numeric' })}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">CHECK-OUT</p>
              <p className="font-bold text-gray-800 text-base sm:text-lg">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{new Date(booking.check_out).toLocaleDateString('en-US', { year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-xl p-3 sm:p-4">
            <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Guest Info</h3>
            {[
              { label: 'Name', value: booking.full_name, icon: '👤' },
              { label: 'Email', value: booking.email, icon: '📧' },
              { label: 'Guests', value: `${booking.guests} guest${booking.guests > 1 ? 's' : ''}`, icon: '👥' },
              { label: 'Nights', value: `${booking.nights} night${booking.nights > 1 ? 's' : ''}`, icon: '🌙' },
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs sm:text-sm py-0.5 sm:py-1">
                <span className="text-gray-500 flex items-center gap-1.5 sm:gap-2"><span className="text-sm sm:text-base">{item.icon}</span> {item.label}</span>
                <span className="font-medium text-gray-800 text-right">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-stay-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-stay-100">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">Payment</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">Total Paid</span>
              <span className="text-lg sm:text-xl font-bold text-stay-600">${totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 pt-2 border-t border-stay-200 mt-2">
              <span>Status</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1"><span>✓</span> Confirmed</span>
            </div>
          </div>

          {!cancelled && (
            <div className="border border-rose-200 rounded-xl p-3 sm:p-4 bg-rose-50/30">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2"><span className="text-sm">⚠️</span> Cancel</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-3 leading-relaxed">Refund will be processed within 5-10 business days.</p>
              <button onClick={() => onCancel(booking.id)} className="w-full py-2 border border-rose-300 text-rose-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-rose-50">Request Cancellation</button>
            </div>
          )}

          {cancelled && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Booking cancelled</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Refund in 5-10 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  if (isLoaded && !isSignedIn) redirect('/')

const { data: apps = [], mutate: mutateApps } = useSWR('my-apps',
  () => getMyApplications().then(r => r.data),
  { revalidateOnMount: true, revalidateOnFocus: true }
)

  const { data: bookings = [], mutate: mutateBookings } = useSWR(
    user ? ['my-bookings', user.id] : null,
    () => getMyBookings(user.id).then(r => r.data)
  )

  const handleCancelBooking = async (bookingId) => {
    try {
      const booking = bookings.find(b => b.id === bookingId)
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
      if (booking?.email) {
        try {
          await fetch('/api/send-cancellation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: booking.email, fullName: booking.full_name, listingTitle: booking.listings?.title }),
          })
        } catch (emailError) { console.error('Email failed:', emailError) }
      }
      mutateBookings()
      setSelectedBooking(null)
      toast.success('Booking cancelled. Refund in 5-10 days.')
    } catch { toast.error('Failed to cancel.') }
  }

  const pendingApps = apps.filter(a => a.status === 'pending').length
  const approvedApps = apps.filter(a => a.status === 'approved').length
  const totalBookings = bookings.length
  const activeBookings = bookings.filter(b => b.status === 'confirmed').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {selectedApp && <ApplicationDetail app={selectedApp} onClose={() => setSelectedApp(null)} />}
      {selectedBooking && <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} onCancel={handleCancelBooking} />}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">My Dashboard</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Manage your applications and bookings</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xl sm:text-2xl">📄</span><span className="text-[10px] sm:text-xs text-gray-400">Total</span></div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{apps.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Applications</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xl sm:text-2xl">⏳</span><span className="text-[10px] sm:text-xs text-amber-500">Pending</span></div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingApps}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Under Review</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xl sm:text-2xl">✅</span><span className="text-[10px] sm:text-xs text-emerald-500">Approved</span></div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{approvedApps}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Applications</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 sm:mb-2"><span className="text-xl sm:text-2xl">🏖️</span><span className="text-[10px] sm:text-xs text-stay-500">Active</span></div>
          <p className="text-xl sm:text-2xl font-bold text-stay-600">{activeBookings}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Bookings</p>
        </div>
      </div>

      <section className="mb-10 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-2">
          <div><h2 className="text-lg sm:text-xl font-bold text-gray-800">My Applications</h2><p className="text-xs sm:text-sm text-gray-500">Track your rental applications</p></div>
          <span className="text-xs sm:text-sm bg-gray-100 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-gray-600">{apps.length} total</span>
        </div>
        {apps.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white border rounded-2xl">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🏠</div>
            <p className="font-semibold text-gray-800 text-base sm:text-lg mb-1">No applications yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">Start browsing rentals and apply today.</p>
            <Link href="/rentals" className="inline-block px-5 sm:px-6 py-2 sm:py-2.5 bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm">Browse Rentals →</Link>
          </div>
        ) : (
          apps.map(app => <ApplicationCard key={app.id} app={app} onClick={setSelectedApp} />)
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-2">
          <div><h2 className="text-lg sm:text-xl font-bold text-gray-800">My Bookings</h2><p className="text-xs sm:text-sm text-gray-500">View and manage your stays</p></div>
          <span className="text-xs sm:text-sm bg-gray-100 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-gray-600">{totalBookings} total</span>
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white border rounded-2xl">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🌴</div>
            <p className="font-semibold text-gray-800 text-base sm:text-lg mb-1">No bookings yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">Find a short stay for your next trip.</p>
            <Link href="/stays" className="inline-block px-5 sm:px-6 py-2 sm:py-2.5 bg-stay-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-stay-600 transition-colors shadow-sm">Browse Stays →</Link>
          </div>
        ) : (
          bookings.map(b => {
            const totalAmount = b.total_price || b.total
            const statusColor = STATUS_COLOR[b.status] || STATUS_COLOR.confirmed
            return (
              <div key={b.id} onClick={() => setSelectedBooking(b)} className="group border border-gray-200 rounded-xl p-4 sm:p-5 mb-3 bg-white hover:border-stay-300 hover:shadow-lg transition-all duration-200 cursor-pointer active:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><span className="text-base sm:text-lg">🌴</span><p className="font-semibold text-gray-900 text-sm sm:text-base group-hover:text-stay-600 transition-colors truncate">{b.listings?.title ?? 'Short Stay'}</p></div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {b.check_in && b.check_out ? `${new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(b.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Dates TBD'}
                      {b.guests && ` · ${b.guests} guest${b.guests !== 1 ? 's' : ''}`}{b.nights && ` · ${b.nights} nights`}
                    </p>
                    <p className="text-sm sm:text-base font-bold text-stay-600 mt-2">${totalAmount?.toLocaleString()} total</p>
                  </div>
                  <div className="text-right"><span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium border ${statusColor}`}>{b.status || 'confirmed'}</span></div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-3 flex items-center gap-1 group-hover:text-stay-500 transition-colors">Click to view details <span className="text-stay-400 group-hover:translate-x-1 transition-transform">→</span></p>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}