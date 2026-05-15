'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { getListings } from '@/lib/api'
import PropertyCard from '@/components/RentalCard'
import RentalMapView from '@/components/RentalMapView'

const fetcher = (filters) => getListings({ ...filters, mode: 'rental' }).then(r => r.data.listings)

export default function RentalsPage() {
  const [view, setView] = useState('grid') // 'grid' | 'map'
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Long-term Rentals</h1>
        <p className="text-gray-500 text-sm">Monthly leases · Apply online ·</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b px-6 py-4 flex flex-wrap gap-3 items-center">
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
            <option key={t} value={t} className="capitalize">{t}</option>
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
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
      <div className="px-6 py-3 text-sm text-gray-500">
        {isLoading ? 'Loading...' : `${listings.length} rental${listings.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Content */}
      {view === 'map' ? (
        <RentalMapView listings={listings} />
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(l => <PropertyCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  )
}