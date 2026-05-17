'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { getListing, getListings, createBooking, validateCoupon, incrementCouponUse } from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ReviewsSection from '@/components/ReviewsSection'
import StayCard from '@/components/StayCard'

// ── SVG Icons ─────────────────────────────────────────────────────────────────
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
function IconGrid({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={1.8}/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={1.8}/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={1.8}/></svg>
}

// ── Photo Gallery Modal ────────────────────────────────────────────────────────
function PhotoGalleryModal({ images, startIndex, onClose }) {
  const [current, setCurrentIdx] = useState(startIndex)
  const [zoomed, setZoomed]      = useState(false)
  const [origin, setOrigin]      = useState({ x: 50, y: 50 })
  const [pan, setPan]            = useState({ x: 0, y: 0 })
  const dragging                 = useRef(false)
  const dragStart                = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const galleryPaneRef           = useRef(null)
  const imgRef                   = useRef(null)
  const [saved, setSaved]        = useState(false)
  const [copied, setCopied]      = useState(false)

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
    const ox = ((e.clientX - rect.left) / rect.width)  * 100
    const oy = ((e.clientY - rect.top)  / rect.height) * 100
    if (zoomed) {
      setZoomed(false); setPan({ x: 0, y: 0 })
    } else {
      setOrigin({ x: ox, y: oy }); setPan({ x: 0, y: 0 }); setZoomed(true)
    }
  }

  const handleMouseDown = (e) => {
    if (!zoomed) return
    e.preventDefault()
    dragging.current = true; dragging.wasDrag = false
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

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {}
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
              className={`absolute inset-0 w-full h-full select-none ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
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
                <button key={i} onClick={() => { setCurrentIdx(i); setZoomed(false); setPan({ x: 0, y: 0 }) }}
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

// ── Airbnb-style Photo Grid (with swipe on mobile) ───────────────────────────
function PhotoGrid({ images, onOpen }) {
  const hasImages = images.length > 0
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  // Only show swipe UI on mobile if there are multiple images
  const showSwipe = images.length > 1

  return (
    <div className="relative mb-6 sm:mb-8">
      {/* Mobile: Swipeable single image */}
      <div className="block sm:hidden">
        {hasImages ? (
          <div
            className="relative rounded-xl overflow-hidden bg-gray-100"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentIndex]?.url}
              alt=""
              className="w-full h-[280px] object-cover"
            />
            {/* Image counter */}
            {showSwipe && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}
            {/* Swipe indicators */}
            {showSwipe && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
            {/* Show all photos button */}
            <button
              onClick={() => onOpen(0)}
              className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-2 py-1.5 rounded-lg shadow-sm"
            >
              <IconGrid className="w-3 h-3" />
              All {images.length}
            </button>
          </div>
        ) : (
          <div
            className="relative bg-gray-100 rounded-xl h-[280px] flex items-center justify-center cursor-pointer"
            onClick={() => onOpen(0)}
          >
            <IconPhoto className="w-12 h-12 text-gray-300" />
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              No photos
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Original 2x2 grid layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 h-[240px] sm:h-[340px] rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="relative bg-gray-100 cursor-pointer overflow-hidden group" onClick={() => onOpen(0)}>
            {images[0]?.url ? (
              <img src={images[0].url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100"><IconPhoto className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" /></div>
            )}
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4].map((slot, idx) => (
              <div
                key={slot}
                className="relative bg-gray-100 cursor-pointer overflow-hidden group"
                onClick={() => onOpen(hasImages ? Math.min(slot, images.length - 1) : 0)}
              >
                {images[slot]?.url ? (
                  <img src={images[slot].url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100"><IconPhoto className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" /></div>
                )}
              </div>
            ))}
          </div>
        </div>
        {hasImages && (
          <button
            onClick={() => onOpen(0)}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1 sm:gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-[10px] sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2.5 rounded-lg sm:rounded-xl shadow-sm transition-all hover:shadow-md"
          >
            <IconGrid className="w-3 h-3 sm:w-4 sm:h-4" />
            Show all photos
          </button>
        )}
      </div>
    </div>
  )
}

// ── Map ───────────────────────────────────────────────────────────────────────
function PropertyMap({ address, city, state }) {
  const query = encodeURIComponent(`${address ? address + ', ' : ''}${city}, ${state}`)
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Location</h3>
        <a href={`https://maps.google.com/?q=${query}`} target="_blank" rel="noopener noreferrer" className="text-xs text-stay-500 hover:underline">
          Open in Maps ↗
        </a>
      </div>
      <div className="h-48 sm:h-56 w-full">
        <iframe title="Property location" src={`https://maps.google.com/maps?q=${query}&output=embed&z=15`} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-500 flex items-center gap-2 border-t">
        <span>📍</span>
        <span>{address ? `${address}, ` : ''}{city}, {state}</span>
      </div>
    </div>
  )
}

// ── Availability Calendar ─────────────────────────────────────────────────────
function AvailabilityCalendar({ minNights = 1, blockedDates = [], checkIn, checkOut, onChange }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selecting, setSelecting] = useState('checkin')
  const [hovered, setHovered] = useState(null)

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()
  const toDate = (str) => str ? new Date(str + 'T00:00:00') : null
  const toStr = (d) => d.toISOString().split('T')[0]
  const ciDate = toDate(checkIn)
  const coDate = toDate(checkOut)
  const isBlocked = (d) => blockedDates.some(b => toStr(d) === b)
  const isPast = (d) => d < today

  const isInRange = (d) => {
    const end = selecting === 'checkout' && hovered ? hovered : coDate
    if (!ciDate || !end) return false
    return d > ciDate && d < end
  }

  const handleDayClick = (d) => {
    if (isPast(d) || isBlocked(d)) return
    if (selecting === 'checkin') {
      onChange({ checkIn: toStr(d), checkOut: '' }); setSelecting('checkout')
    } else {
      if (d <= ciDate) { onChange({ checkIn: toStr(d), checkOut: '' }); setSelecting('checkout') }
      else { onChange({ checkIn, checkOut: toStr(d) }); setSelecting('checkin') }
    }
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }
  const days = daysInMonth(viewYear, viewMonth)
  const startPad = firstDayOfMonth(viewYear, viewMonth)

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50">
        <button onClick={prevMonth} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 text-sm">‹</button>
        <span className="font-semibold text-xs sm:text-sm text-gray-800">{monthNames[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 text-center border-b">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (<div key={d} className="py-1 sm:py-2 text-[10px] sm:text-xs font-medium text-gray-400">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 text-center p-1 sm:p-2 gap-y-0.5 sm:gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = new Date(viewYear, viewMonth, i + 1)
          const str = toStr(d)
          const past = isPast(d); const blocked = isBlocked(d)
          const isCI = checkIn === str; const isCO = checkOut === str
          const inRange = isInRange(d)
          let cls = 'relative mx-auto w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs transition-all '
          if (past || blocked) cls += 'text-gray-300 cursor-not-allowed line-through'
          else if (isCI || isCO) cls += 'bg-stay-500 text-white font-bold cursor-pointer'
          else if (inRange) cls += 'bg-stay-100 text-stay-700 cursor-pointer rounded-none'
          else cls += 'hover:bg-gray-100 text-gray-700 cursor-pointer'
          return (
            <div key={str} className="flex items-center justify-center py-0.5">
              <button className={cls} onClick={() => handleDayClick(d)} onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)} disabled={past || blocked}>
                {i + 1}
              </button>
            </div>
          )
        })}
      </div>
      <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t bg-gray-50 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-stay-500 inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-200 inline-block" /> Unavailable</span>
        {minNights > 1 && <span>Min. {minNights} nights</span>}
      </div>
    </div>
  )
}

// ── House Rules ───────────────────────────────────────────────────────────────
function HouseRules({ rules }) {
  const defaults = [
    { icon: '🕐', label: 'Check-in',    value: 'After 3:00 PM'        },
    { icon: '🕙', label: 'Checkout',    value: 'Before 11:00 AM'      },
    { icon: '🚭', label: 'Smoking',     value: 'Not allowed'          },
    { icon: '🐾', label: 'Pets',        value: 'Not allowed'          },
    { icon: '🎉', label: 'Parties',     value: 'Not allowed'          },
    { icon: '🔕', label: 'Quiet hours', value: '10:00 PM – 8:00 AM'  },
  ]
  const items = rules ?? defaults
  return (
    <div className="pb-6 border-b mb-6">
      <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">House rules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {items.map((r, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="text-lg sm:text-xl">{r.icon}</span>
            <div>
              <p className="text-gray-500 text-[10px] sm:text-xs">{r.label}</p>
              <p className="text-gray-800 font-medium text-xs sm:text-sm">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Similar Stays ─────────────────────────────────────────────────────────────
function SimilarStays({ currentId, city }) {
  const { data } = useSWR(city ? `similar-${city}` : null, () => getListings({ city, type: 'stays' }).then(r =>
    (r.data ?? []).filter(l => String(l.id) !== String(currentId)).slice(0, 3)))
  if (!data?.length) return null
  return (
    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-4 sm:mb-6">Similar stays in {city}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {data.map(l => <StayCard key={l.id} listing={l} />)}
      </div>
    </div>
  )
}

const Counter = ({ label, sub, value, setValue, min = 0 }) => (
  <div className="flex items-center justify-between py-4 border-b last:border-0">
    <div>
      <p className="font-medium text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => setValue(v => Math.max(min, v - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-lg">
        −
      </button>
      <span className="w-4 text-center text-sm font-medium">{value}</span>
      <button
        onClick={() => setValue(v => v + 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-600 text-lg">
        +
      </button>
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StayDetail() {
  const { id } = useParams()
  const { isSignedIn, user } = useUser()

  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests]     = useState(1)
  const [booking, setBooking]   = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [validating, setValidating] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [galleryOpen, setGalleryOpen]   = useState(false)
  const [galleryStart, setGalleryStart] = useState(0)
  const [useCalendar, setUseCalendar]   = useState(false)
  const [activeGuestPicker, setActiveGuestPicker] = useState(false)
  const [adults, setAdults] = useState(0)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)
  const [activeCouponInput, setActiveCouponInput] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const totalGuests = adults + children

  useEffect(() => {
    const ci = sessionStorage.getItem('stayCheckIn')
    const co = sessionStorage.getItem('stayCheckOut')
    const g  = sessionStorage.getItem('stayGuests')
    if (ci) setCheckIn(ci)
    if (co) setCheckOut(co)
    if (g)  setGuests(parseInt(g))
    sessionStorage.removeItem('stayCheckIn')
    sessionStorage.removeItem('stayCheckOut')
    sessionStorage.removeItem('stayGuests')
  }, [])

  const { data: listing, isLoading } = useSWR(`stay-${id}`, () => getListing(id).then(r => r.data))

  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 0
  const subtotal = nights * (listing?.price_per_night ?? 0)
  const cleaningFee = 45
  const serviceFee = Math.round(subtotal * 0.12)
  const discount = coupon ? Math.round((subtotal + cleaningFee + serviceFee) * coupon.discount_percent / 100) : 0
  const total = subtotal + cleaningFee + serviceFee - discount

  const cancellationDeadline = checkIn ? new Date(new Date(checkIn).getTime() - 48 * 3600 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : null

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setValidating(true)
    setCouponError('')
    setCoupon(null)
    try {
      const { data } = await validateCoupon(couponCode)
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('This coupon has expired.')
        return
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        setCouponError('This coupon has reached its maximum uses.')
        return
      }
      setCoupon(data)
    } catch {
      setCouponError('Invalid coupon code.')
    } finally {
      setValidating(false)
    }
  }  
  const handleBook = async () => {
    if (!checkIn || !checkOut) return toast.error('Please select dates first.')
    if (nights < (listing?.min_nights ?? 1)) return toast.error(`Minimum stay is ${listing.min_nights} nights.`)
    setBooking(true)
    try {
      const { data: newBooking } = await createBooking({
        listing_id: id, user_id: user?.id,
        full_name: user?.fullName ?? '',
        email: user?.primaryEmailAddress?.emailAddress ?? '',
        check_in: checkIn, check_out: checkOut, guests, nights,
        price_per_night: listing.price_per_night,
        subtotal, cleaning_fee: cleaningFee, service_fee: serviceFee,
        total_price: total, status: 'pending', payment_status: 'pending',
      })
      if (coupon) {
        await incrementCouponUse(coupon.id)
      }      
      const res = await fetch('/api/checkout-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_title: listing.title, total, nights, booking_id: newBooking.id }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e) {
      console.error(e); toast.error('Failed to process booking. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) { try { await navigator.share({ title: listing?.title, url }); return } catch {} }
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const openGallery = (index = 0) => { setGalleryStart(index); setGalleryOpen(true) }

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-2/3" />
        <div className="h-[280px] sm:h-[420px] bg-gray-100 rounded-2xl" />
      </div>
    </div>
  )

  if (!listing) return (
    <div className="text-center py-20 px-4">
      <p className="text-gray-500">Stay not found.</p>
      <Link href="/stays" className="text-stay-500 mt-4 inline-block">← Back to stays</Link>
    </div>
  )

  const { title, city, state, address, price_per_night, bedrooms, bathrooms, sqft, type, description, amenities, min_nights, max_nights, images = [], house_rules, blocked_dates = [] } = listing

  return (
    <div className="bg-white min-h-screen pb-20">
      {galleryOpen && images.length > 0 && (<PhotoGalleryModal images={images} startIndex={galleryStart} onClose={() => setGalleryOpen(false)} />)}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Link href="/stays" className="text-xs sm:text-sm text-gray-500 hover:text-stay-500 mb-3 sm:mb-4 inline-block">← Back to stays</Link>

        <div className="flex items-start justify-between mb-1 gap-2 sm:gap-4 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1">{title}</h1>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 mt-1">
            <button onClick={handleShare} className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-50">
              <IconShare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Share
            </button>
            <button onClick={() => { if (!isSignedIn) return toast.error('Sign in to save stays.'); setSaved(s => !s); toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist ♥') }}
              className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <IconHeart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${saved ? 'fill-red-500 stroke-red-500' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 flex-wrap">
          <span>⭐ 4.92 · 38 reviews</span>
          <span>·</span>
          <span>📍 {city}, {state}</span>
          <span>·</span>
          <span className="capitalize">{type}</span>
        </div>

        <PhotoGrid images={images} onOpen={openGallery} />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left column */}
          <div className="flex-1">
            <div className="flex items-center justify-between pb-6 border-b mb-6">
              <div>
                <h2 className="font-semibold text-base sm:text-lg text-gray-900">{bedrooms === 0 ? 'Studio' : `${bedrooms} bedroom`} hosted by NestBridge</h2>
                <p className="text-gray-500 text-xs sm:text-sm">{bedrooms === 0 ? 'Studio' : `${bedrooms} bed${bedrooms > 1 ? 's' : ''}`} · {bathrooms} bath · {sqft} sqft</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stay-500 flex items-center justify-center text-white font-bold text-base sm:text-lg">N</div>
            </div>

            <div className="space-y-3 sm:space-y-4 pb-6 border-b mb-6">
              {[{ icon: '✨', title: 'Entire space', desc: "You'll have the whole place to yourself." }, { icon: '🔑', title: 'Self check-in', desc: 'Check yourself in with a keypad.' }, { icon: '⭐', title: 'Guest favourite', desc: 'One of the most loved stays in the area.' }].map(h => (
                <div key={h.title} className="flex gap-3 sm:gap-4">
                  <span className="text-xl sm:text-2xl">{h.icon}</span>
                  <div><p className="font-medium text-gray-900 text-sm sm:text-base">{h.title}</p><p className="text-gray-500 text-xs sm:text-sm">{h.desc}</p></div>
                </div>
              ))}
            </div>

            <div className="pb-6 border-b mb-6">
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{description}</p>
              {min_nights > 1 && (<p className="text-xs sm:text-sm text-gray-500 mt-3">Minimum stay: {min_nights} nights · Maximum: {max_nights} nights</p>)}
            </div>

            <div className="pb-6 border-b mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {(amenities ?? []).map(a => (<div key={a} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700"><span className="text-gray-400">✓</span>{a}</div>))}
              </div>
            </div>

            <div className="pb-6 border-b mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Select dates'}</h3>
                <button onClick={() => setUseCalendar(v => !v)} className="text-[10px] sm:text-xs text-stay-500 hover:underline">{useCalendar ? 'Use text inputs' : 'Use calendar'}</button>
              </div>
              {useCalendar ? (<AvailabilityCalendar minNights={min_nights} blockedDates={blocked_dates} checkIn={checkIn} checkOut={checkOut} onChange={({ checkIn: ci, checkOut: co }) => { setCheckIn(ci); setCheckOut(co) }} />) : (
                <div className="border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2">
                    <div className="p-2 sm:p-3 border-r"><p className="text-[10px] sm:text-xs font-bold text-gray-700 mb-1">CHECK-IN</p><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="text-xs sm:text-sm text-gray-700 outline-none w-full" /></div>
                    <div className="p-2 sm:p-3"><p className="text-[10px] sm:text-xs font-bold text-gray-700 mb-1">CHECKOUT</p><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="text-xs sm:text-sm text-gray-700 outline-none w-full" /></div>
                  </div>
                </div>
              )}
              {nights > 0 && checkIn && checkOut && (<p className="text-[10px] sm:text-xs text-gray-400 mt-2">{new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>)}
            </div>

            <HouseRules rules={house_rules} />

            <div className="pb-6 border-b mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">Cancellation policy</h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                <p className="font-medium text-green-800 text-xs sm:text-sm mb-1">✅ Free cancellation{cancellationDeadline ? ` before ${cancellationDeadline}` : ' up to 48 hours before check-in'}</p>
                <p className="text-green-700 text-[10px] sm:text-xs leading-relaxed">Cancel before check-in for a full refund. After that, the first night and service fee are non-refundable.</p>
              </div>
            </div>

            <div className="pb-6 border-b mb-6">
              <PropertyMap address={address} city={city} state={state} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-4 sm:mb-6">Reviews</h3>
              <ReviewsSection listingId={id} />
            </div>
          </div>

          {/* Desktop booking card - hidden on mobile */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="border rounded-2xl p-4 sm:p-6 sticky top-24 shadow-lg">
              <div className="flex items-baseline gap-1 mb-1"><span className="text-2xl font-bold text-gray-900">${price_per_night}</span><span className="text-gray-500 text-sm">/ night</span></div>
              <p className="text-xs text-green-600 font-medium mb-4">✅ Free cancellation{cancellationDeadline ? ` before ${cancellationDeadline}` : ''}</p>
              <div className="border rounded-xl overflow-hidden mb-3">
                <div className="grid grid-cols-2"><div className="p-2 sm:p-3 border-r"><p className="text-[10px] sm:text-xs font-bold text-gray-700 mb-1">CHECK-IN</p><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="text-xs sm:text-sm text-gray-700 outline-none w-full" /></div>
                <div className="p-2 sm:p-3"><p className="text-[10px] sm:text-xs font-bold text-gray-700 mb-1">CHECKOUT</p><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="text-xs sm:text-sm text-gray-700 outline-none w-full" /></div></div>
                <div className="border-t p-2 sm:p-3"><p className="text-[10px] sm:text-xs font-bold text-gray-700 mb-1">GUESTS</p><select value={guests} onChange={e => setGuests(Number(e.target.value))} className="text-xs sm:text-sm text-gray-700 outline-none w-full">{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}</select></div>
              </div>
          {/* Coupon code */}
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-700 mb-1.5">Have a coupon?</p>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError('') }}
                placeholder="Enter code"
                className="flex-1 border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-stay-500"
              />
              <button
                onClick={handleValidateCoupon}
                disabled={validating || !couponCode.trim()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50">
                {validating ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            {coupon && (
              <div className="flex items-center justify-between mt-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-xs text-green-700 font-medium">✓ {coupon.code} — {coupon.discount_percent}% off</span>
                <button onClick={() => { setCoupon(null); setCouponCode('') }}
                  className="text-xs text-green-600 hover:text-green-800">Remove</button>
              </div>
            )}
          </div>              
              {isSignedIn ? (<button onClick={handleBook} disabled={booking} className="w-full py-2.5 sm:py-3 bg-stay-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-stay-600 disabled:opacity-50 mb-3">{booking ? 'Confirming...' : nights > 0 ? `Reserve · $${total.toLocaleString()}` : 'Reserve'}</button>) : (<button onClick={() => { if (checkIn) sessionStorage.setItem('stayCheckIn', checkIn); if (checkOut) sessionStorage.setItem('stayCheckOut', checkOut); sessionStorage.setItem('stayGuests', guests.toString()); window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}` }} className="w-full py-2.5 sm:py-3 bg-stay-500 text-white rounded-xl font-semibold text-sm sm:text-base mb-3">Sign in to Reserve</button>)}
              <p className="text-[10px] sm:text-xs text-gray-400 text-center mb-4">You won't be charged yet</p>
              {nights > 0 && (<div className="space-y-1 sm:space-y-2 text-xs sm:text-sm border-t pt-3 sm:pt-4"><div className="flex justify-between text-gray-600"><span>${price_per_night} × {nights} night{nights > 1 ? 's' : ''}</span><span>${subtotal.toLocaleString()}</span></div><div className="flex justify-between text-gray-600"><span>Cleaning fee</span><span>${cleaningFee}</span></div><div className="flex justify-between text-gray-600"><span>Service fee</span><span>${serviceFee}</span></div>{coupon && (
      <div className="flex justify-between text-green-600 font-medium">
        <span>Discount ({coupon.discount_percent}%)</span>
        <span>−${discount.toLocaleString()}</span>
      </div>
)}<div className="flex justify-between font-bold pt-1 sm:pt-2 border-t text-gray-900"><span>Total</span><span>${total.toLocaleString()}</span></div></div>)}
              <div className="flex gap-2 mt-3 sm:mt-4"><button onClick={handleShare} className="flex-1 text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 border rounded-lg py-1.5 sm:py-2 hover:bg-gray-50">↑ Share</button><button onClick={() => { if (!isSignedIn) return toast.error('Sign in to save stays.'); setSaved(s => !s); toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist ♥') }} className={`flex-1 text-[10px] sm:text-xs border rounded-lg py-1.5 sm:py-2 transition-colors ${saved ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>{saved ? '♥ Saved' : '♡ Save'}</button></div>
            </div>
          </div>
        </div>

        <SimilarStays currentId={id} city={city} />
      </div>

      {/* MOBILE BOOKING BAR - Compact */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 lg:hidden">
        <div className="px-3 py-2">
          {/* Top row: Price + Reserve button */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold text-stay-500">${price_per_night}</span>
              <span className="text-gray-400 text-xs">/night</span>
              {nights > 0 && (
                <span className="text-xs font-medium text-stay-600 ml-1">${total.toLocaleString()} total</span>
              )}
            </div>
            {isSignedIn ? (
              <button
                onClick={handleBook}
                disabled={booking}
                className="px-4 py-1.5 bg-stay-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {nights > 0 ? 'Reserve' : 'Check'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (checkIn) sessionStorage.setItem('stayCheckIn', checkIn);
                  if (checkOut) sessionStorage.setItem('stayCheckOut', checkOut);
                  sessionStorage.setItem('stayGuests', guests.toString());
                  window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
                }}
                className="px-4 py-1.5 bg-stay-500 text-white rounded-lg text-sm font-semibold"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Bottom row: Date and Guest buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white active:bg-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📅</span>
                <div className="text-left">
                  <p className="text-[10px] font-medium text-gray-400">DATE</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {checkIn && checkOut
                      ? `${new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : checkIn
                        ? `${new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - ?`
                        : 'Select dates'}
                  </p>
                </div>
              </div>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              onClick={() => setActiveGuestPicker(true)}
              className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white active:bg-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👥</span>
                <div className="text-left">
                  <p className="text-[10px] font-medium text-gray-400">GUESTS</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : 'Add guests'}
                  </p>
                </div>
              </div>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              onClick={() => setActiveCouponInput(true)}
              className={`flex items-center justify-center px-3 py-2 border rounded-lg bg-white active:bg-gray-50 ${coupon ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-400">COUPON</p>
                <p className="text-xs font-semibold">{coupon ? '✓' : '🎟'}</p>
              </div>
            </button>
          </div>

          {/* Free cancellation note */}
          <p className="text-center text-[9px] text-green-600 mt-1.5">
            ✅ Free cancellation{cancellationDeadline ? ` before ${cancellationDeadline}` : ''}
          </p>
        </div>
      </div>

      {/* Guest picker modal */}
      {activeGuestPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center lg:hidden" onClick={() => setActiveGuestPicker(false)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Who's coming?</h3>
              <button onClick={() => setActiveGuestPicker(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <Counter label="Adults" sub="Ages 13+" value={adults} setValue={setAdults} />
              <Counter label="Children" sub="Ages 2-12" value={children} setValue={setChildren} />
              <Counter label="Infants" sub="Under 2" value={infants} setValue={setInfants} />
              <Counter label="Pets" sub="Service animals" value={pets} setValue={setPets} />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button onClick={() => setActiveGuestPicker(false)} className="w-full py-3 bg-stay-500 text-white rounded-xl font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile coupon modal */}
      {activeCouponInput && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6 lg:hidden"
          onClick={() => setActiveCouponInput(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Apply Coupon</h3>
              <button onClick={() => setActiveCouponInput(false)} className="text-gray-400 text-lg leading-none">✕</button>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError('') }}
                placeholder="Enter coupon code"
                style={{ fontSize: '16px' }}
                className="flex-1 border rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-stay-500"
                autoFocus
              />
              <button
                onClick={handleValidateCoupon}
                disabled={validating || !couponCode.trim()}
                className="px-4 py-2 bg-stay-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {validating ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-500 mb-2">{couponError}</p>}
            {coupon && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
                <span className="text-xs text-green-700 font-medium">✓ {coupon.code} — {coupon.discount_percent}% off</span>
                <button onClick={() => { setCoupon(null); setCouponCode('') }} className="text-xs text-green-600 ml-2">Remove</button>
              </div>
            )}
            <button onClick={() => setActiveCouponInput(false)}
              className="w-full py-2.5 bg-stay-500 text-white rounded-xl font-semibold text-sm mt-2">
              {coupon ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}
            {/* Date picker - compact popup */}
      {showDatePicker && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowDatePicker(false)} />
          {/* Calendar popup */}
          <div className="fixed bottom-24 left-3 right-3 z-50 bg-white rounded-2xl shadow-xl border max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Select dates</h3>
              <button onClick={() => setShowDatePicker(false)} className="text-gray-400 text-lg">✕</button>
            </div>
            <div className="p-3">
              <AvailabilityCalendar 
                minNights={min_nights} 
                blockedDates={blocked_dates} 
                checkIn={checkIn} 
                checkOut={checkOut} 
                onChange={({ checkIn: ci, checkOut: co }) => { 
                  setCheckIn(ci); 
                  setCheckOut(co); 
                }} 
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-3">
              <button 
                onClick={() => setShowDatePicker(false)} 
                className="w-full py-2 bg-stay-500 text-white rounded-xl font-semibold text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}