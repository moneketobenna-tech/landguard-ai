import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LandGuard AI - Property Scam Detection',
  description: 'Protect yourself from land and property scams before money changes hands. AI-powered risk analysis for real estate listings.',
  keywords: 'property scam, land scam, real estate fraud, scam detection, property verification',
  authors: [{ name: 'LandGuard AI' }],
  openGraph: {
    title: 'LandGuard AI - Property Scam Detection',
    description: 'Protect yourself from land and property scams before money changes hands.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}

