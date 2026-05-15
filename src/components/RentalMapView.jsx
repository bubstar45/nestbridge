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
      <div style="display:flex;align-items:center;padding:6px 12px;border-radius:20px;background:${col.bg};color:#fff;font-size:12px;font-weight:700;letter-spacing:0.2px;box-shadow:0 2px 6px rgba(0,0,0,0.32),0 0 0 2.5px #fff;border:1.5px solid ${col.border};white-space:nowrap;cursor:pointer;transition:transform .15s;" class="mpill-${l.id}">
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

function StatsBar({ listings }) {
  const avg = listings.length ? Math.round(listings.reduce((s, l) => s + (l.price || 0), 0) / listings.length) : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
        {listings.length} rentals
      </span>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
        {[
          { label: 'avg', value: `$${avg.toLocaleString()}/mo` },
          { label: 'min', value: `$${minP.toLocaleString()}` },
          { label: 'max', value: `$${maxP.toLocaleString()}` },
        ].map(s => (
          <span key={s.label} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#9ca3af' }}>{s.label}</span>{' '}
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
    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
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

        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Bed</span>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              {BED_OPTIONS.map(b => (
                <button key={b} onClick={() => setFilters(f => ({ ...f, beds: b }))}
                  style={{
                    fontSize: 11, padding: '4px 9px', borderRadius: 12,
                    border: `1px solid ${filters.beds === b ? '#3b5bdb' : '#d1d5db'}`,
                    background: filters.beds === b ? '#eff1ff' : '#fff',
                    color: filters.beds === b ? '#3b5bdb' : '#374151',
                  }}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Bath</span>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              {BATH_OPTIONS.map(b => (
                <button key={b} onClick={() => setFilters(f => ({ ...f, baths: b }))}
                  style={{
                    fontSize: 11, padding: '4px 9px', borderRadius: 12,
                    border: `1px solid ${filters.baths === b ? '#3b5bdb' : '#d1d5db'}`,
                    background: filters.baths === b ? '#eff1ff' : '#fff',
                    color: filters.baths === b ? '#3b5bdb' : '#374151',
                  }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(filters.beds !== 'Any' || filters.baths !== 'Any' || filters.maxPrice < maxPrice) && (
          <button onClick={() => setFilters({ beds: 'Any', baths: 'Any', maxPrice })}
            style={{ marginLeft: 'auto', fontSize: 13, padding: '6px 12px', borderRadius: 12, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626' }}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function ListingSidebar({ listings, activeId, onHover, onClick }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      {listings.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          No listings match your filters
        </div>
      )}

      {listings.map(l => {
        const col = PRICE_COLOR(l.price || 0)
        const active = activeId === l.id
        const cover = getCoverImage(l)

        return (
          <div
            key={l.id}
            onMouseEnter={() => onHover(l.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(l)}
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer',
              background: active ? '#f5f7ff' : '#fff',
              borderLeft: active ? '4px solid #3b5bdb' : '4px solid transparent',
            }}
          >
            {cover ? (
              <img src={cover} alt={l.title} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
            ) : (
              <div style={{ width: '100%', height: 110, borderRadius: 10, marginBottom: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No photo
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>
                ${l.price?.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>/mo</span>
              </span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: col.label, color: col.bg, fontWeight: 600 }}>
                {l.price < 2000 ? 'Budget' : l.price < 3000 ? 'Mid' : 'Premium'}
              </span>
            </div>

            <div style={{ fontSize: 13.5, marginTop: 4, color: '#111', lineHeight: 1.3 }}>{l.title}</div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[`${l.bedrooms} bd`, `${l.bathrooms} ba`].map(t => (
                <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f3f4f6', color: '#4b5563' }}>{t}</span>
              ))}
              {l.city && <span style={{ fontSize: 11.5, color: '#6b7280', marginLeft: 'auto' }}>{l.city}, {l.state}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MapPopup({ listing, onClose }) {
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => { setImgIdx(0) }, [listing?.id])

  if (!listing) return null

  const col = PRICE_COLOR(listing.price || 0)
  const images = listing.images || []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)

  return (
    <div style={{
      position: 'absolute',
      zIndex: 1000,
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(92vw, 320px)',
      background: '#fff',
      borderRadius: 18,
      boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    }}>
      {/* Image Area */}
      <div style={{ position: 'relative', height: 170, background: '#f3f4f6' }}>
        {activeUrl ? <img src={activeUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div>No photo</div>}

        <div style={{ position: 'absolute', top: 12, left: 12, background: col.bg, color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>
          ${listing.price?.toLocaleString()}/mo
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{listing.title}</div>
        <div style={{ color: '#6b7280', marginTop: 2 }}>{listing.city}, {listing.state}</div>

        <a href={`/rentals/${listing.id}`} style={{ display: 'block', marginTop: 14, padding: '11px', background: '#3b5bdb', color: '#fff', textAlign: 'center', borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>
          View Full Listing
        </a>
      </div>
    </div>
  )
}

export default function RentalMapView({ listings = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const clusterRef = useRef(null)
  const markersRef = useRef({})
  const LRef = useRef(null)

  const [activeId, setActiveId] = useState(null)
  const [popupListing, setPopupListing] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  const [filters, setFilters] = useState({ beds: 'Any', baths: 'Any', maxPrice })

  const filtered = applyFilters(listings, filters)

  // Your existing map initialization and marker useEffects go here...
  // (Keep all your useEffect logic for map, markers, etc. unchanged)

  const handleSidebarClick = useCallback((l) => {
    setPopupListing(l)
    setActiveId(l.id)
    if (mapInstanceRef.current && l.lat && l.lng) {
      mapInstanceRef.current.flyTo([l.lat, l.lng], Math.max(mapInstanceRef.current.getZoom(), 14), { duration: 0.6 })
      if (window.innerWidth < 768) setViewMode('map')
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'calc(100svh - 160px)', minHeight: 500, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <StatsBar listings={filtered} />
      <FilterBar filters={filters} setFilters={setFilters} listings={listings} />

      {/* Mobile Toggle */}
      <div className="md:hidden flex bg-white border-b border-gray-200 p-2 gap-2">
        <button onClick={() => setViewMode('map')} className={`flex-1 py-3 rounded-xl font-semibold ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
          Map
        </button>
        <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl font-semibold ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
          List ({filtered.length})
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* List Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-gray-200 overflow-hidden ${viewMode === 'list' ? 'block' : 'hidden md:block'}`}>
          <ListingSidebar listings={filtered} activeId={activeId} onHover={setActiveId} onClick={handleSidebarClick} />
        </div>

        {/* Map */}
        <div className={`flex-1 relative ${viewMode === 'map' ? 'block' : 'hidden md:block'}`}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {/* Legend & Controls */}
          <div style={{ position: 'absolute', bottom: 20, left: 14, zIndex: 500, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 13px', fontSize: 11.5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 600, marginBottom: 5 }}>Price</div>
            {[{ color: '#0F6E56', label: 'Under $2k' }, { color: '#854F0B', label: '$2k–$3k' }, { color: '#A32D2D', label: '$3k+' }].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: r.color }} />
                {r.label}
              </div>
            ))}
          </div>

          <button onClick={() => mapInstanceRef.current?.fitBounds(clusterRef.current?.getBounds())} style={{ position: 'absolute', top: 14, left: 14, zIndex: 500, padding: '8px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: 8, fontSize: 13 }}>
            Fit All
          </button>

          <MapPopup listing={popupListing} onClose={() => { setPopupListing(null); setActiveId(null) }} />
        </div>
      </div>
    </div>
  )
}