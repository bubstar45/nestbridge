import Link from 'next/link'

const TYPE_ICONS = {
  studio: '🛋',
  house: '🏡',
  condo: '🏙',
  townhouse: '🏘',
  apartment: '🏢',
}

export default function StayCard({ listing, nights }) {
  const {
    id, title, city, state, price_per_night,
    bedrooms, bathrooms, type, images = [],
  } = listing

  const total = nights ? price_per_night * nights : null
  const isGuestFavourite = (listing.rating ?? 4.8) >= 4.8
  const coverImage = images[0]?.url
  const rating = listing.rating ?? 4.5

  return (
    <Link href={`/stays/${id}`} className="group block">
      {/* Photo - smaller height for mobile 2-col layout */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl overflow-hidden mb-2">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">{TYPE_ICONS[type] ?? '🏠'}</span>
          </div>
        )}

        {/* Guest Favourite badge - smaller on mobile */}
        {isGuestFavourite && (
          <div className="absolute top-2 left-2">
            <span className="bg-white text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              ⭐ Guest favourite
            </span>
          </div>
        )}

        {/* Wishlist heart - visible on touch */}
        <div className="absolute top-2 right-2">
          <button
            className="bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md text-gray-700 hover:text-red-500 transition-colors"
            onClick={e => e.preventDefault()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info - compact for mobile */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate flex-1 group-hover:text-stay-500 transition-colors">
            {title.length > 30 ? title.substring(0, 27) + '...' : title}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <svg className="w-3 h-3 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        {/* Location - smaller text */}
        <p className="text-xs text-gray-400 mb-1 truncate">
          {city}, {state}
        </p>
        
        {/* Details - compact */}
        <p className="text-xs text-gray-400 mb-1.5">
          {bedrooms === 0 ? 'Studio' : `${bedrooms} bed${bedrooms > 1 ? 's' : ''}`}
          {bathrooms && ` · ${bathrooms} bath${bathrooms > 1 ? 's' : ''}`}
        </p>
        
        {/* Price row */}
        <div className="flex items-baseline flex-wrap gap-1">
          <span className="font-semibold text-gray-900 text-sm">
            ${price_per_night?.toLocaleString()}
          </span>
          <span className="text-gray-500 text-xs">night</span>
          {total && nights && (
            <span className="text-gray-400 text-[11px] ml-1">
              · ${total.toLocaleString()} total
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}