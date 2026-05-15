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

  return (
    <Link href={`/stays/${id}`} className="group block">
      {/* Photo */}
      <div className="relative h-56 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl overflow-hidden mb-3">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{TYPE_ICONS[type] ?? '🏠'}</span>
          </div>
        )}

        {/* Image count badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            1 / {images.length}
          </div>
        )}

        {isGuestFavourite && (
          <div className="absolute top-3 left-3">
            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
              ⭐ Guest Favourite
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="bg-white rounded-full p-1.5 shadow-md text-gray-600 hover:text-red-500 transition-colors"
            onClick={e => e.preventDefault()}
          >
            ♡
          </button>
        </div>
      </div>

      {/* Info */}
      <div>
        <div className="flex items-start justify-between mb-0.5">
          <p className="font-semibold text-gray-900 truncate flex-1 mr-2 group-hover:text-stay-500 transition-colors">
            {title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs">⭐</span>
            <span className="text-xs font-medium text-gray-700">
              4.{Math.floor(Math.random() * 2) + 8}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-1">{city}, {state}</p>
        <p className="text-sm text-gray-400 mb-2">
          {bedrooms === 0 ? 'Studio' : `${bedrooms} bed${bedrooms > 1 ? 's' : ''}`} · {bathrooms} bath
        </p>
        <div>
          <span className="font-semibold text-gray-900">${price_per_night}</span>
          <span className="text-gray-500 text-sm"> /night</span>
          {total && (
            <span className="text-gray-400 text-sm ml-2">(${total.toLocaleString()} total)</span>
          )}
        </div>
      </div>
    </Link>
  )
}