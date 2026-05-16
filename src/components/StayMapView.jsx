'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const getCoverImage = (listing) =>
  listing?.images?.[0]?.url ?? listing?.coverImage ?? null

// Orange accent to match the stays brand colour
const PRICE_COLOR = (price) => {
  if (price < 100) return { bg: '#0F6E56', border: '#1D9E75', label: '#E1F5EE' }
  if (price < 250) return { bg: '#b45309', border: '#d97706', label: '#fef3c7' }
  return { bg: '#9a3412', border: '#c2410c', label: '#ffedd5' }
}

const markerHtml = (l) => {
  const col = PRICE_COLOR(l.price_per_night || 0)
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
      " class="mpill-${l.id}">$${(l.price_per_night || 0).toLocaleString()}<span style="font-weight:400;font-size:10px;opacity:0.85">/nt</span></div>
      <div style="width:0;height:0;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:6px solid ${col.bg};
        filter:drop-shadow(0 2px 1px rgba(0,0,0,0.15));
        margin-top:-1px;
      "></div>
    </div>`
}

const GUEST_OPTIONS = ['Any', '1', '2', '4', '6+']
const TYPE_OPTIONS  = ['Any', 'Entire place', 'Private room', 'Shared room']

function applyFilters(listings, filters) {
  return listings.filter(l => {
    if (l.price_per_night > filters.maxPrice) return false
    if (filters.guests !== 'Any') {
      const n = filters.guests === '6+' ? 6 : parseInt(filters.guests)
      const cap = l.max_guests ?? l.guests ?? 0
      if (filters.guests === '6+' ? cap < n : cap < n) return false
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
  const avg = listings.length
    ? Math.round(listings.reduce((s, l) => s + (l.price_per_night || 0), 0) / listings.length)
    : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price_per_night || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price_per_night || 0)) : 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111', marginRight: 4 }}>
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px',
        borderBottom: '1px solid #e5e7eb', background: '#fafafa',
        flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>Filters:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
            {filters.maxPrice >= maxPrice ? 'Any price' : `≤ $${filters.maxPrice}`}
          </span>
          <input type="range" min={10} max={maxPrice} step={10}
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            style={{ width: 60, accentColor: '#e8590c' }}
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
                cursor: 'pointer', fontWeight: filters.guests === g ? 600 : 400,
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
                cursor: 'pointer', fontWeight: filters.type === t ? 600 : 400,
                WebkitTapHighlightColor: 'transparent',
              }}>{t}</button>
          ))}
        </div>
        {isDirty && (
          <button onClick={() => setFilters({ guests: 'Any', type: 'Any', maxPrice })}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12, marginLeft: 4,
              border: '1px solid #fca5a5', background: '#fef2f2',
              color: '#dc2626', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>Clear</button>
        )}
      </div>
    )
  }

  // Desktop filter bar
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      borderBottom: '1px solid #e5e7eb', background: '#fafafa',
      flexShrink: 0, flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Filters:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#374151' }}>
          {filters.maxPrice >= maxPrice ? 'Any price' : `<= $${filters.maxPrice}/nt`}
        </span>
        <input type="range" min={10} max={maxPrice} step={10}
          value={filters.maxPrice}
          onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
          style={{ width: 80, accentColor: '#e8590c' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Guests:</span>
        {GUEST_OPTIONS.map(g => (
          <button key={g} onClick={() => setFilters(f => ({ ...f, guests: g }))}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 12,
              border: `1px solid ${filters.guests === g ? '#e8590c' : '#d1d5db'}`,
              background: filters.guests === g ? '#fff7ed' : '#fff',
              color: filters.guests === g ? '#e8590c' : '#374151',
              cursor: 'pointer', fontWeight: filters.guests === g ? 600 : 400
            }}>{g}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Type:</span>
        {TYPE_OPTIONS.map(t => (
          <button key={t} onClick={() => setFilters(f => ({ ...f, type: t }))}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 12,
              border: `1px solid ${filters.type === t ? '#e8590c' : '#d1d5db'}`,
              background: filters.type === t ? '#fff7ed' : '#fff',
              color: filters.type === t ? '#e8590c' : '#374151',
              cursor: 'pointer', fontWeight: filters.type === t ? 600 : 400
            }}>{t}</button>
        ))}
      </div>
      {isDirty && (
        <button onClick={() => setFilters({ guests: 'Any', type: 'Any', maxPrice })}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12, marginLeft: 4,
            border: '1px solid #fca5a5', background: '#fef2f2',
            color: '#dc2626', cursor: 'pointer'
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
          No stays match your filters
        </div>
      )}
      {listings.map(l => {
        const col = PRICE_COLOR(l.price_per_night || 0)
        const active = activeId === l.id
        const cover = getCoverImage(l)
        const rating = l.rating ?? l.avg_rating
        const tier = l.price_per_night < 100 ? 'Budget' : l.price_per_night < 250 ? 'Mid' : 'Luxury'
        return (
          <div key={l.id}
            onMouseEnter={() => onHover(l.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(l)}
            style={{
              padding: '10px 12px', borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer', transition: 'background .12s',
              background: active ? '#fff7ed' : '#fff',
              borderLeft: active ? '3px solid #e8590c' : '3px solid transparent'
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
                ${l.price_per_night?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: 11, color: '#6b7280' }}>/nt</span>
              </span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: col.label, color: col.bg, fontWeight: 600
              }}>{tier}</span>
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {l.title}
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {l.bedrooms != null && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#f3f4f6', color: '#4b5563' }}>{l.bedrooms} bd</span>}
              {l.max_guests != null && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#f3f4f6', color: '#4b5563' }}>{l.max_guests} guests</span>}
              {rating != null && <span style={{ fontSize: 10, color: '#e8590c', fontWeight: 600 }}>★ {Number(rating).toFixed(1)}</span>}
              {l.city && <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{l.city}, {l.state}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Mobile popup with improved positioning and boundary checking
function MobilePopup({ listing, onClose, markerPosition }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0, popupBelow: false })
  const popupRef = useRef(null)
  
  useEffect(() => { setImgIdx(0) }, [listing?.id])
  
  useEffect(() => {
    if (!markerPosition || !popupRef.current) return
    
    // Get popup dimensions
    const popupHeight = popupRef.current.offsetHeight
    const popupWidth = popupRef.current.offsetWidth
    
    // Check if popup would go off screen
    const wouldGoOffTop = markerPosition.y - popupHeight - 15 < 0
    const wouldGoOffRight = markerPosition.x + popupWidth / 2 > window.innerWidth
    const wouldGoOffLeft = markerPosition.x - popupWidth / 2 < 0
    
    // Adjust horizontal position
    let x = markerPosition.x
    if (wouldGoOffRight) x = window.innerWidth - popupWidth / 2 - 10
    if (wouldGoOffLeft) x = popupWidth / 2 + 10
    
    // Position above or below marker
    const popupBelow = wouldGoOffTop
    let y = popupBelow 
      ? markerPosition.y + 40  // below marker
      : markerPosition.y - 15   // above marker
    
    setAdjustedPosition({ x, y, popupBelow })
  }, [markerPosition])

  // Safety check
  if (!listing || !markerPosition || typeof markerPosition.x !== 'number' || typeof markerPosition.y !== 'number') return null

  const col = PRICE_COLOR(listing.price_per_night || 0)
  const images = listing?.images ?? []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)
  const rating = listing.rating ?? listing.avg_rating

  const popupStyle = {
    position: 'absolute',
    zIndex: 1000,
    top: adjustedPosition.popupBelow ? `${adjustedPosition.y}px` : 'auto',
    bottom: adjustedPosition.popupBelow ? 'auto' : 'auto',
    left: `${adjustedPosition.x}px`,
    transform: 'translateX(-50%)',
    width: 260,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  }

  // Arrow pointing to marker
  const arrowStyle = adjustedPosition.popupBelow ? {
    position: 'absolute',
    top: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '6px solid white',
  } : {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid white',
  }

  return (
    <div ref={popupRef} style={popupStyle}>
      <div style={{
        position: 'relative', width: '100%',
        height: 120,
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
        
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: col.bg, color: '#fff',
          padding: '2px 6px', borderRadius: 12,
          fontSize: 10, fontWeight: 700,
        }}>
          ${listing.price_per_night?.toLocaleString()}<span style={{ fontSize: 8 }}>/nt</span>
        </div>

        {rating != null && (
          <div style={{
            position: 'absolute', top: 6, right: 28,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '2px 6px', borderRadius: 12,
            fontSize: 10, fontWeight: 600,
          }}>
            ★ {Number(rating).toFixed(1)}
          </div>
        )}
        
        <button onClick={onClose} style={{
          position: 'absolute', top: 4, right: 4,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none',
        }}>×</button>
      </div>

      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#111', marginBottom: 2 }}>
          {listing.title.length > 30 ? listing.title.substring(0, 27) + '...' : listing.title}
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
          {listing.city}, {listing.state}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {listing.bedrooms != null && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6' }}>
              {listing.bedrooms} bd
            </span>
          )}
          {listing.max_guests != null && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6' }}>
              {listing.max_guests} guests
            </span>
          )}
          {listing.type && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6' }}>
              {listing.type === 'Entire place' ? 'Entire' : listing.type === 'Private room' ? 'Private' : 'Shared'}
            </span>
          )}
        </div>
        <a href={`/stays/${listing.id}`} style={{
          display: 'block', textAlign: 'center',
          padding: '6px', borderRadius: 6,
          background: '#e8590c', color: '#fff',
          fontSize: 11, fontWeight: 500,
          textDecoration: 'none',
        }}>View →</a>
      </div>
      
      <div style={arrowStyle} />
    </div>
  )
}

// Desktop popup (simpler, centered at bottom)
function DesktopPopup({ listing, onClose }) {
  const [imgIdx, setImgIdx] = useState(0)
  useEffect(() => { setImgIdx(0) }, [listing?.id])
  if (!listing) return null

  const col = PRICE_COLOR(listing.price_per_night || 0)
  const images = listing?.images ?? []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)
  const rating = listing.rating ?? listing.avg_rating

  return (
    <div style={{
      position: 'absolute', zIndex: 1000, bottom: 24, left: '50%',
      transform: 'translateX(-50%)', width: 288,
      background: '#fff', borderRadius: 18,
      boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
      overflow: 'hidden', border: '1px solid #e5e7eb',
    }}>
      <div style={{
        position: 'relative', width: '100%', height: 160,
        background: '#f3f4f6', overflow: 'hidden'
      }}>
        {activeUrl ? (
          <img src={activeUrl} alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af' }}>
            No photo
          </div>
        )}
        
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: col.bg, color: '#fff',
          padding: '4px 12px', borderRadius: 20,
          fontSize: 13, fontWeight: 700,
        }}>
          ${listing.price_per_night?.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400 }}>/nt</span>
        </div>

        {rating != null && (
          <div style={{
            position: 'absolute', top: 10, right: 42,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '4px 9px', borderRadius: 20,
            fontSize: 12, fontWeight: 600,
          }}>
            ★ {Number(rating).toFixed(1)}
          </div>
        )}
        
        <button onClick={onClose} style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
        
        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 9, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 5
          }}>
            {images.slice(0, 6).map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} style={{
                width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none', cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>
        )}
      </div>
      
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 2 }}>
          {listing.title}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 9 }}>
          {listing.city}, {listing.state}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            listing.bedrooms != null ? `${listing.bedrooms} bed` : null,
            listing.bathrooms != null ? `${listing.bathrooms} bath` : null,
            listing.max_guests != null ? `${listing.max_guests} guests` : null,
            listing.type ?? null,
          ].filter(Boolean).map(t => (
            <span key={t} style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 8,
              background: '#f3f4f6', color: '#374151'
            }}>{t}</span>
          ))}
        </div>
        <a href={`/stays/${listing.id}`} style={{
          display: 'block', textAlign: 'center',
          padding: '9px', borderRadius: 10,
          background: '#e8590c', color: '#fff',
          fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>View stay</a>
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
  const [markerPosition, setMarkerPosition] = useState(null)
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price_per_night || 0)) : 1000
  const [filters, setFilters] = useState({ guests: 'Any', type: 'Any', maxPrice })
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
            let bgColor = '#e8590c', w = 30
            if (childCount > 10) { bgColor = '#dc2626'; w = 46 }
            else if (childCount > 5) { bgColor = '#ea580c'; w = 38 }
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

  // Update markers when filters change
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
      const marker = L.marker([l.lat, l.lng], { 
        icon: icon,
        tap: true,
        bubblingMouseEvents: false
      })
      
      // Improved click handler with position detection
      marker.on('click', (e) => {
        // Get marker position - works better on mobile
        let point
        try {
          // Try to get position from the click event itself first (more reliable on mobile)
          if (e.originalEvent && e.originalEvent.clientX) {
            point = { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
          } else {
            point = mapInstanceRef.current.latLngToContainerPoint([l.lat, l.lng])
          }
        } catch (err) {
          // Fallback to viewport center if everything fails
          point = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }
        setMarkerPosition({ x: point.x, y: point.y })
        setPopupListing(l)
        setActiveId(l.id)
      })
      
      markersRef.current[l.id] = marker
      cluster.addLayer(marker)
    })
  }, [filtered, isMapReady])

  // Handle marker scaling on hover/active
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement()
      if (!el) return
      const pill = el.querySelector('[class^="mpill"]')
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
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>Price / night</div>
        {[
          { color: '#0F6E56', label: 'Under $100' },
          { color: '#b45309', label: '$100 - $250' },
          { color: '#9a3412', label: '$250+' },
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
      >Fit all stays</button>

      {isMobile ? (
        <MobilePopup
          listing={popupListing}
          onClose={() => { setPopupListing(null); setActiveId(null); setMarkerPosition(null) }}
          markerPosition={markerPosition}
        />
      ) : (
        <DesktopPopup
          listing={popupListing}
          onClose={() => { setPopupListing(null); setActiveId(null) }}
        />
      )}
    </div>
  )

  // ── MOBILE: stats + filters + full-screen map (no sidebar) ───────────────
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

  // ── DESKTOP: stats + filters + sidebar + map ────────────────────────────
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