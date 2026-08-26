import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tech Marketplace — PLACE-XP Auction',
  description: 'Live technology auction platform for PLACE-XP-VITC. Bid on cutting-edge technologies across Core and Support categories.',
  keywords: ['tech auction', 'marketplace', 'PLACE-XP', 'technology bidding'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
