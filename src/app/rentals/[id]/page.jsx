'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { getListing } from '@/lib/api'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const TYPE_ICONS = {
  apartment: '🏢', house: '🏠', condo: '🏙', studio: '🛋', townhouse: '🏘'
}

const ROOM_CATEGORIES = [
  { key: 'all',      label: 'All Photos'  },
  { key: 'living',   label: 'Living Room' },
  { key: 'bedroom',  label: 'Bedroom'     },
  { key: 'bathroom', label: 'Bathroom'    },
  { key: 'kitchen',  label: 'Kitchen'     },
  { key: 'exterior', label: 'Exterior'    },
  { key: 'backyard', label: 'Backyard'    },
  { key: 'other',    label: 'Other'       },
]

// SVG icon components
function IconHome({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
}
function IconSofa({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10.5a2.5 2.5 0 015 0v1h8v-1a2.5 2.5 0 015 0V17H3v-6.5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 17v2m12-2v2"/></svg>
}
function IconBed({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10M21 7v10M3 12h18M3 7a2 2 0 012-2h14a2 2 0 012 2"/></svg>
}
function IconBath({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12h16v3a5 5 0 01-5 5H9a5 5 0 01-5-5v-3zM6 12V6a3 3 0 013-3 3 3 0 013 3"/></svg>
}
function IconKitchen({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6h18M3 10h18M5 6V4m14 2V4M5 20h14a2 2 0 002-2V10H3v8a2 2 0 002 2z"/></svg>
}
function IconExterior({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V10.85M19 21V10.85M12 3L2 10h20L12 3zM9 21v-6h6v6"/></svg>
}
function IconTree({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2L6 10h3l-3 6h5v4h2v-4h5l-3-6h3L12 2z"/></svg>
}
function IconPhoto({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4-4 3 3 4-5 5 6M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>
}
function IconMaximize({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
}
function IconMinimize({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m6-4v4m0-4h4m0 0l-5 5M4 20l5-5m-5 5v-4m0 4h4m6 0h4m0 0v-4m0 4l-5-5"/></svg>
}
function IconShare({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
}
function IconHeart({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
}

const ROOM_ICON_MAP = {
  all:      IconHome,
  living:   IconSofa,
  bedroom:  IconBed,
  bathroom: IconBath,
  kitchen:  IconKitchen,
  exterior: IconExterior,
  backyard: IconTree,
  other:    IconPhoto,
}

const AUTO_CATEGORIES = ['living', 'kitchen', 'bedroom', 'bathroom', 'bedroom', 'exterior', 'backyard', 'other']

function getCategory(img, idx) {
  if (img.category) return img.category
  return AUTO_CATEGORIES[idx % AUTO_CATEGORIES.length]
}

// ── Ken Burns Slideshow ───────────────────────────────────────────────────────
function KenBurnsSlideshow({ images, onOpenGallery }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev]       = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const timerRef              = useRef(null)

  const animations = [
    'kenburns-zoom-in', 'kenburns-zoom-out',
    'kenburns-pan-left', 'kenburns-pan-right', 'kenburns-pan-up',
  ]
  const [anim, setAnim] = useState(animations[0])

  const goTo = useCallback((index) => {
    setPrev(current)
    setCurrent(index)
    setAnim(animations[Math.floor(Math.random() * animations.length)])
    setAnimKey(k => k + 1)
  }, [current])

  const goNext = useCallback(() => goTo((current + 1) % images.length), [current, images.length, goTo])
  const goPrev = useCallback(() => goTo((current - 1 + images.length) % images.length), [current, images.length, goTo])

  useEffect(() => {
    if (images.length <= 1) return
    timerRef.current = setTimeout(goNext, 5000)
    return () => clearTimeout(timerRef.current)
  }, [current, goNext, images.length])

  if (images.length === 0) return null

  return (
    <div className="relative h-[280px] sm:h-[380px] md:h-[480px] w-full overflow-hidden rounded-2xl bg-gray-900 group">

      <style>{`
        @keyframes kenburns-zoom-in  { from{transform:scale(1) translate(0,0)}         to{transform:scale(1.12) translate(-1%,-1%)} }
        @keyframes kenburns-zoom-out { from{transform:scale(1.12) translate(-1%,-1%)}  to{transform:scale(1) translate(0,0)} }
        @keyframes kenburns-pan-left { from{transform:scale(1.08) translate(2%,0)}     to{transform:scale(1.08) translate(-2%,0)} }
        @keyframes kenburns-pan-right{ from{transform:scale(1.08) translate(-2%,0)}    to{transform:scale(1.08) translate(2%,0)} }
        @keyframes kenburns-pan-up   { from{transform:scale(1.08) translate(0,2%)}     to{transform:scale(1.08) translate(0,-2%)} }
        .kb-slide { animation-duration:5.2s; animation-timing-function:ease-in-out; animation-fill-mode:both; will-change:transform; }
      `}</style>

      {images.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            zIndex: i === current ? 2 : (i === prev ? 1 : 0),
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          {img?.url ? (
            <img
              src={img.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover kb-slide"
              style={{ animationName: i === current ? anim : 'none', animationPlayState: i === current ? 'running' : 'paused' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
              <span className="text-9xl">{TYPE_ICONS['apartment']}</span>
            </div>
          )}
        </div>
      ))}

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow text-gray-800 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow text-gray-800 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </>
      )}

      <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-5">
        <div className="flex gap-1.5">
          {images.slice(0, 8).map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i) }}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
          ))}
          {images.length > 8 && <span className="text-white/60 text-xs ml-1">+{images.length - 8}</span>}
        </div>

        <button onClick={() => onOpenGallery(0)}
          className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all border border-white/30">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/>
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/>
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={1.8}/>
            <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={1.8}/>
          </svg>
          See all photos ({images.length})
        </button>
      </div>
    </div>
  )
}

// ── Photo Gallery Modal (Zillow-style) ────────────────────────────────────────
function PhotoGalleryModal({ images, startIndex, onClose }) {
  const [current, setCurrentIdx] = useState(startIndex)
  const [zoomed, setZoomed]      = useState(false)
  const [origin, setOrigin]      = useState({ x: 50, y: 50 })
  const [pan, setPan]            = useState({ x: 0, y: 0 })
  const dragging                 = useRef(false)
  const dragStart                = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const galleryPaneRef           = useRef(null)
  const imgRef                   = useRef(null)

  const enterFullscreen = () => {
    const el = galleryPaneRef.current
    if (!el) return
    if (el.requestFullscreen)            el.requestFullscreen()
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen()
  }

  useEffect(() => { setZoomed(false); setPan({ x: 0, y: 0 }) }, [current])

  const handleImgClick = (e) => {
    if (dragging.wasDrag) { dragging.wasDrag = false; return }
    const rect = e.currentTarget.getBoundingClientRect()
    const ox = ((e.clientX - rect.left) / rect.width) * 100
    const oy = ((e.clientY - rect.top) / rect.height) * 100
    if (zoomed) {
      setZoomed(false)
      setPan({ x: 0, y: 0 })
    } else {
      setOrigin({ x: ox, y: oy })
      setPan({ x: 0, y: 0 })
      setZoomed(true)
    }
  }

  const handleMouseDown = (e) => {
    if (!zoomed) return
    e.preventDefault()
    dragging.current = true
    dragging.wasDrag = false
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }
  const handleMouseMove = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.wasDrag = true
    setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy })
  }
  const handleMouseUp = () => { dragging.current = false }

  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') { if (zoomed) { setZoomed(false); setPan({ x: 0, y: 0 }) } else onClose() }
      if (!zoomed && e.key === 'ArrowLeft')  setCurrentIdx(i => Math.max(0, i - 1))
      if (!zoomed && e.key === 'ArrowRight') setCurrentIdx(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = '' }
  }, [onClose, zoomed, images.length])

  const currentImg = images[current]
  const roomLabel = currentImg ? (ROOM_CATEGORIES.find(c => c.key === getCategory(currentImg, current))?.label ?? 'Photo') : ''

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <span className="text-xs sm:text-sm text-gray-500">{current + 1} of {images.length} photos</span>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button onClick={handleShare} className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-50">
            <IconShare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button onClick={() => setSaved(s => !s)} className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <IconHeart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${saved ? 'fill-red-500 stroke-red-500 scale-110' : ''}`} />
            <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="flex-1 bg-black relative overflow-hidden" ref={galleryPaneRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {currentImg?.url ? (
            <img ref={imgRef} key={current} src={currentImg.url} alt="" onMouseDown={handleMouseDown} onClick={handleImgClick}
              className={`absolute inset-0 w-full h-full select-none ${zoomed ? 'object-cover cursor-grab active:cursor-grabbing' : 'object-cover cursor-zoom-in'}`}
              style={{
                transform: zoomed ? `scale(2.2) translate(${pan.x / 2.2}px, ${pan.y / 2.2}px)` : 'scale(1) translate(0,0)',
                transformOrigin: zoomed ? `${origin.x}% ${origin.y}%` : '50% 50%',
                transition: dragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                animation: 'galleryFadeIn 0.35s ease',
                willChange: 'transform',
              }}
              draggable={false} />
          ) : (<div className="flex items-center justify-center h-full"><IconPhoto className="w-16 h-16 text-gray-600 opacity-30" /></div>)}

          {!zoomed && currentImg?.url && (
            <button onClick={enterFullscreen} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1 sm:gap-1.5 bg-black/50 hover:bg-black/70 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
              <IconMaximize className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>
          )}
          {zoomed && (
            <button onClick={() => { setZoomed(false); setPan({ x: 0, y: 0 }) }} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1 sm:gap-1.5 bg-black/50 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
              <IconMinimize className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Zoom out
            </button>
          )}
          {images.length > 1 && (
            <>
              <button onClick={() => { setZoomed(false); setPan({ x: 0, y: 0 }); setCurrentIdx(i => Math.max(0, i - 1)) }} disabled={current === 0}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors flex items-center justify-center disabled:opacity-20 z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button onClick={() => { setZoomed(false); setPan({ x: 0, y: 0 }); setCurrentIdx(i => Math.min(images.length - 1, i + 1)) }} disabled={current === images.length - 1}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors flex items-center justify-center disabled:opacity-20 z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </>
          )}
        </div>

        <div className="w-full md:w-72 border-l bg-white flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => { setCurrentIdx(i); setZoomed(false) }}
                  className={`aspect-square rounded-lg overflow-hidden transition-all ${i === current ? 'ring-2 ring-blue-500 ring-offset-1 opacity-100' : 'opacity-70 hover:opacity-90'}`}>
                  {img.url ? (<img src={img.url} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-gray-100 flex items-center justify-center"><IconPhoto className="w-6 h-6 text-gray-300" /></div>)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes galleryFadeIn { from{opacity:0} to{opacity:1} }`}</style>
    </div>
  )
}

// ── Map ───────────────────────────────────────────────────────────────────────
function PropertyMap({ address, city, state }) {
  const query = encodeURIComponent(`${address ? address + ', ' : ''}${city}, ${state}`)
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&z=15`

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Location</h3>
        <a href={`https://maps.google.com/?q=${query}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">
          Open in Maps ↗
        </a>
      </div>
      <div className="h-48 sm:h-56 w-full">
        <iframe title="Property location" src={embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-500 flex items-center gap-2 border-t">
        <span>📍</span>
        <span>{address ? `${address}, ` : ''}{city}, {state}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RentalDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [applying, setApplying] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStart, setGalleryStart] = useState(0)

  const { data: listing, isLoading } = useSWR(`listing-${id}`, () => getListing(id).then(r => r.data))

  const handleApply = () => router.push(`/apply/${id}`)

  const openGallery = (index = 0) => {
    setGalleryStart(index)
    setGalleryOpen(true)
  }

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-[280px] sm:h-[380px] md:h-[480px] bg-gray-100 rounded-2xl" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto" />
      </div>
    </div>
  )

  if (!listing) return (
    <div className="text-center py-20 px-4">
      <p className="text-gray-500">Listing not found.</p>
      <Link href="/rentals" className="text-brand-500 mt-4 inline-block">← Back to rentals</Link>
    </div>
  )

  const { title, city, state, address, price, bedrooms, bathrooms, sqft, type, description, amenities, available_from, images = [] } = listing
  const moveInCost = price * 2

  const displayImages = images.length > 0 ? images : [
    { url: null, category: 'living' }, { url: null, category: 'kitchen' }, { url: null, category: 'bedroom' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {galleryOpen && (<PhotoGalleryModal images={displayImages} startIndex={galleryStart} onClose={() => setGalleryOpen(false)} />)}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/rentals" className="text-xs sm:text-sm text-gray-500 hover:text-brand-500">
          ← Back to rentals
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
        {displayImages.some(img => img.url) ? (
          <KenBurnsSlideshow images={displayImages} onOpenGallery={openGallery} />
        ) : (
          <div className="h-[280px] sm:h-[380px] md:h-[480px] bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden" onClick={() => openGallery(0)}>
            <span className="text-7xl sm:text-9xl mb-2 sm:mb-4">{TYPE_ICONS[type] ?? '🏠'}</span>
            <p className="text-brand-400 text-xs sm:text-sm font-medium">No photos yet</p>
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex gap-2">
              <span className="bg-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full capitalize font-medium shadow text-gray-700">{type}</span>
              <span className="bg-brand-500 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">For Rent</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{title}</h1>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6 break-words">📍 {address ? `${address}, ` : ''}{city}, {state}</p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: 'Bedrooms', value: bedrooms, icon: '🛏' },
                { label: 'Bathrooms', value: bathrooms, icon: '🚿' },
                { label: 'Square Feet', value: sqft?.toLocaleString(), icon: '📐' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{s.icon}</div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">About this rental</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{description}</p>
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {(amenities ?? []).map((a) => (
                  <div key={a} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <span className="text-green-500 font-bold">✓</span> {a}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <PropertyMap address={address} city={city} state={state} />
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Estimated Move-in Costs</h3>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { label: "First month's rent", amount: price },
                  { label: 'Security deposit (est.)', amount: price },
                  { label: 'Application fee', amount: 50 },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-900">${item.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 sm:pt-3 flex justify-between font-semibold text-sm sm:text-base">
                  <span>Estimated total</span>
                  <span className="text-brand-500">${(moveInCost + 50)?.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3">
                * Security deposit may vary. Application fee is refundable if not approved within 7 days.
              </p>
            </div>
          </div>

          {/* Right - apply card - hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="bg-white border rounded-2xl p-4 sm:p-6 sticky top-24 shadow-sm">
              <div className="mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-brand-500">${price?.toLocaleString()}</span>
                <span className="text-gray-400 text-sm sm:text-base">/month</span>
              </div>

              {available_from && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 bg-gray-50 rounded-lg p-2 sm:p-3">
                  <span>📅</span>
                  <span>Available {new Date(available_from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs p-2 sm:p-3 rounded-lg mb-4 sm:mb-5 leading-relaxed">
                <strong>$50 application fee</strong> — Covers credit & background check. Fully refundable if not approved within 7 days.
              </div>

              <div className="mb-4 sm:mb-5 space-y-2">
                {['Submit your application', 'We review within 24 hours', 'Get approved & sign lease'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-600">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>

              {isSignedIn ? (
                <button onClick={handleApply} disabled={applying}
                  className="w-full py-2.5 sm:py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-brand-600 disabled:opacity-50 transition-colors">
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              ) : (
                <button onClick={() => { window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/apply/${id}`)}` }}
                  className="w-full py-2.5 sm:py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-brand-600 transition-colors">
                  Sign in to Apply
                </button>
              )}

              <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3">No commitment until approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING APPLY BAR - visible only on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-brand-500">
              <span className="text-xl font-bold">${price?.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            {available_from && (
              <p className="text-xs text-gray-400 mt-0.5">
                Available {new Date(available_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isSignedIn ? (
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-md"
              >
                {applying ? '...' : 'Apply'}
              </button>
            ) : (
              <button
                onClick={() => { window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/apply/${id}`)}` }}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md"
              >
                Sign in to Apply
              </button>
            )}
          </div>
        </div>
        <div className="bg-amber-50 px-4 py-1.5 text-center">
          <p className="text-amber-700 text-[10px] font-medium">
            $50 application fee · Refundable if not approved
          </p>
        </div>
      </div>
    </div>
  )
}