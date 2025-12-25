'use client'

/**
 * Dashboard Layout - LandGuard AI
 * Light green theme matching main website
 */

import { AuthProvider } from '@/lib/auth/context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div 
        className="min-h-screen w-full"
        style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #F5FDF8 100%)'
        }}
      >
        {children}
      </div>
    </AuthProvider>
  )
}

