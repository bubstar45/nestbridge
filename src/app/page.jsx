'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, #3b5bdb 0%, transparent 50%), radial-gradient(circle at 75% 20%, #e8590c 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 text-center">
          <div className="inline-block bg-white/10 text-white text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6 tracking-wide uppercase">
            🇺🇸 2,400+ verified listings across the US
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-5 leading-tight">
            Find Your Perfect<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-orange-300">
              Place to Call Home
            </span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg mb-8 sm:mb-14 max-w-xl mx-auto px-2">
            Whether you're settling down or passing through, NestBridge connects you to the right space at the right price.
          </p>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
            {/* Rentals card */}
            <Link href="/rentals"
              className="group relative bg-white text-left rounded-2xl p-5 sm:p-7 hover:scale-[1.02] transition-all duration-200 shadow-xl">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 flex items-center justify-center text-xl sm:text-2xl">
                  🏠
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base sm:text-lg">Long-term Rentals</p>
                  <p className="text-xs text-gray-400">Monthly leases</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed">
                Apartments, houses, condos & more. Apply online in minutes.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-400">Apartments · Houses · Condos</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-brand-500 group-hover:gap-2 transition-all">
                  Browse →
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {/* Stays card */}
            <Link href="/stays"
              className="group relative bg-white text-left rounded-2xl p-5 sm:p-7 hover:scale-[1.02] transition-all duration-200 shadow-xl">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl sm:text-2xl">
                  🌴
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base sm:text-lg">Short Stays</p>
                  <p className="text-xs text-gray-400">Nightly rates</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed">
                Fully furnished spaces ready for your arrival. Book instantly, check in same day.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-400">Studios · Suites · Homes</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-stay-500 group-hover:gap-2 transition-all">
                  Browse →
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-stay-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-brand-500 text-white py-4 sm:py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            {[
              { value: '2,400+', label: 'Listings' },
              { value: '50', label: 'States' },
              { value: '4.9★', label: 'Avg Rating' },
              { value: '24hr', label: 'Review Time' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
                <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">How NestBridge Works</h2>
          <p className="text-gray-500 text-sm sm:text-base">Simple, transparent, fast.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16">
          {/* Rentals flow */}
          <div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <span className="text-xl">🏠</span>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">For Long-term Rentals</h3>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {[
                { step: '01', title: 'Browse listings', desc: 'Filter by city, type, price, and beds.' },
                { step: '02', title: 'Apply online', desc: 'Submit your application.' },
                { step: '03', title: 'Get approved', desc: 'We review within 24 hours and notify you.' },
                { step: '04', title: 'Sign & move in', desc: 'Sign your lease digitally and get your keys.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-brand-100 w-8 sm:w-10 shrink-0">{s.step}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{s.title}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stays flow */}
          <div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <span className="text-xl">🌴</span>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">For Short Stays</h3>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {[
                { step: '01', title: 'Pick your dates', desc: 'Search by destination and travel dates.' },
                { step: '02', title: 'Choose your space', desc: 'Browse curated furnished stays.' },
                { step: '03', title: 'Book instantly', desc: 'Confirm your booking in seconds.' },
                { step: '04', title: 'Check in & enjoy', desc: 'Self check-in, everything ready for you.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-orange-100 w-8 sm:w-10 shrink-0">{s.step}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{s.title}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-gray-50 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Why NestBridge?</h2>
          <p className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-12">Built for renters who value transparency and speed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '🔒', title: 'Verified Listings', desc: 'Every listing is manually reviewed before going live. No surprises.' },
              { icon: '⚡', title: '24hr Decisions', desc: 'We process rental applications within 24 hours. No waiting weeks.' },
              { icon: '💎', title: 'No Hidden Fees', desc: 'Transparent pricing from start to finish. What you see is what you pay.' },
            ].map(t => (
              <div key={t.title} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="text-4xl mb-3 sm:mb-4">{t.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-base sm:text-lg">{t.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-brand-500 text-white py-12 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Ready to find your place?</h2>
        <p className="text-white/70 text-sm sm:text-base mb-6 sm:mb-8 px-4">Join thousands of renters who found their home on NestBridge.</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link href="/rentals"
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-brand-500 rounded-xl font-semibold hover:bg-brand-50 transition-colors text-sm sm:text-base">
            Browse Rentals
          </Link>
          <Link href="/stays"
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors border border-white/20 text-sm sm:text-base">
            Find a Stay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-10 text-center text-xs sm:text-sm">
        <p className="font-bold text-white mb-1">NestBridge</p>
        <p>© 2026 NestBridge. All rights reserved.</p>
      </footer>
    </div>
  )
}