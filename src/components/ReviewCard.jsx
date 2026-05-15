export default function ReviewCard({ review }) {
  const {
    reviewer_name, reviewer_city, reviewer_avatar,
    rating, cleanliness, location, value,
    review_text, stay_date
  } = review

  const initials = reviewer_name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="border-b pb-6 mb-6 last:border-0 last:mb-0">
      {/* Reviewer info */}
      <div className="flex items-center gap-3 mb-3">
        {reviewer_avatar ? (
          <img
            src={reviewer_avatar}
            alt={reviewer_name}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-stay-500 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 text-sm">{reviewer_name}</p>
          <p className="text-xs text-gray-400">{reviewer_city}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="flex items-center gap-1 justify-end">
            {'★★★★★'.split('').map((s, i) => (
              <span key={i} className={`text-sm ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{stay_date}</p>
        </div>
      </div>

      {/* Review text */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">{review_text}</p>

      {/* Category scores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cleanliness', score: cleanliness },
          { label: 'Location', score: location },
          { label: 'Value', score: value },
        ].map(c => (
          <div key={c.label} className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 mb-0.5">{c.label}</p>
            <p className="font-semibold text-gray-900 text-sm">{c.score?.toFixed(1)}</p>
          </div>
        ))}
      </div>

      {/* Verified badge */}
      <div className="flex items-center gap-1 mt-3">
        <span className="text-xs text-gray-400">✓</span>
        <span className="text-xs text-gray-400">Verified Stay</span>
      </div>
    </div>
  )
}