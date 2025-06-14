import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import AuthProvider from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'HealthPulse - Team Deepship',
  description: 'Your comprehensive health monitoring dashboard',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
