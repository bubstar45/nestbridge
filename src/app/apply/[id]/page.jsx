'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { getListing, createApplication } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Personal', 'Employment', 'Rental History', 'Additional', 'Review & Pay']

export default function ApplyPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const { data: listing } = useSWR(`listing-${id}`, () => getListing(id).then(r => r.data))

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    current_address: '',
    employment_status: 'employed',
    employer: '',
    monthly_income: '',
    years_employed: '',
    landlord_name: '',
    landlord_phone: '',
    reason_for_moving: '',
    move_in_date: '',
    intended_stay: '12 months',
    num_occupants: 1,
    has_pets: false,
    pet_details: '',
    prior_eviction: false,
    criminal_history: false,
    additional_notes: '',
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name || !form.email || !form.phone || !form.dob || !form.current_address) {
        toast.error('Please fill all required fields.')
        return false
      }
    }
    if (step === 1) {
      if (!form.employment_status || !form.monthly_income) {
        toast.error('Please fill all required fields.')
        return false
      }
    }
    if (step === 2) {
      if (!form.move_in_date) {
        toast.error('Please select a move-in date.')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Don't save to DB yet — pass form data to Stripe metadata
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: id,
          listing_title: listing?.title ?? 'Rental',
          form_data: JSON.stringify(form), // store form in Stripe metadata
        }),
      })

      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url

    } catch (e) {
      console.error(e)
      toast.error('Failed to process. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSignedIn) return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-2xl mb-4">🔒</p>
      <p className="font-semibold text-gray-900 mb-2">Sign in to apply</p>
      <p className="text-gray-500 text-sm mb-6">You need an account to submit a rental application.</p>
      <Link href="/sign-in" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold inline-block">Sign In</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/rentals/${id}`} className="text-xs sm:text-sm text-gray-500 hover:text-brand-500 mb-3 sm:mb-4 inline-block">
            ← Back to listing
          </Link>
          {listing && (
            <div className="bg-white border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl">🏠</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{listing.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{listing.city}, {listing.state} · ${listing.price?.toLocaleString()}/mo</p>
              </div>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rental Application</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6 sm:mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white border rounded-2xl p-4 sm:p-6 mb-6">

          {/* STEP 1 — Personal Info */}
          {step === 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-base sm:text-lg">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="john@email.com"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Address *</label>
                <input value={form.current_address} onChange={e => set('current_address', e.target.value)}
                  placeholder="123 Main St, Austin, TX 78701"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          )}

          {/* STEP 2 — Employment */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-base sm:text-lg">Employment & Income</h2>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                <select value={form.employment_status} onChange={e => set('employment_status', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="employed">Employed (Full-time)</option>
                  <option value="part_time">Employed (Part-time)</option>
                  <option value="self_employed">Self-employed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employer / Company</label>
                  <input value={form.employer} onChange={e => set('employer', e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Years at Job</label>
                  <select value={form.years_employed} onChange={e => set('years_employed', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select...</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Monthly Income (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                  <input type="number" value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)}
                    placeholder="5000"
                    className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                {listing?.price && form.monthly_income && (
                  <p className={`text-xs mt-1 ${Number(form.monthly_income) >= listing.price * 3 ? 'text-green-500' : 'text-amber-500'}`}>
                    {Number(form.monthly_income) >= listing.price * 3
                      ? '✓ Income meets the 3x rent requirement'
                      : `⚠ Recommended: $${(listing.price * 3).toLocaleString()}/mo (3x rent)`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Rental History */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-base sm:text-lg">Rental History</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Landlord Name</label>
                  <input value={form.landlord_name} onChange={e => set('landlord_name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Landlord Phone</label>
                  <input value={form.landlord_phone} onChange={e => set('landlord_phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reason for Moving</label>
                <textarea rows={3} value={form.reason_for_moving} onChange={e => set('reason_for_moving', e.target.value)}
                  placeholder="e.g. Looking for a bigger space, relocating for work..."
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Desired Move-in Date *</label>
                  <input type="date" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Intended Stay Length</label>
                  <select value={form.intended_stay} onChange={e => set('intended_stay', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                    <option value="18 months">18 months</option>
                    <option value="24+ months">24+ months</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Additional Info */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <h2 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-base sm:text-lg">Additional Information</h2>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Number of Occupants</label>
                <select value={form.num_occupants} onChange={e => set('num_occupants', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Do you have pets?</label>
                <div className="flex gap-4">
                  <button onClick={() => set('has_pets', true)} type="button"
                    className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${form.has_pets ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600'}`}>
                    Yes
                  </button>
                  <button onClick={() => set('has_pets', false)} type="button"
                    className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${!form.has_pets ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600'}`}>
                    No
                  </button>
                </div>
                {form.has_pets && (
                  <input value={form.pet_details} onChange={e => set('pet_details', e.target.value)}
                    placeholder="e.g. 1 small dog, golden retriever"
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Background Disclosures</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Prior eviction?</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">Have you ever been evicted?</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => set('prior_eviction', true)} type="button"
                      className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.prior_eviction ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-600'}`}>
                      Yes
                    </button>
                    <button onClick={() => set('prior_eviction', false)} type="button"
                      className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-colors ${!form.prior_eviction ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600'}`}>
                      No
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Criminal history?</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">Felony convictions in past 7 years?</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => set('criminal_history', true)} type="button"
                      className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.criminal_history ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-600'}`}>
                      Yes
                    </button>
                    <button onClick={() => set('criminal_history', false)} type="button"
                      className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-colors ${!form.criminal_history ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600'}`}>
                      No
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea rows={3} value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)}
                  placeholder="Anything else you'd like the landlord to know..."
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          )}

          {/* STEP 5 — Review & Pay */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-5">
              <h2 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-base sm:text-lg">Review & Submit</h2>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { label: 'Name', value: form.full_name },
                  { label: 'Email', value: form.email },
                  { label: 'Phone', value: form.phone },
                  { label: 'Employment', value: form.employment_status.replace('_', ' ') },
                  { label: 'Monthly Income', value: form.monthly_income ? `$${Number(form.monthly_income).toLocaleString()}` : '—' },
                  { label: 'Move-in Date', value: form.move_in_date },
                  { label: 'Intended Stay', value: form.intended_stay },
                  { label: 'Occupants', value: form.num_occupants },
                  { label: 'Pets', value: form.has_pets ? `Yes — ${form.pet_details}` : 'No' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs sm:text-sm border-b pb-2">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-900 capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">Application Fee</span>
                  <span className="text-xl sm:text-2xl font-bold text-brand-500">$50</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                  This fee covers your credit and background check. Fully refundable if not approved within 7 days.
                </p>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                By submitting this application, you confirm that all information provided is accurate and complete.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={handleNext}
              className="flex-1 py-2.5 sm:py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 sm:py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}