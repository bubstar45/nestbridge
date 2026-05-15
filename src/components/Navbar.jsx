'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const path = usePathname()
  const { user } = useUser()
  const isAdmin = user?.publicMetadata?.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/rentals', label: 'Long-term Rentals', activeColor: 'text-brand-600', activeBg: 'bg-brand-50' },
    { href: '/stays', label: 'Short Stays', activeColor: 'text-stay-600', activeBg: 'bg-orange-50' },
    { href: '/dashboard', label: 'Dashboard', activeColor: 'text-brand-600', activeBg: 'bg-brand-50' },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <img src="/logo.svg" alt="NestBridge" className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <Link
            href="/rentals"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              path.startsWith('/rentals')
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Long-term Rentals
          </Link>
          <Link
            href="/stays"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              path.startsWith('/stays')
                ? 'bg-white text-stay-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Short Stays
          </Link>
        </div>

        {/* Desktop Right side - hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <SignedIn>
            <Link
              href="/dashboard"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                path.startsWith('/dashboard')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  path.startsWith('/admin')
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚙ Admin
              </Link>
            )}
            <div className="w-px h-5 bg-gray-200" />
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 my-1 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 md:hidden">
          <div className="flex flex-col p-4 space-y-2">
            {/* Mobile nav links */}
            <Link
              href="/rentals"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                path.startsWith('/rentals')
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🏠 Long-term Rentals
            </Link>
            <Link
              href="/stays"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                path.startsWith('/stays')
                  ? 'bg-orange-50 text-stay-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🌴 Short Stays
            </Link>
            <div className="border-t border-gray-100 my-2" />
            
            {/* Mobile auth section */}
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  path.startsWith('/dashboard')
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    path.startsWith('/admin')
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ⚙️ Admin
                </Link>
              )}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
                <span className="text-sm text-gray-500">Account</span>
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full px-4 py-3 bg-brand-500 text-white rounded-xl text-base font-semibold hover:bg-brand-600 transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      )}
    </>
  )
}