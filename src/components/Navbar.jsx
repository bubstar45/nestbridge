'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const path = usePathname()
  const { user } = useUser()
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-8 flex items-center justify-between h-16">
      {/* Logo */}
      <Link href="/" className="shrink-0">
        <img src="/logo.svg" alt="NestBridge" className="h-8 w-auto" />
      </Link>

      {/* Center nav */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
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

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
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
          {/* afterSignOutUrl moved to ClerkProvider in v7 — UserButton just works */}
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
    </nav>
  )
}