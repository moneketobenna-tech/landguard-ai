'use client'

/**
 * Property Scam History & Alert Dashboard - LandGuard AI v8
 * Track property scams, view alerts, and monitor watchlist
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import type { 
  PropertyRecord, 
  PropertyListing, 
  CommunityAlert, 
  PropertyWatch,
  PropertyStats,
  CheckPropertyResponse
} from '@/types/property-scam'

export default function PropertyScamsPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'scanner' | 'watchlist' | 'nearby'>('scanner')
  
  // Scanner state
  const [scanAddress, setScanAddress] = useState('')
  const [scanCity, setScanCity] = useState('')
  const [scanState, setScanState] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<CheckPropertyResponse | null>(null)
  
  // Watchlist state
  const [watchlist, setWatchlist] = useState<PropertyWatch[]>([])
  const [watchedProperties, setWatchedProperties] = useState<PropertyRecord[]>([])
  
  // Stats
  const [stats, setStats] = useState<PropertyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadWatchlist()
    }
  }, [isAuthenticated])

  const loadWatchlist = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/property/watch', {
        credentials: 'include'
      })
      
      const data = await res.json()
      if (data.success) {
        setWatchlist(data.watches || [])
        setWatchedProperties(data.properties || [])
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scanAddress || !scanCity || !scanState) {
      alert('Please enter address, city, and state')
      return
    }
    
    try {
      setScanning(true)
      const res = await fetch('/api/property/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: scanAddress,
          city: scanCity,
          state: scanState
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setScanResult(data)
      } else {
        alert('Failed to scan property: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to scan:', error)
      alert('Failed to scan property')
    } finally {
      setScanning(false)
    }
  }

  const loadDemoData = async () => {
    try {
      await fetch('/api/property/demo', {
        method: 'POST',
        credentials: 'include'
      })
      alert('Demo data loaded! Try scanning:\n123 Scam Street, Miami, FL')
    } catch (error) {
      console.error('Failed to load demo data:', error)
    }
  }

  const addToWatchlist = async (propertyId: string) => {
    try {
      const res = await fetch('/api/property/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId,
          notificationsEnabled: true
        })
      })
      
      if (res.ok) {
        alert('Property added to watchlist!')
        loadWatchlist()
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'safe': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified_scam': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded border border-red-300">🚨 VERIFIED SCAM</span>
      case 'flagged': return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded border border-orange-300">⚠️ FLAGGED</span>
      case 'under_review': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded border border-yellow-300">🔍 UNDER REVIEW</span>
      case 'cleared': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded border border-green-300">✅ CLEARED</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-300">📋 ACTIVE</span>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cg-light-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cg-blue" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-cg-dark mb-2">🏘️ Property Scam History & Alerts</h1>
          <p className="text-cg-gray-600">Track scams, view alerts, and protect yourself from property fraud</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Watched Properties</div>
            <div className="text-2xl font-bold text-gray-900">{watchlist.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Flagged Near You</div>
            <div className="text-2xl font-bold text-orange-600">0</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Verified Scams</div>
            <div className="text-2xl font-bold text-red-600">0</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Community Scans</div>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'scanner'
                    ? 'border-cg-blue text-cg-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔍 Property Scanner
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'watchlist'
                    ? 'border-cg-blue text-cg-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ⭐ Watchlist
              </button>
              <button
                onClick={() => setActiveTab('nearby')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'nearby'
                    ? 'border-cg-blue text-cg-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📍 Nearby Scams
              </button>
            </div>
          </div>

          {/* Scanner Tab */}
          {activeTab === 'scanner' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Scan a Property</h2>
                <p className="text-sm text-gray-600">Enter property details to check for scam history and alerts</p>
              </div>

              <form onSubmit={handleScan} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={scanAddress}
                    onChange={(e) => setScanAddress(e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cg-blue focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={scanCity}
                      onChange={(e) => setScanCity(e.target.value)}
                      placeholder="Miami"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cg-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={scanState}
                      onChange={(e) => setScanState(e.target.value)}
                      placeholder="FL"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cg-blue focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={scanning}
                    className="flex-1 px-6 py-3 bg-cg-blue text-white rounded-lg font-semibold hover:bg-cg-blue-dark transition-colors disabled:opacity-50"
                  >
                    {scanning ? 'Scanning...' : 'Scan Property'}
                  </button>
                  <button
                    type="button"
                    onClick={loadDemoData}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Load Demo Data
                  </button>
                </div>
              </form>

              {/* Scan Results */}
              {scanResult && (
                <div className="space-y-4">
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Results</h3>
                    
                    {/* Property Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">{scanResult.property.address}</div>
                          <div className="text-sm text-gray-600">{scanResult.property.city}, {scanResult.property.state}</div>
                        </div>
                        {getStatusBadge(scanResult.property.status)}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-3 py-1 rounded-full border ${getRiskColor(scanResult.property.riskLevel)}`}>
                          Risk: {scanResult.property.riskScore}/100 - {scanResult.property.riskLevel.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">Flags: {scanResult.property.totalFlags}</span>
                      </div>
                    </div>

                    {/* Listings */}
                    {scanResult.listings.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">📋 Cross-Platform Listings ({scanResult.listings.length})</h4>
                        <div className="space-y-2">
                          {scanResult.listings.map((listing) => (
                            <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{listing.platform.toUpperCase()}</div>
                                  <div className="text-xs text-gray-500">{listing.sellerName}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">${listing.price.toLocaleString()}</div>
                                  {listing.isFlagged && <span className="text-xs text-red-600">⚠️ Flagged</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Alerts */}
                    {scanResult.alerts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🚨 Community Alerts ({scanResult.alerts.length})</h4>
                        <div className="space-y-2">
                          {scanResult.alerts.map((alert) => (
                            <div key={alert.id} className={`border rounded-lg p-3 ${
                              alert.alertType === 'danger' ? 'bg-red-50 border-red-200' :
                              alert.alertType === 'warning' ? 'bg-orange-50 border-orange-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="font-semibold text-sm mb-1">{alert.title}</div>
                              <div className="text-xs text-gray-700 mb-2">{alert.message}</div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span>👍 {alert.upvotes}</span>
                                <span>👁️ {alert.scanCount} scans</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => addToWatchlist(scanResult.property.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        ⭐ Add to Watchlist
                      </button>
                      <button
                        onClick={() => router.push(`/app/property-scams/report?propertyId=${scanResult.property.id}`)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        🚩 Report Scam
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">⭐ Your Watched Properties</h2>
                <p className="text-sm text-gray-600">Get alerts when watched properties change or get new flags</p>
              </div>

              {watchedProperties.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="font-medium mb-1">No properties in watchlist</div>
                  <div className="text-sm">Scan properties and add them to your watchlist to track changes</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchedProperties.map((property) => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:border-cg-blue transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">{property.address}</div>
                              <div className="text-sm text-gray-600">{property.city}, {property.state}</div>
                            </div>
                            {getStatusBadge(property.status)}
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full border ${getRiskColor(property.riskLevel)}`}>
                            Risk: {property.riskScore}/100
                          </span>
                        </div>
                        <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nearby Scams Tab */}
          {activeTab === 'nearby' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">📍 Nearby Scams & Alerts</h2>
                <p className="text-sm text-gray-600">View flagged properties near your location</p>
              </div>

              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📍</div>
                <div className="font-medium mb-1">Interactive Map Coming Soon</div>
                <div className="text-sm">View heatmap of scam activity in your area</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

