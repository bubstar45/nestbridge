'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { getListings } from '@/lib/api'
import { useListingStore } from '@/lib/store'
import PropertyCard from '@/components/PropertyCard'
import MapView from '@/components/MapView'

const TYPES = ['apartment','house','condo','studio','townhouse']
const BEDS  = ['1','2','3','4+']

// Move all the logic that uses useSearchParams into a separate component
function ListingsContent() {
  const sp = useSearchParams()
  const { filters, setFilter } = useListingStore()
  const [view, setView] = useState('grid') // 'grid' | 'map'

  useEffect(() => {
    if (sp.get('city')) setFilter('city', sp.get('city'))
  }, [sp])

  const { data, isLoading } = useSWR(
    ['listings', filters],
    () => getListings(filters).then(r => r.data)
  )
  const listings = data?.listings ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input placeholder="City or state"
          value={filters.city}
          onChange={e => setFilter('city', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-44" />
        <select value={filters.type}
          onChange={e => setFilter('type', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.beds}
          onChange={e => setFilter('beds', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Any beds</option>
          {BEDS.map(b => <option key={b} value={b}>{b} bed</option>)}
        </select>
        <input placeholder="Max price" type="number"
          value={filters.max_price}
          onChange={e => setFilter('max_price', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-32" />
        <select value={filters.mode}
          onChange={e => setFilter('mode', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm">
          <option value="rental">Long-term</option>
          <option value="short_term">Short-term</option>
        </select>
        <div className="ml-auto flex gap-2">
          {['grid','map'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm border ${view===v?'bg-brand-500 text-white border-brand-500':'hover:bg-gray-50'}`}>
              {v === 'grid' ? 'Grid' : 'Map'}
            </button>
          ))}
        </div>
      </div>

      {view === 'map'
        ? <MapView listings={listings} />
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <p>Loading...</p>
              : listings.map(l => <PropertyCard key={l.id} listing={l} />)
            }
          </div>
      }
    </div>
  )
}

// Main exported component with Suspense boundary
export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  )
}