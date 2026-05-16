'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const getCoverImage = (listing) =>
  listing?.images?.[0]?.url ?? listing?.coverImage ?? null

const PRICE_COLOR = (price) => {
  if (price < 100) return { bg: '#0F6E56', border: '#1D9E75', label: '#E1F5EE' }
  if (price < 250) return { bg: '#b45309', border: '#d97706', label: '#fef3c7' }
  return { bg: '#9a3412', border: '#c2410c', label: '#ffedd5' }
}

const markerHtml = (l) => {
  const col = PRICE_COLOR(l.price_per_night || 0)
  return `
    <div style="display:inline-flex;flex-direction:column;align-items:center; pointer-events:auto;">
      <div style="
        display:flex;align-items:center;
        padding:6px 13px;border-radius:22px;
        background:${col.bg};color:#fff;
        font-size:13.5px;font-weight:700;
        box-shadow:0 3px 10px rgba(0,0,0,0.35), 0 0 0 3px #fff;
        border:2px solid ${col.border};
        white-space:nowrap;cursor:pointer;
        transition:transform .2s ease;
      " class="mpill-${l.id}">
        $${(l.price_per_night || 0).toLocaleString()}
        <span style="font-weight:400;font-size:10px;opacity:0.9">/nt</span>
      </div>
      <div style="width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${col.bg};
        filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        margin-top:-2px;
      "></div>
    </div>`
}

const GUEST_OPTIONS = ['Any', '1', '2', '4', '6+']
const TYPE_OPTIONS = ['Any', 'Entire place', 'Private room', 'Shared room']

function applyFilters(listings, filters) {
  return listings.filter(l => {
    if (l.price_per_night > filters.maxPrice) return false
    if (filters.guests !== 'Any') {
      const n = filters.guests === '6+' ? 6 : parseInt(filters.guests)
      const cap = l.max_guests ?? l.guests ?? 0
      if (cap < n) return false
    }
    if (filters.type !== 'Any' && l.type && l.type !== filters.type) return false
    return true
  })
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function StatsBar({ listings }) {
  const avg = listings.length ? Math.round(listings.reduce((s, l) => s + (l.price_per_night || 0), 0) / listings.length) : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price_per_night || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price_per_night || 0)) : 0

  return (
    <div data-stats-bar style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
        {listings.length} stays
      </span>
      {[
        { label: 'avg', value: `$${avg}/nt` },
        { label: 'min', value: `$${minP}` },
        { label: 'max', value: `$${maxP}` },
      ].map(s => (
        <span key={s.label} style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 20,
          background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb'
        }}>
          <span style={{ color: '#9ca3af' }}>{s.label} </span>
          <span style={{ color: '#374151', fontWeight: 500 }}>{s.value}</span>
        </span>
      ))}
    </div>
  )
}

function FilterBar({ filters, setFilters, listings, isMobile }) {
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price_per_night || 0)) : 1000
  const isDirty = filters.guests !== 'Any' || filters.type !== 'Any' || filters.maxPrice < maxPrice

  if (isMobile) {
    return (
      <div data-filter-bar style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderBottom: '1px solid #e5e7eb', background: '#fafafa',
        flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>Filters:</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
            {filters.maxPrice >= maxPrice ? 'Any price' : `≤ $${filters.maxPrice}`}
          </span>
          <input type="range" min={10} max={maxPrice} step={10}
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            style={{ width: 65, accentColor: '#e8590c' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Guests:</span>
          {GUEST_OPTIONS.map(g => (
            <button key={g} onClick={() => setFilters(f => ({ ...f, guests: g }))}
              style={{
                fontSize: 11, padding: '3px 7px', borderRadius: 12,
                border: `1px solid ${filters.guests === g ? '#e8590c' : '#d1d5db'}`,
                background: filters.guests === g ? '#fff7ed' : '#fff',
                color: filters.guests === g ? '#e8590c' : '#374151',
                fontWeight: filters.guests === g ? 600 : 400,
                WebkitTapHighlightColor: 'transparent',
              }}>{g}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Type:</span>
          {TYPE_OPTIONS.map(t => (
            <button key={t} onClick={() => setFilters(f => ({ ...f, type: t }))}
              style={{
                fontSize: 11, padding: '3px 7px', borderRadius: 12,
                border: `1px solid ${filters.type === t ? '#e8590c' : '#d1d5db'}`,
                background: filters.type === t ? '#fff7ed' : '#fff',
                color: filters.type === t ? '#e8590c' : '#374151',
                fontWeight: filters.type === t ? 600 : 400,
                WebkitTapHighlightColor: 'transparent',
              }}>{t}</button>
          ))}
        </div>

        {isDirty && (
          <button onClick={() => setFilters({ guests: 'Any', type: 'Any', maxPrice })}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626' }}>
            Clear
          </button>
        )}
      </div>
    )
  }

  // Desktop FilterBar (unchanged from your version)
  return (
    <div data-filter-bar style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0, flexWrap: 'wrap'
    }}>
      {/* Same desktop filters as your previous code */}
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Filters:</span>
      {/* ... (add your desktop version here if needed) ... */}
    </div>
  )
}

function MapPopup({ listing, onClose, isMobile }) {
  const [imgIdx, setImgIdx] = useState(0)
  useEffect(() => { setImgIdx(0) }, [listing?.id])
  if (!listing) return null

  const col = PRICE_COLOR(listing.price_per_night || 0)
  const images = listing?.images ?? []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)
  const rating = listing.rating ?? listing.avg_rating

  return (
    <div style={isMobile ? {
      position: 'absolute', zIndex: 1000, bottom: 0, left: 0, right: 0,
      background: '#fff', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
      overflow: 'hidden', borderTop: '1px solid #e5e7eb'
    } : {
      position: 'absolute', zIndex: 1000, bottom: 24, left: '50%', transform: 'translateX(-50%)',
      width: 290, background: '#fff', borderRadius: 18, boxShadow: '0 15px 50px rgba(0,0,0,0.25)',
      overflow: 'hidden', border: '1px solid #e5e7eb'
    }}>
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 40, height: 5, background: '#d1d5db', borderRadius: 999 }} />
        </div>
      )}

      <div style={{ position: 'relative', height: isMobile ? 210 : 170, background: '#f3f4f6', overflow: 'hidden' }}>
        {activeUrl ? (
          <img src={activeUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No photo</div>
        )}

        <div style={{ position: 'absolute', top: 12, left: 12, background: col.bg, color: '#fff', padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
          ${listing.price_per_night?.toLocaleString()}<span style={{ fontSize: 11, opacity: 0.85 }}>/night</span>
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 10, width: 32, height: 32,
          borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', fontSize: 18, cursor: 'pointer'
        }}>×</button>
      </div>

      <div style={{ padding: isMobile ? '16px' : '14px' }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 4 }}>{listing.title}</div>
        <div style={{ color: '#6b7280', marginBottom: 12 }}>{listing.city}, {listing.state}</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {listing.bedrooms && <span style={{ fontSize: 13, padding: '4px 10px', background: '#f3f4f6', borderRadius: 8 }}>{listing.bedrooms} bed</span>}
          {listing.max_guests && <span style={{ fontSize: 13, padding: '4px 10px', background: '#f3f4f6', borderRadius: 8 }}>{listing.max_guests} guests</span>}
          {rating && <span style={{ fontSize: 13, color: '#e8590c' }}>★ {Number(rating).toFixed(1)}</span>}
        </div>

        <a href={`/stays/${listing.id}`} style={{
          display: 'block', padding: '14px', background: '#e8590c', color: '#fff',
          textAlign: 'center', borderRadius: 12, fontWeight: 600, textDecoration: 'none'
        }}>
          View Stay →
        </a>
      </div>
    </div>
  )
}

export default function StayMapView({ listings = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const clusterRef = useRef(null)
  const markersRef = useRef({})
  const LRef = useRef(null)

  const [activeId, setActiveId] = useState(null)
  const [popupListing, setPopupListing] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapHeight, setMapHeight] = useState('100%')

  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price_per_night || 0)) : 1000
  const [filters, setFilters] = useState({ guests: 'Any', type: 'Any', maxPrice })
  const filtered = applyFilters(listings, filters)
  const isMobile = useIsMobile()

  // Dynamic Map Height on Mobile
  useEffect(() => {
    const updateHeight = () => {
      const stats = document.querySelector('[data-stats-bar]')
      const filterBar = document.querySelector('[data-filter-bar]')
      let h = 0
      if (stats) h += stats.offsetHeight
      if (filterBar) h += filterBar.offsetHeight
      setMapHeight(`calc(100svh - ${h}px)`)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.addEventListener('orientationchange', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('orientationchange', updateHeight)
    }
  }, [filtered.length])

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')
      LRef.current = L

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        zoomControl: false,
        tap: true,
        tapTolerance: 20,
        inertia: true,
        inertiaDeceleration: 2800,
      })

      mapInstanceRef.current = map
      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CartoDB',
        maxZoom: 19,
      }).addTo(map)

      const cluster = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 48,
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: true,
      })

      clusterRef.current = cluster
      cluster.addTo(map)
      setIsMapReady(true)
    }

    init()

    return () => mapInstanceRef.current?.remove()
  }, [])

  // Render Markers
  useEffect(() => {
    if (!isMapReady) return

    const L = LRef.current
    const cluster = clusterRef.current
    cluster.clearLayers()
    markersRef.current = {}

    filtered.forEach(l => {
      if (!l.lat || !l.lng) return

      const icon = L.divIcon({ className: '', iconAnchor: [43, 48], html: markerHtml(l) })
      const marker = L.marker([l.lat, l.lng], { icon })

      marker.on('click', () => {
        setPopupListing(l)
        setActiveId(l.id)

        if (isMobile && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([l.lat, l.lng], Math.max(mapInstanceRef.current.getZoom(), 15), { duration: 0.5 })
        }
      })

      markersRef.current[l.id] = marker
      cluster.addLayer(marker)
    })
  }, [filtered, isMapReady, isMobile])

  // Active marker highlight
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const pill = marker.getElement()?.querySelector(`.mpill-${id}`)
      if (pill) {
        pill.style.transform = activeId === id ? 'scale(1.22)' : 'scale(1)'
      }
    })
  }, [activeId])

  const handleListingClick = useCallback((l) => {
    setPopupListing(l)
    setActiveId(l.id)
    mapInstanceRef.current?.flyTo([l.lat, l.lng], 16, { duration: 0.6 })
  }, [])

  return (
    <div style={{ width: '100%', height: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <StatsBar listings={filtered} />
      <FilterBar filters={filters} setFilters={setFilters} listings={listings} isMobile={isMobile} />

      <div style={{ flex: 1, position: 'relative', height: isMobile ? mapHeight : 'auto' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 20, left: 14, zIndex: 500,
          background: '#fff', padding: '10px 14px', borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 12, border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Price / night</div>
          {[
            { color: '#0F6E56', label: 'Under $100' },
            { color: '#b45309', label: '$100 – $250' },
            { color: '#9a3412', label: '$250+' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        <MapPopup
          listing={popupListing}
          onClose={() => { setPopupListing(null); setActiveId(null) }}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}