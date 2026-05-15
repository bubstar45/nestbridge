import Link from 'next/link'

const TYPE_ICONS = {
  apartment: '🏢', house: '🏠', condo: '🏙', studio: '🛋', townhouse: '🏘'
}

export default function RentalCard({ listing }) {
  const { id, title, city, state, price, bedrooms, bathrooms, sqft, type, available_from, amenities } = listing

  const isAvailableSoon = available_from && 
    (new Date(available_from) - new Date()) / 86400000 < 14

  return (
    <Link href={`/rentals/${id}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all overflow-hidden">
      
      {/* Photo area */}
      <div className="relative h-48 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center overflow-hidden">
        {listing.images?.[0]?.url ? (
          <img src={listing.images[0].url} alt={title} className="w-full h-full object-cover" />
          ) : (
        <span className="text-5xl">{TYPE_ICONS[type] ?? '🏠'}</span>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {isAvailableSoon && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Available Soon
            </span>
          )}
          <span className="bg-white text-xs px-2 py-1 rounded-full capitalize font-medium shadow-sm text-gray-700">
            {type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            For Rent
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold text-gray-900 truncate group-hover:text-brand-500 flex-1 mr-2">
            {title}
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-3">📍 {city}, {state}</p>

        {/* Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-brand-500">
            ${price?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 ml-1">/month</span>
        </div>

        {/* Specs */}
        <div className="flex gap-4 text-sm text-gray-600 mb-3 pb-3 border-b">
          <span>🛏 {bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
          <span>🚿 {bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
          <span>📐 {sqft?.toLocaleString()} sqft</span>
        </div>

        {/* Amenities preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {(amenities ?? []).slice(0, 3).map(a => (
            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
          {(amenities ?? []).length > 3 && (
            <span className="text-xs text-gray-400">+{amenities.length - 3} more</span>
          )}
        </div>

        {/* Available date */}
        {available_from && (
          <p className="text-xs text-gray-500">
            Available {new Date(available_from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  )
}