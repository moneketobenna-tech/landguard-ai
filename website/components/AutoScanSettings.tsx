'use client'

/**
 * Auto-Scan Settings Component - LandGuard AI
 * Allows Pro users to configure automatic property listing scanning
 */

import { useState, useEffect } from 'react'
import { AutoScanSettings as AutoScanSettingsType, AUTO_SCAN_INTERVALS, SavedListing } from '@/lib/autoscan/types'

interface AutoScanSettingsProps {
  isPro: boolean
  authToken?: string
}

export default function AutoScanSettings({ isPro, authToken }: AutoScanSettingsProps) {
  const [settings, setSettings] = useState<AutoScanSettingsType | null>(null)
  const [savedListings, setSavedListings] = useState<SavedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newListing, setNewListing] = useState({ url: '', title: '' })
  const [addingListing, setAddingListing] = useState(false)

  // Fetch settings and saved listings
  useEffect(() => {
    if (!isPro || !authToken) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const [settingsRes, savedRes] = await Promise.all([
          fetch('/api/autoscan/settings', {
            headers: { Authorization: `Bearer ${authToken}` }
          }),
          fetch('/api/autoscan/saved', {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings)
        }

        if (savedRes.ok) {
          const data = await savedRes.json()
          setSavedListings(data.listings || [])
        }
      } catch (err) {
        console.error('Failed to fetch auto-scan data:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isPro, authToken])

  // Toggle auto-scan
  const toggleAutoScan = async () => {
    if (!settings || !authToken) return
    
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/autoscan/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ enabled: !settings.enabled })
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update')
      }
    } catch (err) {
      setError('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  // Update interval
  const updateInterval = async (interval: string) => {
    if (!authToken) return
    
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/autoscan/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ interval })
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (err) {
      setError('Failed to update interval')
    } finally {
      setSaving(false)
    }
  }

  // Add listing
  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListing.url || !authToken) return

    setAddingListing(true)
    setError(null)

    try {
      const res = await fetch('/api/autoscan/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(newListing)
      })

      if (res.ok) {
        const data = await res.json()
        setSavedListings([...savedListings, data.listing])
        setNewListing({ url: '', title: '' })
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add listing')
      }
    } catch (err) {
      setError('Failed to add listing')
    } finally {
      setAddingListing(false)
    }
  }

  // Remove listing
  const handleRemoveListing = async (listingId: string) => {
    if (!authToken) return

    try {
      const res = await fetch(`/api/autoscan/saved?id=${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (res.ok) {
        setSavedListings(savedListings.filter(l => l.id !== listingId))
      }
    } catch (err) {
      setError('Failed to remove listing')
    }
  }

  // Not a Pro user
  if (!isPro) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-gray-900">Auto-Scan (Pro Feature)</h3>
            <p className="text-sm text-gray-600">
              Automatically monitor your saved property listings 24/7
            </p>
          </div>
        </div>
        <ul className="text-sm text-gray-700 space-y-2 mb-4">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Monitor up to 50 listings automatically
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Get alerts when risk levels change
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Customizable scan intervals (30m - 24h)
          </li>
        </ul>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
          <span>→</span>
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-green-100 rounded w-32"></div>
            <div className="h-3 bg-green-50 rounded w-48"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-green-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-xl">🔄</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Auto-Scan</h3>
            <p className="text-sm text-gray-500">
              {settings?.enabled ? 'Monitoring your saved listings' : 'Automatic monitoring disabled'}
            </p>
          </div>
        </div>
        
        {/* Toggle */}
        <button
          onClick={toggleAutoScan}
          disabled={saving}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            settings?.enabled ? 'bg-green-500' : 'bg-gray-300'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
              settings?.enabled ? 'left-8' : 'left-1'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Settings */}
      {settings?.enabled && (
        <div className="p-4 border-b border-green-100 bg-green-50/30">
          <label className="block text-sm text-gray-600 mb-2">Scan Interval</label>
          <div className="flex flex-wrap gap-2">
            {AUTO_SCAN_INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => updateInterval(interval.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  settings.interval === interval.value
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 border border-green-200 hover:bg-green-50'
                }`}
              >
                {interval.label}
              </button>
            ))}
          </div>
          
          {settings.lastScanAt && (
            <p className="mt-3 text-xs text-gray-500">
              Last scan: {new Date(settings.lastScanAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Saved Listings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">
            Saved Listings ({savedListings.length}/50)
          </h4>
        </div>

        {/* Add Listing Form */}
        <form onSubmit={handleAddListing} className="mb-4 space-y-2">
          <input
            type="url"
            placeholder="Paste property listing URL..."
            value={newListing.url}
            onChange={(e) => setNewListing({ ...newListing, url: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-green-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Description (optional)"
              value={newListing.title}
              onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-50 border border-green-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
            <button
              type="submit"
              disabled={addingListing || !newListing.url}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addingListing ? '...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Listing Items */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {savedListings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No listings saved. Add property URLs above to start monitoring.
            </p>
          ) : (
            savedListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-green-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {listing.title || new URL(listing.url).hostname}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {listing.url}
                  </div>
                  {listing.lastScanScore !== undefined && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${
                        listing.lastScanRisk === 'low' ? 'text-green-600' :
                        listing.lastScanRisk === 'medium' ? 'text-yellow-600' :
                        listing.lastScanRisk === 'high' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        Risk Score: {listing.lastScanScore}
                      </span>
                      {listing.lastScanAt && (
                        <span className="text-xs text-gray-400">
                          · {new Date(listing.lastScanAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveListing(listing.id)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove from monitoring"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


