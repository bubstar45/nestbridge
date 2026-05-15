import Link from 'next/link'

export default function PropertyCard({ listing }) {
  const { id, title, city, state, price, price_per_night, listing_mode,
          bedrooms, bathrooms, sqft, type, available_from } = listing

  const displayPrice = price ?? price_per_night
  const isNew = isWithinDays(available_from, 30)

  return (
    <Link href={`/listings/${id}`}
      className="group block rounded-xl border hover:shadow-md transition-shadow overflow-hidden bg-white">
      <div className="relative h-52 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-300 text-sm capitalize">{type}</span>
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
          <span className="bg-white text-xs px-2 py-1 rounded-full capitalize font-medium shadow">
            {type}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="font-semibold text-gray-900 truncate group-hover:text-brand-500">
          {title}
        </p>
        <p className="text-sm text-gray-500 mb-3">{city}, {state}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-brand-500">
            ${displayPrice?.toLocaleString()}
            <span className="text-sm font-normal text-gray-400">
              {listing_mode === 'rental' ? '/mo' : '/night'}
            </span>
          </span>
          <span className="text-xs text-gray-500">
            {bedrooms}bd · {bathrooms}ba · {sqft?.toLocaleString()}sqft
          </span>
        </div>
      </div>
    </Link>
  )
}

function isWithinDays(dateStr, days) {
  if (!dateStr) return false
  return (Date.now() - new Date(dateStr)) / 86400000 < days
}