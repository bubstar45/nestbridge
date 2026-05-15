'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { getListings } from '@/lib/api'
import PropertyCard from '@/components/RentalCard'
import RentalMapView from '@/components/RentalMapView'

const fetcher = (filters) => getListings({ ...filters, mode: 'rental' }).then(r => r.data.listings)

export default function RentalsPage() {
  const [view, setView] = useState('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({ city: '', type: '', minBeds: '', maxPrice: '' })
  const [applied, setApplied] = useState({ mode: 'rental' })

  const { data: allListings = [], isLoading } = useSWR(
    ['rentals', applied],
    () => fetcher(applied)
  )

  const listings = allListings.filter(l => {
    if (filters.minBeds && l.bedrooms < parseInt(filters.minBeds)) return false
    if (filters.maxPrice && l.price > parseInt(filters.maxPrice)) return false
    return true
  })

  const handleSearch = () => {
    setApplied({ mode: 'rental', city: filters.city, type: filters.type })
    setMobileFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilters({ city: '', type: '', minBeds: '', maxPrice: '' })
    setApplied({ mode: 'rental' })
  }

  const hasActiveFilters = filters.city || filters.type || filters.minBeds || filters.maxPrice

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Long-term Rentals</h1>
        <p className="text-gray-500 text-xs sm:text-sm">Monthly leases · Apply online</p>
      </div>

      {/* Mobile filter bar - simplified */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-brand-500 rounded-full" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 px-2 py-1">
              Clear
            </button>
          )}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'grid' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600'
              }`}>
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'map' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600'
              }`}>
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filter Rentals</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {/* City input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City or State</label>
                <input
                  placeholder="e.g., Austin, TX"
                  value={filters.city}
                  onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={filters.type}
                  onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">All types</option>
                  {['apartment','house','condo','studio','townhouse'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              {/* Minimum Beds */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Beds</label>
                <select
                  value={filters.minBeds}
                  onChange={e => setFilters(p => ({ ...p, minBeds: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">Any</option>
                  <option value="1">1+ beds</option>
                  <option value="2">2+ beds</option>
                  <option value="3">3+ beds</option>
                  <option value="4">4+ beds</option>
                </select>
              </div>
              
              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <select
                  value={filters.maxPrice}
                  onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 text-sm">
                  <option value="">Any price</option>
                  <option value="1500">$1,500/mo</option>
                  <option value="2000">$2,000/mo</option>
                  <option value="2500">$2,500/mo</option>
                  <option value="3000">$3,000/mo</option>
                  <option value="4000">$4,000/mo</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={clearFilters} className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600">
                  Clear all
                </button>
                <button onClick={handleSearch} className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop filter bar */}
      <div className="hidden md:flex bg-white border-b px-6 py-4 flex-wrap gap-3 items-center">
        <input
          placeholder="City or state..."
          value={filters.city}
          onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="border rounded-lg px-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filters.type}
          onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All types</option>
          {['apartment','house','condo','studio','townhouse'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filters.minBeds}
          onChange={e => setFilters(p => ({ ...p, minBeds: e.target.value }))}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Any beds</option>
          <option value="1">1+ beds</option>
          <option value="2">2+ beds</option>
          <option value="3">3+ beds</option>
          <option value="4">4+ beds</option>
        </select>
        <select
          value={filters.maxPrice}
          onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Any price</option>
          <option value="1500">Up to $1,500/mo</option>
          <option value="2000">Up to $2,000/mo</option>
          <option value="2500">Up to $2,500/mo</option>
          <option value="3000">Up to $3,000/mo</option>
          <option value="4000">Up to $4,000/mo</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          Search
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
            Clear all
          </button>
        )}
        <div className="flex-1" />
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === 'grid' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            ☰ List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === 'map' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            🗺 Map
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-500">
        {isLoading ? 'Loading...' : `${listings.length} rental${listings.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Content */}
      {view === 'map' ? (
        <RentalMapView listings={listings} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border h-72 animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && listings.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🏠</div>
              <p className="text-gray-500">No rentals found. Try adjusting your filters.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map(l => <PropertyCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  )
}