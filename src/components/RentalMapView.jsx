'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Images are stored as objects with .url — same as the detail page: images[0]?.url
const getCoverImage = (listing) =>
  listing?.images?.[0]?.url ?? listing?.coverImage ?? null

const PRICE_COLOR = (price) => {
  if (price < 2000) return { bg: '#0F6E56', border: '#1D9E75', label: '#E1F5EE' }
  if (price < 3000) return { bg: '#854F0B', border: '#BA7517', label: '#FAEEDA' }
  return { bg: '#A32D2D', border: '#D85A30', label: '#FAECE7' }
}

// Marker HTML with white outline ring
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

function StatsBar({ listings }) {
  const avg = listings.length
    ? Math.round(listings.reduce((s, l) => s + (l.price || 0), 0) / listings.length)
    : 0
  const minP = listings.length ? Math.min(...listings.map(l => l.price || 0)) : 0
  const maxP = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 0
  return (
    <div className="flex items-center gap-2 p-2 sm:p-3 border-b bg-white flex-wrap text-xs sm:text-sm">
      <span className="font-semibold text-gray-900 mr-1">{listings.length} rentals</span>
      {[
        { label: 'avg', value: `$${avg.toLocaleString()}/mo` },
        { label: 'min', value: `$${minP.toLocaleString()}` },
        { label: 'max', value: `$${maxP.toLocaleString()}` },
      ].map(s => (
        <span key={s.label} className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 border">
          <span className="text-gray-400">{s.label} </span>
          <span className="font-medium text-gray-700">{s.value}</span>
        </span>
      ))}
    </div>
  )
}

function FilterBar({ filters, setFilters, listings }) {
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  return (
    <>
      {/* Mobile filter button */}
      <div className="block md:hidden p-2 border-b bg-gray-50">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters {Object.values(filters).some(v => v !== 'Any' && v !== maxPrice) ? '(active)' : ''}
        </button>
      </div>

      {/* Mobile filters drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden" onClick={() => setShowMobileFilters(false)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Max Price: ${filters.maxPrice}</label>
                <input type="range" min={500} max={maxPrice} step={100}
                  value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
                  className="w-full accent-brand-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Beds</label>
                <div className="flex gap-2 flex-wrap">
                  {BED_OPTIONS.map(b => (
                    <button key={b} onClick={() => setFilters(f => ({ ...f, beds: b }))}
                      className={`px-3 py-1.5 rounded-lg text-sm ${filters.beds === b ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Baths</label>
                <div className="flex gap-2 flex-wrap">
                  {BATH_OPTIONS.map(b => (
                    <button key={b} onClick={() => setFilters(f => ({ ...f, baths: b }))}
                      className={`px-3 py-1.5 rounded-lg text-sm ${filters.baths === b ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setFilters({ beds: 'Any', baths: 'Any', maxPrice }); setShowMobileFilters(false) }}
                className="w-full py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop filter bar */}
      <div className="hidden md:flex items-center gap-2 p-2 border-b bg-gray-50 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Filters:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs">{filters.maxPrice >= maxPrice ? 'Any price' : `≤ $${filters.maxPrice}`}</span>
          <input type="range" min={500} max={maxPrice} step={100}
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            className="w-20 accent-brand-500" />
        </div>
        {BED_OPTIONS.map(b => (
          <button key={b} onClick={() => setFilters(f => ({ ...f, beds: b }))}
            className={`text-[11px] px-2 py-1 rounded-full ${filters.beds === b ? 'bg-brand-500 text-white' : 'bg-white border'}`}>
            {b}
          </button>
        ))}
        {BATH_OPTIONS.map(b => (
          <button key={b} onClick={() => setFilters(f => ({ ...f, baths: b }))}
            className={`text-[11px] px-2 py-1 rounded-full ${filters.baths === b ? 'bg-brand-500 text-white' : 'bg-white border'}`}>
            {b}
          </button>
        ))}
        {(filters.beds !== 'Any' || filters.baths !== 'Any' || filters.maxPrice < maxPrice) && (
          <button onClick={() => setFilters({ beds: 'Any', baths: 'Any', maxPrice })}
            className="text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-600">
            Clear
          </button>
        )}
      </div>
    </>
  )
}

function ListingSidebar({ listings, activeId, onHover, onClick, onClose }) {
  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-xl z-20 overflow-y-auto md:relative md:shadow-none md:w-64 lg:w-72 border-r">
      <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center md:hidden">
        <h3 className="font-semibold text-sm">Listings ({listings.length})</h3>
        <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
      </div>
      {listings.length === 0 && (
        <div className="p-6 text-center text-gray-400 text-sm">No listings match your filters</div>
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
            className={`p-3 border-b cursor-pointer transition-colors ${active ? 'bg-brand-50 border-l-3 border-l-brand-500' : 'hover:bg-gray-50'}`}
          >
            {cover ? (
              <img src={cover} alt={l.title} className="w-full h-16 object-cover rounded-lg mb-2" />
            ) : (
              <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs">No photo</div>
            )}
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm">${l.price?.toLocaleString()}<span className="font-normal text-gray-400 text-[10px]">/mo</span></span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">{l.price < 2000 ? 'Budget' : l.price < 3000 ? 'Mid' : 'Premium'}</span>
            </div>
            <div className="text-xs text-gray-700 truncate mt-1">{l.title}</div>
            <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
              <span>{l.bedrooms} bd</span>
              <span>{l.bathrooms} ba</span>
              <span className="ml-auto">{l.city}</span>
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
  const images = listing?.images ?? []
  const activeUrl = images[imgIdx]?.url ?? getCoverImage(listing)

  return (
    <div className="absolute z-[1000] bottom-6 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-xl overflow-hidden border animate-pop-in">
      <div className="relative h-40 bg-gray-100">
        {activeUrl ? (
          <img src={activeUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No photo</div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">${listing.price?.toLocaleString()}<span className="text-[10px] font-normal">/mo</span></div>
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center">✕</button>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, 6).map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`h-1 rounded-full transition-all ${i === imgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm line-clamp-1">{listing.title}</div>
        <div className="text-xs text-gray-500 mb-2">{listing.city}, {listing.state}</div>
        <div className="flex gap-2 mb-3 text-[10px] flex-wrap">
          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{listing.bedrooms} bed</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{listing.bathrooms} bath</span>
          {listing.sqft && <span className="px-2 py-0.5 bg-gray-100 rounded-full">{listing.sqft} sqft</span>}
        </div>
        <a href={`/rentals/${listing.id}`} className="block text-center py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold">View full listing</a>
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
  const [showSidebar, setShowSidebar] = useState(false)
  const maxPrice = listings.length ? Math.max(...listings.map(l => l.price || 0)) : 5000
  const [filters, setFilters] = useState({ beds: 'Any', baths: 'Any', maxPrice })
  const filtered = applyFilters(listings, filters)

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

        const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
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
            let size = 'small';
            let bgColor = '#3b5bdb';
            if (childCount > 10) { size = 'large'; bgColor = '#dc2626' }
            else if (childCount > 5) { size = 'medium'; bgColor = '#e8590c' }
            const width = size === 'large' ? 46 : size === 'medium' ? 38 : 30;
            const fontSize = size === 'large' ? 14 : size === 'medium' ? 12 : 11;
            return L.divIcon({
              html: `<div style="background:${bgColor};width:${width}px;height:${width}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${fontSize}px;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white">${childCount}</div>`,
              className: '', iconSize: [width, width], iconAnchor: [width / 2, width / 2],
            })
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
    const addMarkers = () => {
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
    }
    addMarkers()
  }, [filtered, isMapReady])

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
    setShowSidebar(false)
  }, [])

  const handleSidebarHover = useCallback((id) => setActiveId(id), [])

  return (
    <div className="flex flex-col w-full h-[calc(100svh-160px)] min-h-[400px] font-sans">
      <StatsBar listings={filtered} />
      <FilterBar filters={filters} setFilters={setFilters} listings={listings} />

      <div className="relative flex-1 overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />

        {/* Mobile: Show listings button */}
        <button
          onClick={() => setShowSidebar(true)}
          className="absolute top-3 left-3 z-10 md:hidden bg-white border rounded-lg px-4 py-2 text-sm font-medium shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Listings ({filtered.length})
        </button>

        {/* Sidebar - slides in on mobile */}
        {showSidebar && (
          <div className="absolute inset-0 z-20 md:relative md:flex md:items-start">
            <div className="absolute inset-0 bg-black/30 md:hidden" onClick={() => setShowSidebar(false)} />
            <ListingSidebar
              listings={filtered}
              activeId={activeId}
              onHover={handleSidebarHover}
              onClick={handleSidebarClick}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        )}

        {/* Desktop sidebar - always visible */}
        <div className="hidden md:block absolute top-0 left-0 h-full z-10">
          <ListingSidebar
            listings={filtered}
            activeId={activeId}
            onHover={handleSidebarHover}
            onClick={handleSidebarClick}
            onClose={() => {}}
          />
        </div>

        {/* Price legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white border rounded-lg px-3 py-2 text-[10px] shadow-sm pointer-events-none">
          <div className="font-semibold text-xs mb-1">Price</div>
          {[
            { color: '#0F6E56', label: 'Under $2k' },
            { color: '#854F0B', label: '$2k - $3k' },
            { color: '#A32D2D', label: '$3k+' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-1.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
              <span>{r.label}</span>
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
          className="absolute top-3 right-3 z-10 bg-white border rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-gray-50"
        >
          Fit all
        </button>

        <MapPopup listing={popupListing} onClose={() => { setPopupListing(null); setActiveId(null) }} />
      </div>
    </div>
  )
}