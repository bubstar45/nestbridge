import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import './globals.css'

export const metadata = {
  title: 'NestBridge — Find Your Next Home',
  description: 'Browse thousands of US rental listings and apply in minutes.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <Navbar />
          <main>{children}</main>
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}