'use client'

/**
 * Dashboard Home - LandGuard AI v3.0
 * Premium, sleek, professional dashboard design
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

interface ScanResult {
  scanId?: string
  score: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  flags: Array<{ severity: string; description: string }>
  recommendations: string[]
  metadata?: { scannedAt: string; processingTime?: number }
  scanUsage?: { used: number; remaining: number; limit: number; isPro: boolean }
}

interface ScanHistoryItem {
  id: string
  url: string
  type: 'listing' | 'seller'
  platform: string
  score: number
  riskLevel: string
  scannedAt: string
}

interface ScanUsage {
  used: number
  remaining: number
  limit: number
  isPro: boolean
}

const FREE_SCAN_LIMIT = 3

export default function DashboardHome() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isPro } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'listing' | 'seller'>('listing')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([])
  const [scanUsage, setScanUsage] = useState<ScanUsage>({ used: 0, remaining: FREE_SCAN_LIMIT, limit: FREE_SCAN_LIMIT, isPro: false })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Form inputs
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchScanUsage = async () => {
      if (!isAuthenticated) return
      try {
        const res = await fetch('/api/v1/usage')
        const data = await res.json()
        if (data.success && data.scanUsage) {
          setScanUsage(data.scanUsage)
        }
      } catch (err) {
        console.error('Failed to fetch scan usage:', err)
      }
    }
    fetchScanUsage()
  }, [isAuthenticated])

  useEffect(() => {
    const saved = localStorage.getItem('lg_scan_history')
    if (saved) {
      try { setRecentScans(JSON.parse(saved).slice(0, 10)) } catch {}
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const handleScan = async () => {
    if (activeTab === 'listing' && !url.trim()) {
      setError('Please enter a listing URL')
      return
    }
    if (activeTab === 'seller' && !sellerName && !sellerEmail && !sellerPhone) {
      setError('Please enter at least one seller detail')
      return
    }

    if (!isPro && scanUsage.remaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const endpoint = activeTab === 'listing' ? '/api/v1/scan-listing' : '/api/v1/scan-seller'
      const body = activeTab === 'listing' 
        ? { url, title: title || undefined, description: description || undefined, price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined }
        : { name: sellerName || undefined, email: sellerEmail || undefined, phone: sellerPhone || undefined }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.error === 'SCAN_LIMIT_REACHED') {
        setShowUpgradeModal(true)
        if (data.scanUsage) setScanUsage(data.scanUsage)
        return
      }

      if (data.success || data.score !== undefined) {
        const result = data.data || data
        setScanResult(result)
        if (result.scanUsage) setScanUsage(result.scanUsage)
        
        const newScan: ScanHistoryItem = {
          id: Date.now().toString(),
          url: activeTab === 'listing' ? url : (sellerEmail || sellerName || 'Seller'),
          type: activeTab,
          platform: activeTab === 'listing' ? detectPlatform(url) : 'Seller Verification',
          score: result.score,
          riskLevel: result.riskLevel,
          scannedAt: new Date().toISOString()
        }
        const updatedHistory = [newScan, ...recentScans].slice(0, 20)
        setRecentScans(updatedHistory)
        localStorage.setItem('lg_scan_history', JSON.stringify(updatedHistory))
      } else {
        setError(data.error?.message || data.error || 'Scan failed')
      }
    } catch {
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
    if (url.includes('rightmove')) return 'Rightmove'
    if (url.includes('propertypro')) return 'Property Pro'
    if (url.includes('jumia')) return 'Jumia House'
    return 'Other'
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error('Checkout error:', error)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-xl bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg">
                  🏠
                </div>
                <span className="text-xl font-bold text-white">
                  LandGuard<span className="text-emerald-400">AI</span>
                </span>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{userName}</div>
                    <div className="text-xs text-slate-400">{isPro ? '⚡ PRO' : `${scanUsage.remaining}/${scanUsage.limit} scans`}</div>
                  </div>
                </div>
                <Link href="/app/account" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {getGreeting()}, {userName} 🏠
              </h1>
              <p className="text-slate-400">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}Protect yourself from property scams
              </p>
            </div>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-emerald-500/25"
              >
                <span>⚡</span>
                Upgrade to PRO
              </button>
            )}
          </div>

          {/* Feature Announcement */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 border border-white/10 p-6 lg:p-8">
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shrink-0">
                  🏘️
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">NEW - V8</span>
                    <span className="text-slate-400 text-sm">Latest Feature</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">🏘️ Property Scam History & Alert System</h3>
                  <p className="text-slate-300 text-sm">
                    Track property scams across platforms, get community alerts, detect price manipulation, and view scam heatmaps. Know if a property has been flagged before you contact the seller!
                  </p>
                </div>
              </div>
              <Link href="/app/property-scams" className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-white/20 rounded-lg text-white text-sm font-medium transition-all shadow-lg">
                Try It Now →
              </Link>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Scanner Card */}
            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => { setActiveTab('listing'); setScanResult(null); setError('') }}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'listing'
                      ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏠 Scan Listing
                </button>
                <button
                  onClick={() => { setActiveTab('seller'); setScanResult(null); setError('') }}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'seller'
                      ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  👤 Verify Seller
                </button>
              </div>

              <div className="p-6 space-y-4">
                {activeTab === 'listing' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Listing URL *</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://facebook.com/marketplace/..."
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title (Optional)</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Property title"
                          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Price (Optional)</label>
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="$25,000"
                          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Seller Name</label>
                      <input
                        type="text"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        placeholder="seller@email.com"
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        placeholder="+1 555-1234"
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleScan}
                  disabled={scanning || (!isPro && scanUsage.remaining <= 0)}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    !isPro && scanUsage.remaining <= 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  }`}
                >
                  {scanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : !isPro && scanUsage.remaining <= 0 ? (
                    <>🔒 Upgrade to Scan</>
                  ) : (
                    <>{activeTab === 'listing' ? '🔍 Scan Listing' : '👤 Verify Seller'}</>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {scanResult && (
                  <div className="p-5 bg-slate-900/50 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Risk Score</div>
                        <div className={`text-4xl font-bold ${
                          scanResult.riskLevel === 'critical' || scanResult.riskLevel === 'high' ? 'text-red-400' :
                          scanResult.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {scanResult.score}/100
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        scanResult.riskLevel === 'critical' || scanResult.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                        scanResult.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {scanResult.riskLevel.toUpperCase()} RISK
                      </div>
                    </div>

                    {scanResult.flags?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">🚩 Risk Flags</h4>
                        <ul className="space-y-2">
                          {scanResult.flags.slice(0, 3).map((flag, i) => (
                            <li key={i} className={`text-sm p-2 rounded-lg ${
                              flag.severity === 'high' || flag.severity === 'critical'
                                ? 'bg-red-500/10 text-red-300'
                                : 'bg-amber-500/10 text-amber-300'
                            }`}>
                              {flag.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold mb-4 ring-4 ring-white/10">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{userName}</h3>
                <p className="text-slate-400 text-sm mb-4">{user?.email}</p>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  isPro 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-slate-700/50 text-slate-300 border border-white/10'
                }`}>
                  {isPro ? '⚡ PRO Member' : '🆓 Free Plan'}
                </div>

                {!isPro && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Scans Used</span>
                      <span className="text-white font-medium">{scanUsage.used}/{scanUsage.limit}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${(scanUsage.used / scanUsage.limit) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{scanUsage.remaining} scans remaining this month</p>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <Link
                    href="/app/account"
                    className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <span className="text-slate-300 text-sm">Account Settings</span>
                    <span className="text-slate-500">→</span>
                  </Link>
                  {!isPro && (
                    <button
                      onClick={handleUpgrade}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      <span>⚡</span> Upgrade to PRO
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
                <span className="text-sm text-slate-400">{recentScans.length} scans</span>
              </div>
              <div className="divide-y divide-white/5">
                {recentScans.slice(0, 5).map((scan) => (
                  <div key={scan.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      scan.riskLevel === 'critical' || scan.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                      scan.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {scan.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate text-sm">{scan.url}</div>
                      <div className="text-xs text-slate-500">{scan.platform} · {new Date(scan.scannedAt).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      scan.riskLevel === 'critical' || scan.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                      scan.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {scan.riskLevel.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supported Platforms */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🌐 Supported Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {['Facebook', 'Kijiji', 'Craigslist', 'Zillow', 'Rightmove', 'Property Pro', 'Jumia House'].map((platform) => (
                <div key={platform} className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                  <span className="text-emerald-500">✓</span>
                  {platform}
                </div>
              ))}
            </div>
          </div>

          {/* Featured Ad Space - Property Scam System */}
          <div className="bg-gradient-to-br from-emerald-900/40 via-teal-900/40 to-cyan-900/40 backdrop-blur-sm border border-emerald-500/30 rounded-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                  ⭐ FEATURED UPDATE
                </span>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-bold rounded-full border border-teal-500/30">
                  NEW IN V8.0
                </span>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    🏘️ Property Scam History & Alert System
                  </h3>
                  <p className="text-slate-300 text-lg mb-6">
                    The most powerful property fraud detection system ever built. Track scams across platforms, 
                    get real-time community alerts, and never fall victim to property fraud again.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</div>
                      <div>
                        <div className="font-semibold text-white">Cross-Platform Scam Tracking</div>
                        <div className="text-sm text-slate-400">Monitor listings across Craigslist, Facebook, Zillow, and more</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</div>
                      <div>
                        <div className="font-semibold text-white">Community Alert Network</div>
                        <div className="text-sm text-slate-400">Get warned when others flag suspicious properties</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</div>
                      <div>
                        <div className="font-semibold text-white">Price Manipulation Detection</div>
                        <div className="text-sm text-slate-400">Catch sellers changing prices to lure victims</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</div>
                      <div>
                        <div className="font-semibold text-white">Seller Pattern Recognition</div>
                        <div className="text-sm text-slate-400">Detect scammers operating multiple fraudulent listings</div>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/app/property-scams"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-emerald-500/25"
                  >
                    <span>🔍 Try Property Scam Scanner</span>
                    <span>→</span>
                  </Link>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/10">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">🏘️</div>
                    <div className="text-2xl font-bold text-white mb-2">Over 1,000+ Scams Detected</div>
                    <div className="text-slate-400">Join our community of protected property buyers</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">500+</div>
                      <div className="text-xs text-slate-400">Properties Flagged</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-teal-400">12</div>
                      <div className="text-xs text-slate-400">Platforms Monitored</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-400">24/7</div>
                      <div className="text-xs text-slate-400">Real-Time Alerts</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="text-sm text-emerald-300">
                        <strong>Pro Tip:</strong> Scan every property before sending a deposit. 
                        Our system checks if the address has been used in previous scams!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-8 border-t border-white/5">
            <p className="text-slate-500 text-sm">
              <span className="text-emerald-400 font-semibold">Moneke Industries</span>
              {' '}· LandGuard AI v8.0 · © {new Date().getFullYear()}
            </p>
          </div>
        </main>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Free Scans Exhausted</h2>
              <p className="text-slate-400 mb-6">
                You've used all <strong className="text-white">{scanUsage.limit} free scans</strong> this month.
              </p>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-emerald-400 mb-2">PRO Features</h3>
                <ul className="text-sm text-emerald-300 space-y-1">
                  <li>✅ Unlimited scans</li>
                  <li>✅ Seller verification</li>
                  <li>✅ Document scanning</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowUpgradeModal(false); handleUpgrade() }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Upgrade to PRO - $9.99/mo
                </button>
                <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-white py-2 text-sm transition-colors">
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
