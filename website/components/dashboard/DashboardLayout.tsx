'use client'

/**
 * Dashboard Layout Component - LandGuard AI
 * Green theme for property scam protection
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    name: 'Scan History',
    href: '/app/history',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: '🏘️ Property Scams',
    href: '/app/property-scams',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  {
    name: 'Account',
    href: '/app/account',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
]

export default function DashboardLayoutComponent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, isPro, logout } = useAuth()

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #F5FDF8 100%)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-green-200 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-green-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl">
              🏠
            </div>
            <span className="text-lg font-bold text-gray-800">
              LandGuard<span className="text-green-600"> AI</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-200 bg-white">
          {/* Plan Badge */}
          <div className={`
            mb-3 px-3 py-2 rounded-lg text-center text-sm font-medium
            ${isPro 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {isPro ? '⚡ PRO Plan' : 'Free Plan'}
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {user?.email || 'Guest'}
              </div>
              <div className="text-xs text-gray-500">
                {isPro ? 'Premium Member' : 'Free Tier'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 
                       hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-green-200 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 mr-4 text-gray-600 hover:text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Back to website link */}
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Website
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quick Scan Button */}
          <Link
            href="/app"
            className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            New Scan
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="p-4 lg:p-8 border-t border-green-200 text-center text-sm text-gray-500">
          <span className="text-green-600 font-medium">Moneke Industries</span>
          {' · '}
          LandGuard AI v1.0
        </footer>
      </div>
    </div>
  )
}

