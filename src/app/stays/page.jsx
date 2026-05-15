'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { getListings } from '@/lib/api'
import StayCard from '@/components/StayCard'
import StayMapView from '@/components/StayMapView'

const fetcher = (filters) => getListings({ ...filters, mode: 'short_stay' }).then(r => r.data.listings)
const allFetcher = () => getListings({ mode: 'short_stay' }).then(r => r.data.listings)

const CATEGORIES = [
  { label: 'All', icon: '🏠', match: () => true },
  {
    label: 'City Center', icon: '🌆',
    match: (l) =>
      ['city center', 'downtown', 'midtown', 'central'].some(kw =>
        [l.title, l.description, l.neighborhood, l.category, l.type, l.amenities?.join(' ')]
          .filter(Boolean).join(' ').toLowerCase().includes(kw)
      ),
  },
  {
    label: 'Beachfront', icon: '🏖',
    match: (l) =>
      ['beach', 'ocean', 'sea', 'coastal', 'waterfront', 'lakefront']
        .some(kw =>
          [l.title, l.description, l.neighborhood, l.category, l.type, l.amenities?.join(' ')]
            .filter(Boolean).join(' ').toLowerCase().includes(kw)
        ),
  },
  {
    label: 'Luxury', icon: '✨',
    match: (l) =>
      (l.price_per_night >= 300) ||
      ['luxury', 'premium', 'penthouse', 'villa', 'suite', 'deluxe']
        .some(kw =>
          [l.title, l.description, l.category, l.type, l.amenities?.join(' ')]
            .filter(Boolean).join(' ').toLowerCase().includes(kw)
        ),
  },
  {
    label: 'Pet Friendly', icon: '🐾',
    match: (l) =>
      l.pets_allowed === true ||
      ['pet', 'dog', 'cat', 'pet-friendly', 'pets welcome']
        .some(kw =>
          [l.title, l.description, l.amenities?.join(' ')]
            .filter(Boolean).join(' ').toLowerCase().includes(kw)
        ),
  },
  {
    label: 'Studio', icon: '🛋',
    match: (l) =>
      l.bedrooms === 0 ||
      ['studio'].some(kw =>
        [l.title, l.description, l.type, l.category]
          .filter(Boolean).join(' ').toLowerCase().includes(kw)
      ),
  },
  {
    label: 'Entire Home', icon: '🏡',
    match: (l) =>
      ['entire home', 'entire place', 'entire house', 'entire apartment', 'whole home']
        .some(kw =>
          [l.title, l.description, l.type, l.category, l.room_type]
            .filter(Boolean).join(' ').toLowerCase().includes(kw)
        ) || l.room_type === 'entire_home',
  },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const parseLocalDate = (str) => {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function CalendarMonth({ year, month, checkIn, checkOut, hoveredDate, onSelect, onHover }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const inRange = (date) => {
    if (!date) return false
    const start = parseLocalDate(checkIn)
    const end = hoveredDate && !checkOut ? hoveredDate : parseLocalDate(checkOut)
    if (!start || !end) return false
    return date > start && date < end
  }
  const isStart = (date) => {
    if (!date || !checkIn) return false
    const s = parseLocalDate(checkIn)
    return s && date.toDateString() === s.toDateString()
  }
  const isEnd = (date) => {
    if (!date || !checkOut) return false
    const e = parseLocalDate(checkOut)
    return e && date.toDateString() === e.toDateString()
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center font-semibold text-gray-900 mb-4">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />
          const isPast = date < today
          const start = isStart(date)
          const end = isEnd(date)
          const range = inRange(date)
          return (
            <button
              key={date.toISOString()}
              disabled={isPast}
              onClick={() => !isPast && onSelect(date)}
              onMouseEnter={() => onHover(date)}
              className={`
                h-9 text-sm transition-colors text-center
                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                ${start ? 'bg-gray-900 text-white rounded-full hover:bg-gray-800' : ''}
                ${end ? 'bg-gray-900 text-white rounded-full hover:bg-gray-800' : ''}
                ${range ? 'bg-rose-50 text-gray-900' : ''}
                ${!start && !end && !range && !isPast ? 'hover:bg-gray-100 rounded-full' : ''}
              `}>
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function StaysPage() {
  const [view, setView] = useState('grid')
  const [category, setCategory] = useState('All')
  const [active, setActive] = useState(null)
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [hoveredDate, setHoveredDate] = useState(null)
  const [adults, setAdults] = useState(0)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [calMonth, setCalMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [applied, setApplied] = useState({ mode: 'short_stay' })
  const barRef = useRef(null)

  const { data: allListings = [] } = useSWR('all-stays', allFetcher)
  const { data: rawListings = [], isLoading } = useSWR(['stays', applied], () => fetcher(applied))

  const categoryDef = CATEGORIES.find(c => c.label === category) ?? CATEGORIES[0]
  const listings = useMemo(() => rawListings.filter(l => categoryDef.match(l)), [rawListings, categoryDef])

  const categoryCounts = useMemo(() => {
    const map = {}
    CATEGORIES.forEach(c => {
      map[c.label] = rawListings.filter(l => c.match(l)).length
    })
    return map
  }, [rawListings])

  const citySuggestions = [...new Map(
    allListings.map(l => [`${l.city}-${l.state}`, { city: `${l.city}, ${l.state}`, type: l.type }])
  ).values()]

  const filteredSuggestions = city.length > 0
    ? citySuggestions.filter(s => s.city.toLowerCase().includes(city.toLowerCase()))
    : citySuggestions

  useEffect(() => {
    const handler = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setActive(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toDateStr = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const handleDateSelect = (date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(toDateStr(date)); setCheckOut('')
    } else {
      const start = parseLocalDate(checkIn)
      if (date <= start) {
        setCheckIn(toDateStr(date)); setCheckOut('')
      } else {
        setCheckOut(toDateStr(date)); setActive('who')
      }
    }
  }

  const formatDate = (str) => {
    if (!str) return null
    const d = parseLocalDate(str)
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((parseLocalDate(checkOut) - parseLocalDate(checkIn)) / 86400000))
    : 0

  const totalGuests = adults + children

  const handleSearch = () => {
    setActive(null)
    setCategory('All')
    setApplied({ mode: 'short_stay', city: city.split(',')[0] })
    setMobileSearchOpen(false)
  }

  const nextMonth = {
    year: calMonth.month === 11 ? calMonth.year + 1 : calMonth.year,
    month: calMonth.month === 11 ? 0 : calMonth.month + 1,
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

  // Check if any search criteria are set
  const hasSearchCriteria = city || checkIn || checkOut || totalGuests > 0

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Mobile Search Bar - Simplified (like Airbnb) */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="w-full flex items-center justify-between bg-gray-100 rounded-full px-5 py-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {hasSearchCriteria ? (
              <span className="text-gray-800 font-medium">
                {city ? `${city.split(',')[0]}` : 'Anywhere'}
                {nights > 0 && ` · ${nights} nights`}
                {totalGuests > 0 && ` · ${totalGuests} guests`}
              </span>
            ) : (
              <span className="text-gray-500">Where are you going?</span>
            )}
          </div>
        </button>
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden" onClick={() => setMobileSearchOpen(false)}>
          <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Where to?</h2>
              <button onClick={() => setMobileSearchOpen(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Where input */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Location</label>
                <input
                  type="text"
                  placeholder="Search destinations"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-base"
                />
                {filteredSuggestions.slice(0, 5).map(s => (
                  <button
                    key={s.city}
                    onClick={() => { setCity(s.city); setMobileSearchOpen(false) }}
                    className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50 rounded-xl text-left"
                  >
                    <span className="text-2xl">📍</span>
                    <span className="text-sm">{s.city}</span>
                  </button>
                ))}
              </div>

              {/* Dates */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Dates</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    className="border rounded-xl px-4 py-3 text-sm"
                    placeholder="Check in"
                  />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    className="border rounded-xl px-4 py-3 text-sm"
                    placeholder="Check out"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Guests</label>
                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  <Counter label="Adults" sub="Ages 13+" value={adults} setValue={setAdults} />
                  <Counter label="Children" sub="Ages 2-12" value={children} setValue={setChildren} />
                  <Counter label="Infants" sub="Under 2" value={infants} setValue={setInfants} />
                  <Counter label="Pets" sub="Service animals" value={pets} setValue={setPets} />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full py-4 bg-stay-500 text-white rounded-xl font-semibold text-base"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Search Bar (hidden on mobile) */}
      <div className="hidden md:block border-b bg-white sticky top-16 z-40 py-5 px-6">
        <div ref={barRef} className="relative max-w-3xl mx-auto">
          <div className={`flex items-stretch bg-white border rounded-full transition-all ${active ? 'shadow-2xl' : 'shadow-md hover:shadow-lg'}`}>
            <div onClick={() => setActive('where')}
              className={`flex-1 px-6 py-3 rounded-full cursor-pointer transition-colors ${active === 'where' ? 'bg-white shadow-lg' : active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <p className="text-xs font-bold text-gray-900">Where</p>
              <input value={city} onChange={e => setCity(e.target.value)} onClick={e => { e.stopPropagation(); setActive('where') }}
                placeholder="Search destinations" className="w-full text-sm text-gray-500 outline-none bg-transparent" />
            </div>
            <div className="w-px bg-gray-200 my-3" />
            <div onClick={() => setActive('when')}
              className={`px-6 py-3 rounded-full cursor-pointer transition-colors min-w-36 ${active === 'when' ? 'bg-white shadow-lg' : active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <p className="text-xs font-bold text-gray-900">When</p>
              <p className="text-sm text-gray-500">{checkIn && checkOut ? `${formatDate(checkIn)} – ${formatDate(checkOut)}` : checkIn ? `${formatDate(checkIn)} – ?` : 'Add dates'}</p>
            </div>
            <div className="w-px bg-gray-200 my-3" />
            <div onClick={() => setActive('who')}
              className={`px-6 py-3 rounded-full cursor-pointer transition-colors ${active === 'who' ? 'bg-white shadow-lg' : active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <p className="text-xs font-bold text-gray-900">Who</p>
              <p className="text-sm text-gray-500">{totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : 'Add guests'}</p>
            </div>
            <div className="flex items-center pr-2 pl-2">
              <button onClick={handleSearch} className="flex items-center gap-2 bg-stay-500 text-white px-5 py-3 rounded-full font-semibold text-sm hover:bg-stay-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Search'}
              </button>
            </div>
          </div>

          {/* Desktop dropdowns (WHERE, WHEN, WHO) - keep your existing logic */}
          {active === 'where' && (
            <div className="absolute top-full left-0 mt-3 bg-white border rounded-3xl shadow-2xl p-5 w-80 z-50 max-h-80 overflow-y-auto">
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Available destinations</p>
              {filteredSuggestions.slice(0, 8).map(s => (
                <button key={s.city} onClick={() => { setCity(s.city); setActive('when') }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 rounded-2xl text-left">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base">📍</div>
                  <div><p className="text-sm font-medium text-gray-900">{s.city}</p><p className="text-xs text-gray-400 capitalize">{s.type} available</p></div>
                </button>
              ))}
            </div>
          )}

          {active === 'when' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border rounded-3xl shadow-2xl p-6 z-50 w-[580px]">
              <div className="flex items-start gap-8">
                <button onClick={() => setCalMonth(p => ({ year: p.month === 0 ? p.year - 1 : p.year, month: p.month === 0 ? 11 : p.month - 1 }))}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 mt-1 shrink-0">‹</button>
                <CalendarMonth year={calMonth.year} month={calMonth.month} checkIn={checkIn} checkOut={checkOut} hoveredDate={hoveredDate} onSelect={handleDateSelect} onHover={setHoveredDate} />
                <CalendarMonth year={nextMonth.year} month={nextMonth.month} checkIn={checkIn} checkOut={checkOut} hoveredDate={hoveredDate} onSelect={handleDateSelect} onHover={setHoveredDate} />
                <button onClick={() => setCalMonth(p => ({ year: p.month === 11 ? p.year + 1 : p.year, month: p.month === 11 ? 0 : p.month + 1 }))}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 mt-1 shrink-0">›</button>
              </div>
              {checkIn && (<div className="flex justify-end mt-4"><button onClick={() => { setCheckIn(''); setCheckOut('') }} className="text-sm underline text-gray-500 hover:text-gray-900">Clear dates</button></div>)}
            </div>
          )}

          {active === 'who' && (
            <div className="absolute top-full right-0 mt-3 bg-white border rounded-3xl shadow-2xl p-6 w-72 z-50">
              <Counter label="Adults" sub="Ages 13 or above" value={adults} setValue={setAdults} />
              <Counter label="Children" sub="Ages 2–12" value={children} setValue={setChildren} />
              <Counter label="Infants" sub="Under 2" value={infants} setValue={setInfants} />
              <Counter label="Pets" sub="Bringing a service animal?" value={pets} setValue={setPets} />
            </div>
          )}
        </div>
      </div>

      {/* Category chips - horizontal scroll on mobile */}
      <div className="border-b px-4 sm:px-6 py-3 bg-white overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {CATEGORIES.map(c => {
            const count = categoryCounts[c.label] ?? 0
            const isEmpty = c.label !== 'All' && count === 0 && !isLoading
            const activeCat = category === c.label
            return (
              <button
                key={c.label}
                onClick={() => !isEmpty && setCategory(c.label)}
                disabled={isEmpty}
                className={`flex flex-col items-center gap-1 pb-2 border-b-2 transition-colors shrink-0 ${activeCat ? 'border-gray-900 text-gray-900' : isEmpty ? 'border-transparent text-gray-200 cursor-not-allowed' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'}`}>
                <span className={`text-xl ${activeCat ? '' : isEmpty ? 'grayscale opacity-30' : ''}`}>{c.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 order-2 sm:order-1">
          {isLoading ? 'Finding stays...' : `${listings.length} stay${listings.length !== 1 ? 's' : ''} available`}
          {nights > 0 && <span className="ml-1 text-gray-400">· {nights} night{nights !== 1 ? 's' : ''}</span>}
        </p>
        <div className="flex items-center justify-between order-1 sm:order-2">
          {category !== 'All' && (
            <button onClick={() => setCategory('All')}
              className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full font-medium mr-3">
              {CATEGORIES.find(c => c.label === category)?.icon} {category} ×
            </button>
          )}
          <div className="flex border rounded-xl overflow-hidden">
            <button onClick={() => setView('grid')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${view === 'grid' ? 'bg-stay-500 text-white' : 'bg-white text-gray-600'}`}>List</button>
            <button onClick={() => setView('map')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${view === 'map' ? 'bg-stay-500 text-white' : 'bg-white text-gray-600'}`}>Map</button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'map' ? (
        <StayMapView listings={listings} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="h-56 bg-gray-100 animate-pulse rounded-2xl mb-3" />
                  <div className="h-4 bg-gray-100 animate-pulse rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && listings.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">{CATEGORIES.find(c => c.label === category)?.icon ?? '🌴'}</div>
              <p className="text-gray-500 text-lg">No stays found.</p>
              <p className="text-gray-400 text-sm mt-1">
                {category !== 'All'
                  ? <button onClick={() => setCategory('All')} className="underline hover:text-gray-600">Clear category filter</button>
                  : 'Try a different city or dates.'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {listings.map(l => <StayCard key={l.id} listing={l} nights={nights} />)}
          </div>
        </div>
      )}
    </div>
  )
}