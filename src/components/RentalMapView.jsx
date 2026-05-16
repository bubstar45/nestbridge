'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const getCoverImage = (listing) =>
  listing?.images?.[0]?.url ?? listing?.coverImage ?? null

const PRICE_COLOR = (price) => {
  if (price < 2000) return { bg: '#0F6E56', border: '#1D9E75', label: '#E1F5EE' }
  if (price < 3000) return { bg: '#854F0B', border: '#BA7517', label: '#FAEEDA' }
  return { bg: '#A32D2D', border: '#D85A30', label: '#FAECE7' }
}

const markerHtml = (l) => {
  const col = PRICE_COLOR(l.price || 0)
  return `
    <div style="display:inline-flex;flex-direction:column;align-items:center">
      <div style="
        display:flex;align-items:center;
        padding:5px 11px;border-radius:20px;
        background:${col.bg};color:#fff;
        font-size:12px;font-weight:700;letter-spacing:0.2px;
        box-shadow:0 2px 6px rgba(0,0,0,0.32),0 0 0 2.5px #fff;
        border:1.5px solid ${col.border};
        white-space:nowrap;cursor:pointer;
        transition:transform .15s;
      " class="mpill-${l.id}">$${(l.price || 0).toLocaleString()}</div>
      <div style="width:0;height:0;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:6px solid ${col.bg};
        filter:drop-shadow(0 2px 1px rgba(0,0,0,0.15));
        margin-top:-1px;
      "></div>
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
  const avg = listings.length
    ? Math.round(listings.reduce((s, l) => s + (l.price || 0), 0) / listings.length)
    : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111', marginRight: 4 }}>
        {listings.length} rentals
      </span>
      {[
        { label: 'avg', value: `$${avg.toLocaleString()}/mo` },
        { label: 'min', value: `$${minP.toLocaleString()}` },
        { label: 'max', value: `$${maxP.toLocaleString()}` },
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
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8,
      padding: isMobile ? '6px 10px' : '8px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fafafa',
      flexShrink: 0, flexWrap: 'wrap',
      overflowX: isMobile ? 'auto' : undefined,
      WebkitOverflowScrolling: 'touch',
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>Filters:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
          {filters.maxPrice >= maxPrice ? 'Any price' : `≤ $${filters.maxPrice.toLocaleString()}`}
        </span>
        <input type="range" min={500} max={maxPrice} step={100}
          value={filters.maxPrice}
          onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
          style={{ width: isMobile ? 60 : 80, accentColor: '#3b5bdb' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Bed:</span>
        {BED_OPTIONS.map(b => (
          <button key={b} onClick={() => setFilters(f => ({ ...f, beds: b }))}
            style={{
              fontSize: 11, padding: isMobile ? '3px 7px' : '3px 8px', borderRadius: 12,
              border: `1px solid ${filters.beds === b ? '#3b5bdb' : '#d1d5db'}`,
              background: filters.beds === b ? '#eff1ff' : '#fff',
              color: filters.beds === b ? '#3b5bdb' : '#374151',
              cursor: 'pointer', fontWeight: filters.beds === b ? 600 : 400,
              WebkitTapHighlightColor: 'transparent',
            }}>{b}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Bath:</span>
        {BATH_OPTIONS.map(b => (
          <button key={b} onClick={() => setFilters(f => ({ ...f, baths: b }))}
            style={{
              fontSize: 11, padding: isMobile ? '3px 7px' : '3px 8px', borderRadius: 12,
              border: `1px solid ${filters.baths === b ? '#3b5bdb' : '#d1d5db'}`,
              background: filters.baths === b ? '#eff1ff' : '#fff',
              color: filters.baths === b ? '#3b5bdb' : '#374151',
              cursor: 'pointer', fontWeight: filters.baths === b ? 600 : 400,
              WebkitTapHighlightColor: 'transparent',
            }}>{b}</button>
        ))}
      </div>
      {(filters.beds !== 'Any' || filters.baths !== 'Any' || filters.maxPrice < maxPrice) && (
        <button onClick={() => setFilters({ beds: 'Any', baths: 'Any', maxPrice })}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12, marginLeft: 4,
            border: '1px solid #fca5a5', background: '#fef2f2',
            color: '#dc2626', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>Clear x</button>
      )}
    </div>
  )
}

function ListingSidebar({ listings, activeId, onHover, onClick }) {
  return (
    <div style={{
      width: 230, flexShrink: 0, overflowY: 'auto',
      borderRight: '1px solid #e5e7eb', background: '#fff'
    }}>
      {listings.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          No listings match your filters
        </div>
      )}
      {listings.map(l => {
        const col = PRICE_COLOR(l.price || 0)
        const active = activeId === l.id
        const cover = getCoverImage(l)
        return (
          <div key={l.id}
            onMouseEnter={() => onHover(l.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(l)}
            style={{
              padding: '10px 12px', borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer', transition: 'background .12s',
              background: active ? '#f5f7ff' : '#fff',
              borderLeft: active ? '3px solid #3b5bdb' : '3px solid transparent'
            }}
          >
            {cover ? (
              <img src={cover} alt={l.title}
                style={{ width: '100%', height: 68, objectFit: 'cover', borderRadius: 8, marginBottom: 7, display: 'block' }} />
            ) : (
              <div style={{
                width: '100%', height: 68, borderRadius: 8, marginBottom: 7,
                background: '#f3f4f6', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#9ca3af', fontSize: 11
              }}>No photo</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                ${l.price?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: 11, color: '#6b7280' }}>/mo</span>
              </span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: col.label, color: col.bg, fontWeight: 600
              }}>
                {l.price < 2000 ? 'Budget' : l.price < 3000 ? 'Mid' : 'Premium'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {l.title}
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
              {[`${l.bedrooms} bd`, `${l.bathrooms} ba`].map(t => (
                <span key={t} style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 8,
                  background: '#f3f4f6', color: '#4b5563'
                }}>{t}</span>
              ))}
              {l.city && (
                <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center', marginLeft: 'auto' }}>
                  {l.city}, {l.state}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MapPopup({ listing, onClose, markerPosition }) {
  const [imgIdx, setImgIdx] = useState(0)
  useEffect(() => { setImgIdx(0) }, [listing?.id])
  if (!listing || !markerPosition) return null

  const col = PRICE_COLOR(listing.price || 0)
  const images = listing?.images ?? []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)

  // Position popup above the marker
  const popupStyle = {
    position: 'absolute',
    zIndex: 1000,
    bottom: `calc(100vh - ${markerPosition.y}px + 10px)`,
    left: `${markerPosition.x}px`,
    transform: 'translateX(-50%)',
    width: 240,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  }

  // Small arrow pointing to marker
  const arrowStyle = {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid white',
    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
  }

  return (
    <div style={popupStyle}>
      {/* Image */}
      <div style={{
        position: 'relative', width: '100%',
        height: 100,
        background: '#f3f4f6', overflow: 'hidden'
      }}>
        {activeUrl ? (
          <img src={activeUrl} alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9ca3af' }}>
            No photo
          </div>
        )}
        
        {/* Price badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: col.bg, color: '#fff',
          padding: '2px 6px', borderRadius: 12,
          fontSize: 10, fontWeight: 700,
        }}>
          ${listing.price?.toLocaleString()}<span style={{ fontSize: 8 }}>/mo</span>
        </div>
        
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 4, right: 4,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none',
        }}>×</button>
      </div>

      {/* Details */}
      <div style={{ padding: '6px 8px 8px' }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#111', marginBottom: 2 }}>
          {listing.title.length > 30 ? listing.title.substring(0, 27) + '...' : listing.title}
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
          {listing.city}, {listing.state}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6' }}>
            {listing.bedrooms} bd
          </span>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6' }}>
            {listing.bathrooms} ba
          </span>
        </div>
        <a href={`/rentals/${listing.id}`} style={{
          display: 'block', textAlign: 'center',
          padding: '5px', borderRadius: 6,
          background: '#3b5bdb', color: '#fff',
          fontSize: 11, fontWeight: 500,
          textDecoration: 'none',
        }}>View →</a>
      </div>
      
      {/* Arrow pointing to marker */}
      <div style={arrowStyle} />
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
  const [markerPosition, setMarkerPosition] = useState(null)
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  const [filters, setFilters] = useState({ beds: 'Any', baths: 'Any', maxPrice })
  const filtered = applyFilters(listings, filters)
  const isMobile = useIsMobile()

  // Initialize map (only once)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    let isMounted = true

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        window.L = L
        await import('leaflet.markercluster')

        if (!isMounted) return
        LRef.current = L

        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        const map = L.map(mapRef.current, {
          zoomControl: false,
          scrollWheelZoom: false,
          tap: true,
        })
        mapInstanceRef.current = map

        const el = mapRef.current
        el.addEventListener('mouseenter', () => map.scrollWheelZoom.enable())
        el.addEventListener('mouseleave', () => map.scrollWheelZoom.disable())

        L.control.zoom({ position: 'topright' }).addTo(map)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CartoDB',
          subdomains: 'abcd', maxZoom: 19
        }).addTo(map)

        const cluster = L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
          iconCreateFunction: function(cluster) {
            const childCount = cluster.getChildCount();
            let bgColor = '#3b5bdb', w = 30
            if (childCount > 10) { bgColor = '#dc2626'; w = 46 }
            else if (childCount > 5) { bgColor = '#e8590c'; w = 38 }
            const fs = w === 46 ? 14 : w === 38 ? 12 : 11
            return L.divIcon({
              html: `<div style="background-color:${bgColor};width:${w}px;height:${w}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${fs}px;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;">${childCount}</div>`,
              className: '',
              iconSize: [w, w],
              iconAnchor: [w / 2, w / 2],
            });
          }
        })
        clusterRef.current = cluster
        cluster.addTo(map)
        setIsMapReady(true)

        const valid = listings.filter(l => l.lat && l.lng)
        if (valid.length && isMounted) {
          const bounds = L.latLngBounds(valid.map(l => [l.lat, l.lng]))
          map.fitBounds(bounds.pad(0.2))
        } else if (isMounted) {
          map.setView([39.5, -98.35], 4)
        }
      } catch (err) {
        console.error('Error initializing map:', err)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        clusterRef.current = null
        LRef.current = null
        setIsMapReady(false)
      }
    }
  }, [listings])

  useEffect(() => {
    if (!isMapReady) return
    const L = LRef.current
    const cluster = clusterRef.current
    if (!L || !cluster) return

    cluster.clearLayers()
    markersRef.current = {}

    filtered.forEach(l => {
      if (!l.lat || !l.lng) return
      const icon = L.divIcon({ className: '', iconAnchor: [40, 42], html: markerHtml(l) })
      const marker = L.marker([l.lat, l.lng], { icon })
      marker.on('click', () => { setPopupListing(l); setActiveId(l.id) })
      markersRef.current[l.id] = marker
      cluster.addLayer(marker)
    })
  }, [filtered, isMapReady])

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement()
      if (!el) return
      const pill = el.querySelector(`[class^="mpill"]`)
      if (pill) {
        pill.style.transform = activeId === id ? 'scale(1.15)' : 'scale(1)'
        pill.style.zIndex = activeId === id ? 999 : 1
      }
    })
  }, [activeId])

  const handleSidebarClick = useCallback((l) => {
    setPopupListing(l)
    setActiveId(l.id)
    const map = mapInstanceRef.current
    if (map && l.lat && l.lng) {
      map.flyTo([l.lat, l.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
    }
  }, [])

  const handleSidebarHover = useCallback((id) => setActiveId(id), [])

  const mapPanel = (
    <div style={{ flex: 1, position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* Price legend */}
      <div style={{
        position: 'absolute', bottom: 20, left: 14, zIndex: 500,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '8px 12px', fontSize: 11, color: '#4b5563',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>Price</div>
        {[
          { color: '#0F6E56', label: 'Under $2k' },
          { color: '#854F0B', label: '$2k - $3k' },
          { color: '#A32D2D', label: '$3k+' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
            {r.label}
          </div>
        ))}
      </div>

      {/* Fit all button */}
      <button
        onClick={() => {
          const map = mapInstanceRef.current
          const cluster = clusterRef.current
          if (!map || !cluster) return
          const bounds = cluster.getBounds()
          if (bounds && bounds.isValid()) map.fitBounds(bounds)
        }}
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 500,
          background: '#fff', border: '1px solid #d1d5db',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 12, color: '#374151', cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 5,
          WebkitTapHighlightColor: 'transparent',
        }}
      >Fit all listings</button>

      <MapPopup
        listing={popupListing}
        onClose={() => { setPopupListing(null); setActiveId(null) }}
        isMobile={isMobile}
      />
    </div>
  )

  // ── MOBILE: stats + filters + full-screen map ────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100svh',
        fontFamily: 'system-ui, sans-serif', overflow: 'hidden',
      }}>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <StatsBar listings={filtered} />
        <FilterBar filters={filters} setFilters={setFilters} listings={listings} isMobile={true} />
        {mapPanel}
      </div>
    )
  }

  // ── DESKTOP (unchanged) ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'calc(100svh - 160px)', minHeight: 500, fontFamily: 'system-ui, sans-serif' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <StatsBar listings={filtered} />
      <FilterBar filters={filters} setFilters={setFilters} listings={listings} isMobile={false} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ListingSidebar
          listings={filtered}
          activeId={activeId}
          onHover={handleSidebarHover}
          onClick={handleSidebarClick}
        />
        {mapPanel}
      </div>
    </div>
  )
}