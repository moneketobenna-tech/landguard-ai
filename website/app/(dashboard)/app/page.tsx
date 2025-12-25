'use client'

/**
 * Dashboard Home - LandGuard AI
 * Property listing scanner with scan history
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface ScanResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  flags: string[]
  recommendations: string[]
  listingDetails?: {
    price?: string
    location?: string
    type?: string
  }
}

interface ScanHistoryItem {
  id: string
  url: string
  platform: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  scannedAt: string
}

export default function DashboardHome() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isPro } = useAuth()
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([])
  const [scansRemaining, setScansRemaining] = useState(3)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a listing URL')
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url })
      })

      const data = await res.json()

      if (data.success) {
        setScanResult(data.analysis)
        // Add to recent scans
        setRecentScans(prev => [{
          id: Date.now().toString(),
          url,
          platform: detectPlatform(url),
          riskScore: data.analysis.riskScore,
          riskLevel: data.analysis.riskLevel,
          scannedAt: new Date().toISOString()
        }, ...prev].slice(0, 5))
        
        if (!isPro) {
          setScansRemaining(prev => Math.max(0, prev - 1))
        }
      } else {
        setError(data.error || 'Scan failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const detectPlatform = (url: string): string => {
    if (url.includes('facebook')) return 'Facebook'
    if (url.includes('kijiji')) return 'Kijiji'
    if (url.includes('craigslist')) return 'Craigslist'
    if (url.includes('zillow')) return 'Zillow'
    if (url.includes('realtor')) return 'Realtor'
    return 'Other'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-amber-600 bg-amber-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 lg:p-8 text-white">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 🏠
          </h1>
          <p className="text-white/80 mb-4">
            Protect yourself from property scams. Scan any listing before making contact.
          </p>
          <div className="text-sm text-white/60">
            LandGuard AI v1.0 • Moneke Industries
          </div>
        </div>

        {/* Pro Banner for Free Users */}
        {!isPro && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <span className="font-semibold text-gray-800">Upgrade to PRO</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Unlimited scans • Auto-scan on all sites • Detailed reports • Priority support
                </p>
                <p className="text-green-600 text-sm mt-1">
                  <strong>{scansRemaining} scans remaining</strong> this month
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                Upgrade for $9.99/mo
              </button>
            </div>
          </div>
        )}

        {/* Scanner */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Scan Property Listing
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Paste any listing URL from Facebook Marketplace, Kijiji, Craigslist, or other sites
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste listing URL here (e.g., facebook.com/marketplace/...)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <button
                onClick={handleScan}
                disabled={scanning || (!isPro && scansRemaining <= 0)}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>🔍 Scan</>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="mt-6 space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Risk Score</div>
                    <div className={`text-4xl font-bold ${
                      scanResult.riskLevel === 'high' ? 'text-red-600' :
                      scanResult.riskLevel === 'medium' ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {scanResult.riskScore}/100
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(scanResult.riskLevel)}`}>
                    {scanResult.riskLevel.toUpperCase()} RISK
                  </div>
                </div>

                {/* Flags */}
                {scanResult.flags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">⚠️ Risk Flags</h3>
                    <ul className="space-y-2">
                      {scanResult.flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {scanResult.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {scanResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Supported Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Facebook Marketplace', 'Kijiji', 'Craigslist', 'Zillow', 'Realtor.ca', 'Redfin', 'Property.ca', 'Other Sites'].map((platform) => (
              <div key={platform} className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg text-sm text-green-700 font-medium">
                <span className="text-green-500">✓</span>
                {platform}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-green-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent Scans</h2>
              <Link 
                href="/app/history" 
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    scan.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
                    scan.riskLevel === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-600'
                  } font-bold`}>
                    {scan.riskScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate text-sm">
                      {scan.url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {scan.platform} • {new Date(scan.scannedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getRiskColor(scan.riskLevel)}`}>
                    {scan.riskLevel.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-3">🛡️ Quick Tips to Avoid Property Scams</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Never send money without physically viewing the property
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Verify property ownership through land registry
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Be cautious of prices significantly below market value
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Watch for pressure tactics or urgency in communications
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

