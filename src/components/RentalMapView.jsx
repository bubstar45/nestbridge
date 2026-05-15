'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const getCoverImage = (listing) => listing?.images?.[0]?.url ?? listing?.coverImage ?? null

const PRICE_COLOR = (price) => {
  if (price < 2000) return { bg: '#0F6E56', border: '#1D9E75', label: '#E1F5EE' }
  if (price < 3000) return { bg: '#854F0B', border: '#BA7517', label: '#FAEEDA' }
  return { bg: '#A32D2D', border: '#D85A30', label: '#FAECE7' }
}

const markerHtml = (l) => {
  const col = PRICE_COLOR(l.price || 0)
  return `
    <div style="display:inline-flex;flex-direction:column;align-items:center">
      <div style="display:flex;align-items:center;padding:5px 11px;border-radius:20px;background:${col.bg};color:#fff;font-size:12px;font-weight:700;letter-spacing:0.2px;box-shadow:0 2px 6px rgba(0,0,0,0.32),0 0 0 2.5px #fff;border:1.5px solid ${col.border};white-space:nowrap;cursor:pointer;transition:transform .15s;" class="mpill-${l.id}">
        $${(l.price || 0).toLocaleString()}
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${col.bg};filter:drop-shadow(0 2px 1px rgba(0,0,0,0.15));margin-top:-1px;"></div>
    </div>`
}

const BED_OPTIONS = ['Any', '1', '2', '3', '4+']
const BATH_OPTIONS = ['Any', '1', '2', '3+']

function applyFilters(listings, filters) {
  return listings.filter(l => {
    if (l.price > filters.maxPrice) return false
    if (filters.beds !== 'Any') {
      const n = filters.beds === '4+' ? 4 : parseInt(filters.beds)
      if (filters.beds === '4+' ? l.bedrooms < n : l.bedrooms !== n) return false
    }
    if (filters.baths !== 'Any') {
      const n = filters.baths === '3+' ? 3 : parseInt(filters.baths)
      if (filters.baths === '3+' ? l.bathrooms < n : l.bathrooms !== n) return false
    }
    return true
  })
}

// ... (StatsBar and FilterBar kept mostly same but improved mobile styles)

function StatsBar({ listings }) {
  const avg = listings.length ? Math.round(listings.reduce((s, l) => s + (l.price || 0), 0) / listings.length) : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 0

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '10px 14px', 
      borderBottom: '1px solid #e5e7eb', 
      background: '#fff', 
      flexShrink: 0, 
      flexWrap: 'wrap',
      fontSize: '13px'
    }}>
      <span style={{ fontWeight: 600, color: '#111', marginRight: 4 }}>
        {listings.length} rentals
      </span>
      {/* Stats chips - scrollable on mobile */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
        {[
          { label: 'avg', value: `$${avg.toLocaleString()}/mo` },
          { label: 'min', value: `$${minP.toLocaleString()}` },
          { label: 'max', value: `$${maxP.toLocaleString()}` },
        ].map(s => (
          <span key={s.label} style={{ 
            padding: '3px 10px', 
            borderRadius: 20, 
            background: '#f3f4f6', 
            color: '#6b7280', 
            border: '1px solid #e5e7eb',
            whiteSpace: 'nowrap',
            fontSize: '12px'
          }}>
            <span style={{ color: '#9ca3af' }}>{s.label} </span>
            <span style={{ color: '#374151', fontWeight: 500 }}>{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function FilterBar({ filters, setFilters, listings }) {
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000

  return (
    <div style={{ 
      padding: '10px 14px', 
      borderBottom: '1px solid #e5e7eb', 
      background: '#fafafa', 
      flexShrink: 0 
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filters.maxPrice >= maxPrice ? 'Any price' : `≤ $${filters.maxPrice}`}
          </span>
          <input 
            type="range" 
            min={500} 
            max={maxPrice} 
            step={100} 
            value={filters.maxPrice} 
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            style={{ flex: 1, accentColor: '#3b5bdb' }} 
          />
        </div>

        {/* Beds & Baths - smaller on mobile */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Bed</span>
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {BED_OPTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => setFilters(f => ({ ...f, beds: b }))}
                  style={{
                    fontSize: 11,
                    padding: '4px 9px',
                    borderRadius: 12,
                    border: `1px solid ${filters.beds === b ? '#3b5bdb' : '#d1d5db'}`,
                    background: filters.beds === b ? '#eff1ff' : '#fff',
                    color: filters.beds === b ? '#3b5bdb' : '#374151',
                    fontWeight: filters.beds === b ? 600 : 400,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Bath</span>
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {BATH_OPTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => setFilters(f => ({ ...f, baths: b }))}
                  style={{
                    fontSize: 11,
                    padding: '4px 9px',
                    borderRadius: 12,
                    border: `1px solid ${filters.baths === b ? '#3b5bdb' : '#d1d5db'}`,
                    background: filters.baths === b ? '#eff1ff' : '#fff',
                    color: filters.baths === b ? '#3b5bdb' : '#374151',
                    fontWeight: filters.baths === b ? 600 : 400,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(filters.beds !== 'Any' || filters.baths !== 'Any' || filters.maxPrice < maxPrice) && (
          <button 
            onClick={() => setFilters({ beds: 'Any', baths: 'Any', maxPrice })}
            style={{ 
              fontSize: 12, 
              padding: '6px 12px', 
              borderRadius: 12, 
              border: '1px solid #fca5a5', 
              background: '#fef2f2', 
              color: '#dc2626',
              marginLeft: 'auto'
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ... ListingSidebar and MapPopup (minor tweaks for mobile)

function RentalMapView({ listings = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const clusterRef = useRef(null)
  const markersRef = useRef({})
  const LRef = useRef(null)

  const [activeId, setActiveId] = useState(null)
  const [popupListing, setPopupListing] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [viewMode, setViewMode] = useState('map') // 'map' | 'list'

  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  const [filters, setFilters] = useState({ beds: 'Any', baths: 'Any', maxPrice })
  const filtered = applyFilters(listings, filters)

  // ... (map initialization and marker logic unchanged - keep your existing useEffects)

  const handleSidebarClick = useCallback((l) => {
    setPopupListing(l)
    setActiveId(l.id)
    const map = mapInstanceRef.current
    if (map && l.lat && l.lng) {
      map.flyTo([l.lat, l.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
      // Switch to map on mobile when clicking a listing
      if (window.innerWidth < 768) setViewMode('map')
    }
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: 'calc(100svh - 160px)', 
      minHeight: 500,
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      <StatsBar listings={filtered} />
      <FilterBar filters={filters} setFilters={setFilters} listings={listings} />

      {/* Mobile View Toggle */}
      <div style={{ 
        display: 'flex', 
        background: '#fff', 
        borderBottom: '1px solid #e5e7eb',
        padding: '6px 12px',
        gap: 8,
        fontSize: '14px',
        fontWeight: 600
      }} className="md:hidden">
        <button 
          onClick={() => setViewMode('map')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 8,
            background: viewMode === 'map' ? '#3b5bdb' : '#f3f4f6',
            color: viewMode === 'map' ? '#fff' : '#374151'
          }}
        >
          Map
        </button>
        <button 
          onClick={() => setViewMode('list')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 8,
            background: viewMode === 'list' ? '#3b5bdb' : '#f3f4f6',
            color: viewMode === 'list' ? '#fff' : '#374151'
          }}
        >
          List ({filtered.length})
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row' // fallback
      }} className="flex-col md:flex-row">

        {/* Sidebar / List */}
        <div style={{ 
          width: '100%',
          maxWidth: '100%',
          flexShrink: 0,
          overflowY: 'auto',
          borderRight: '1px solid #e5e7eb',
          background: '#fff',
          display: viewMode === 'list' || window.innerWidth >= 768 ? 'block' : 'none'
        }} className="md:block md:w-[280px] lg:w-[320px]">
          <ListingSidebar 
            listings={filtered} 
            activeId={activeId} 
            onHover={id => setActiveId(id)} 
            onClick={handleSidebarClick} 
          />
        </div>

        {/* Map Container */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          display: viewMode === 'map' || window.innerWidth >= 768 ? 'block' : 'none'
        }} className="md:block">
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: 20, left: 14, zIndex: 500, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Price</div>
            {[
              { color: '#0F6E56', label: 'Under $2k' },
              { color: '#854F0B', label: '$2k–$3k' },
              { color: '#A32D2D', label: '$3k+' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                {r.label}
              </div>
            ))}
          </div>

          <button 
            onClick={() => mapInstanceRef.current?.fitBounds(clusterRef.current?.getBounds())}
            style={{ 
              position: 'absolute', 
              top: 14, 
              left: 14, 
              zIndex: 500, 
              background: '#fff', 
              border: '1px solid #d1d5db', 
              borderRadius: 8, 
              padding: '8px 14px', 
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            Fit All
          </button>

          <MapPopup 
            listing={popupListing} 
            onClose={() => { setPopupListing(null); setActiveId(null) }} 
          />
        </div>
      </div>
    </div>
  )
}

export default RentalMapView