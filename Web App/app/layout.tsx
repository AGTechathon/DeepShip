import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Team Deepship',
  description: 'Created by Team Deepship',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
