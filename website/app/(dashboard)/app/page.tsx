'use client'

/**
 * Dashboard Home - LandGuard AI v2.0
 * Enhanced property scanner with seller verification and API integration
 * Free users: 3 scans per month
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface RiskFlag {
  id?: string
  category?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  weight?: number
}

interface ScanResult {
  scanId?: string
  score: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  flags: RiskFlag[]
  recommendations: string[]
  metadata?: {
    scannedAt: string
    processingTime?: number
    apiVersion?: string
  }
  scanUsage?: {
    used: number
    remaining: number
    limit: number
    isPro: boolean
  }
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

type ScanTab = 'listing' | 'seller'

const FREE_SCAN_LIMIT = 3

export default function DashboardHome() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, isPro } = useAuth()
  
  // Scanner state
  const [activeTab, setActiveTab] = useState<ScanTab>('listing')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([])
  const [scanUsage, setScanUsage] = useState<ScanUsage>({ used: 0, remaining: FREE_SCAN_LIMIT, limit: FREE_SCAN_LIMIT, isPro: false })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Auto-rescan state (PRO feature)
  const [autoRescan, setAutoRescan] = useState(true)
  const [lastScanTime, setLastScanTime] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(300) // 5 minutes in seconds
  const AUTO_RESCAN_INTERVAL = 300 // 5 minutes (300 seconds)
  
  // Listing inputs
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  
  // Seller inputs
  const [sellerName, setSellerName] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [sellerProfile, setSellerProfile] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch scan usage from API
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

  // Load scan history
  useEffect(() => {
    const saved = localStorage.getItem('lg_scan_history')
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved).slice(0, 10))
      } catch (e) {}
    }
    
    // Load auto-rescan preference
    const autoRescanPref = localStorage.getItem('lg_auto_rescan')
    if (autoRescanPref !== null) {
      setAutoRescan(autoRescanPref === 'true')
    }
  }, [])
  
  // Auto-rescan timer (PRO only)
  useEffect(() => {
    if (!isPro || !autoRescan || !lastScanTime || !scanResult) return
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastScanTime) / 1000)
      const remaining = Math.max(0, AUTO_RESCAN_INTERVAL - elapsed)
      setCountdown(remaining)
      
      // Trigger rescan when countdown reaches 0
      if (remaining === 0 && !scanning && url.trim()) {
        handleScanListing()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isPro, autoRescan, lastScanTime, scanResult, scanning, url])

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

  // Scan listing
  const handleScanListing = async () => {
    if (!url.trim()) {
      setError('Please enter a listing URL')
      return
    }

    // Check scan limit for free users
    if (!isPro && scanUsage.remaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const res = await fetch('/api/v1/scan-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: title || undefined,
          description: description || undefined,
          price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined,
          location: location || undefined
        })
      })

      const data = await res.json()

      // Check if scan limit was reached
      if (data.error === 'SCAN_LIMIT_REACHED') {
        setShowUpgradeModal(true)
        if (data.scanUsage) {
          setScanUsage(data.scanUsage)
        }
        return
      }

      if (data.success || data.scanId || data.score !== undefined) {
        const result = data.data || data
        setScanResult(result)
        
        // Update last scan time for auto-rescan
        setLastScanTime(Date.now())
        setCountdown(AUTO_RESCAN_INTERVAL)
        
        // Update scan usage from response
        if (result.scanUsage) {
          setScanUsage(result.scanUsage)
        }
        
        // Save to history
        const newScan: ScanHistoryItem = {
          id: Date.now().toString(),
          url,
          type: 'listing',
          platform: detectPlatform(url),
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
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  // Scan seller
  const handleScanSeller = async () => {
    if (!sellerName && !sellerEmail && !sellerPhone && !sellerProfile) {
      setError('Please enter at least one seller detail')
      return
    }

    // Check scan limit for free users
    if (!isPro && scanUsage.remaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const res = await fetch('/api/v1/scan-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sellerName || undefined,
          email: sellerEmail || undefined,
          phone: sellerPhone || undefined,
          profileUrl: sellerProfile || undefined
        })
      })

      const data = await res.json()

      // Check if scan limit was reached
      if (data.error === 'SCAN_LIMIT_REACHED') {
        setShowUpgradeModal(true)
        if (data.scanUsage) {
          setScanUsage(data.scanUsage)
        }
        return
      }

      if (data.success || data.scanId || data.score !== undefined) {
        const result = data.data || data
        setScanResult(result)
        
        // Update scan usage from response
        if (result.scanUsage) {
          setScanUsage(result.scanUsage)
        }
        
        // Save to history
        const newScan: ScanHistoryItem = {
          id: Date.now().toString(),
          url: sellerEmail || sellerName || 'Seller',
          type: 'seller',
          platform: 'Seller Verification',
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
    if (url.includes('trulia')) return 'Trulia'
    if (url.includes('redfin')) return 'Redfin'
    return 'Other'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-800 bg-red-100'
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-amber-600 bg-amber-100'
      case 'low': return 'text-green-600 bg-green-100'
      case 'safe': return 'text-green-700 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-800'
      case 'high': return 'text-red-600'
      case 'medium': return 'text-amber-600'
      default: return 'text-green-600'
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

  // Export report as PDF
  const handleExportReport = async (result: ScanResult) => {
    try {
      const res = await fetch('/api/v1/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanResult: result,
          propertyInfo: {
            url: url || undefined,
            title: title || undefined,
            price: price || undefined,
            location: location || undefined
          },
          userInfo: {
            email: user?.email
          }
        })
      })

      const data = await res.json()

      if (data.success && data.html) {
        // Open in new window for printing/saving as PDF
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(data.html)
          printWindow.document.close()
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      } else {
        alert('Failed to generate report. Please try again.')
      }
    } catch (error) {
      console.error('Report export error:', error)
      alert('Failed to generate report. Please try again.')
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
            Protect yourself from property scams. Scan listings and verify sellers before making contact.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">LandGuard AI v2.0</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
              {isPro ? '⚡ PRO' : `${scanUsage.remaining}/${scanUsage.limit} scans left`}
            </span>
          </div>
        </div>

        {/* Pro Banner */}
        {!isPro && (
          <div className={`bg-gradient-to-r ${scanUsage.remaining <= 0 ? 'from-red-50 to-orange-50 border-red-200' : 'from-green-50 to-emerald-50 border-green-200'} border rounded-xl p-6`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{scanUsage.remaining <= 0 ? '🔒' : '⚡'}</span>
                  <span className="font-semibold text-gray-800">
                    {scanUsage.remaining <= 0 ? 'Free Scans Exhausted' : 'Upgrade to PRO'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {scanUsage.remaining <= 0 
                    ? 'You\'ve used all your free scans this month. Upgrade to PRO for unlimited property scans!'
                    : 'Unlimited scans • Seller verification • Document scanning • Auto-scan • Priority support'
                  }
                </p>
                <p className={`text-sm mt-1 ${scanUsage.remaining <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <strong>{scanUsage.remaining} of {scanUsage.limit} scans remaining</strong> this month
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                className={`${scanUsage.remaining <= 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap`}
              >
                {scanUsage.remaining <= 0 ? 'Unlock Unlimited Scans' : 'Upgrade for $9.99/mo'}
              </button>
            </div>
          </div>
        )}

        {/* Scanner Card */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-green-100">
            <button
              onClick={() => { setActiveTab('listing'); setScanResult(null); setError(''); }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'listing' 
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">🏠</span> Scan Listing
            </button>
            <button
              onClick={() => { setActiveTab('seller'); setScanResult(null); setError(''); }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'seller' 
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">👤</span> Verify Seller
            </button>
          </div>
          
          {/* Listing Tab Content */}
          {activeTab === 'listing' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://facebook.com/marketplace/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Property listing title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Optional)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="$25,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste listing description here for better analysis..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                />
              </div>

              <button
                onClick={handleScanListing}
                disabled={scanning}
                className={`w-full ${!isPro && scanUsage.remaining <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-70 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Analyzing Listing...
                  </>
                ) : !isPro && scanUsage.remaining <= 0 ? (
                  <>🔒 Upgrade to Scan</>
                ) : (
                  <>🔍 Scan Listing</>
                )}
              </button>
              
              {/* Auto-Rescan Toggle (PRO only) */}
              {isPro && scanResult && (
                <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl animate-spin-slow">🔄</span>
                    <div>
                      <div className="font-medium text-amber-800 text-sm">Auto-Rescan</div>
                      {autoRescan && (
                        <div className="text-xs text-amber-600">
                          Next scan in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoRescan
                      setAutoRescan(newValue)
                      localStorage.setItem('lg_auto_rescan', String(newValue))
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRescan ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRescan ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Seller Tab Content */}
          {activeTab === 'seller' && (
            <div className="p-6 space-y-4">
              <p className="text-gray-500 text-sm mb-4">
                Enter seller details to check for suspicious patterns and verify legitimacy.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="seller@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="+1 555-123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile URL</label>
                  <input
                    type="url"
                    value={sellerProfile}
                    onChange={(e) => setSellerProfile(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  />
                </div>
              </div>

              <button
                onClick={handleScanSeller}
                disabled={scanning}
                className={`w-full ${!isPro && scanUsage.remaining <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-70 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Verifying Seller...
                  </>
                ) : !isPro && scanUsage.remaining <= 0 ? (
                  <>🔒 Upgrade to Scan</>
                ) : (
                  <>👤 Verify Seller</>
                )}
              </button>
            </div>
          )}

          {/* Error */}
            {error && (
            <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

          {/* Scan Results */}
            {scanResult && (
            <div className="mx-6 mb-6 space-y-4 p-5 bg-gray-50 rounded-xl">
              {/* Score Header */}
              <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Risk Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(scanResult.riskLevel)}`}>
                    {scanResult.score}/100
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(scanResult.riskLevel)}`}>
                    {scanResult.riskLevel.toUpperCase()} RISK
                  </div>
                </div>

                {/* Flags */}
              {scanResult.flags && scanResult.flags.length > 0 && (
                  <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🚩 Risk Flags ({scanResult.flags.length})</h3>
                    <ul className="space-y-2">
                      {scanResult.flags.map((flag, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${
                        flag.severity === 'high' || flag.severity === 'critical' 
                          ? 'bg-red-50 text-red-700' 
                          : flag.severity === 'medium' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-green-50 text-green-700'
                      }`}>
                        <span>{flag.severity === 'high' || flag.severity === 'critical' ? '🚨' : '⚠️'}</span>
                        {flag.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
              {scanResult.recommendations && scanResult.recommendations.length > 0 && (
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

              {/* Metadata */}
              {scanResult.metadata && (
                <div className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                  Scanned {new Date(scanResult.metadata.scannedAt).toLocaleString()}
                  {scanResult.metadata.processingTime && ` • ${scanResult.metadata.processingTime}ms`}
                  {scanResult.metadata.apiVersion && ` • API ${scanResult.metadata.apiVersion}`}
                </div>
              )}

              {/* Export Report Button */}
              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => handleExportReport(scanResult)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  📄 Download PDF Report
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(scanResult, null, 2))
                    alert('Scan results copied to clipboard!')
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm text-gray-600 transition-colors"
                >
                  📋 Copy JSON
                </button>
              </div>
              </div>
            )}
        </div>

        {/* Supported Platforms */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🌐 Supported Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Facebook Marketplace', 'Kijiji', 'Craigslist', 'Zillow', 'Realtor.com', 'Trulia', 'Redfin', 'Zoopla'].map((platform) => (
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
              <h2 className="text-lg font-semibold text-gray-800">📋 Recent Scans</h2>
              <Link 
                href="/app/history" 
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentScans.slice(0, 5).map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    scan.riskLevel === 'critical' || scan.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
                    scan.riskLevel === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-600'
                  } font-bold text-sm`}>
                    {scan.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {scan.type === 'seller' ? '👤' : '🏠'}
                      </span>
                      <span className="font-medium text-gray-800 truncate text-sm">
                      {scan.url}
                      </span>
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

        {/* API Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-3">🔌 API Access</h3>
          <p className="text-gray-600 text-sm mb-4">
            Integrate LandGuard AI into your app or website with our powerful API.
          </p>
          <div className="flex gap-3">
            <a
              href="https://landguardai.co/api/v1"
              target="_blank"
              rel="noopener"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              📚 API Documentation →
            </a>
            <Link
              href="/pricing"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              💰 API Pricing →
            </Link>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Free Scans Exhausted</h2>
              <p className="text-gray-600 mb-6">
                You've used all <strong>{scanUsage.limit} free scans</strong> this month. Upgrade to PRO for unlimited property scans and keep yourself protected from scams!
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">PRO Features</h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>✅ Unlimited property scans</li>
                  <li>✅ Seller verification</li>
                  <li>✅ Document scanning</li>
                  <li>✅ Auto-scan supported sites</li>
                  <li>✅ Priority support</li>
          </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    handleUpgrade()
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Upgrade to PRO - $9.99/mo
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  )
}
