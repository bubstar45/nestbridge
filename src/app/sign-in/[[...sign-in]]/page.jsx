'use client'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignIn afterSignInUrl={redirectUrl} />
    </div>
  )
}