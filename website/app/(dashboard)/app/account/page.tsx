'use client'

/**
 * Account Page - LandGuard AI
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isPro, logout } = useAuth()
  const [upgrading, setUpgrading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' })
      })
      
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Unable to start checkout. Please try again.')
      }
    } catch {
      alert('Unable to start checkout. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-2xl">
                {user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-800">{user?.email}</div>
                <div className="text-sm text-gray-500">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800">Subscription</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  isPro 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isPro ? '⚡ PRO Plan' : 'Free Plan'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {isPro 
                    ? 'Unlimited scans, auto-scan, detailed reports, priority support' 
                    : '3 scans per month, basic analysis'
                  }
                </div>
              </div>
              
              {!isPro && (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {upgrading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>⚡ Upgrade to PRO</>
                  )}
                </button>
              )}
              
              {isPro && user?.stripePortalUrl && (
                <a
                  href={user?.stripePortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Manage Billing
                </a>
              )}
            </div>

            {/* Plan Features */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Your Plan Features
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {isPro ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Unlimited property scans
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Auto-scan on all sites
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Detailed risk reports
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Ownership verification
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Seller history check
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Priority support
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> 3 scans per month
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> Basic risk analysis
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>✗</span> Auto-scan (PRO)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>✗</span> Detailed reports (PRO)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>✗</span> Ownership verification (PRO)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>✗</span> Priority support (PRO)
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* License Key Card */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800">License Key</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Your license key (for Chrome extension)</div>
                <code className="text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-sm">
                  {user?.licenseKey || '****-****-****-****'}
                </code>
              </div>
              <button
                onClick={() => {
                  if (user?.licenseKey) {
                    navigator.clipboard.writeText(user.licenseKey)
                    alert('License key copied!')
                  }
                }}
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Use this key in the LandGuard Chrome extension to sync your PRO status.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-200 bg-red-50/50">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">Sign Out</div>
                <div className="text-sm text-gray-500">Sign out of your account on this device</div>
              </div>
              <button
                onClick={handleSignOut}
                className="border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-400 py-4">
          Need help? Contact us at{' '}
          <a href="mailto:support@landguardai.co" className="text-green-600 hover:text-green-700">
            support@landguardai.co
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}

