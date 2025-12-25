'use client'

/**
 * Scan History Page - LandGuard AI
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface ScanHistoryItem {
  id: string
  url: string
  platform: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  flags: string[]
  scannedAt: string
}

export default function HistoryPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()
  const [scans, setScans] = useState<ScanHistoryItem[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/app/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Mock data for demonstration
  useEffect(() => {
    // In production, this would fetch from the API
    setScans([
      {
        id: '1',
        url: 'https://facebook.com/marketplace/item/123456',
        platform: 'Facebook',
        riskScore: 75,
        riskLevel: 'high',
        flags: ['Price too low', 'New account'],
        scannedAt: new Date().toISOString()
      },
      {
        id: '2',
        url: 'https://kijiji.ca/v-apartments-condos/listing/456789',
        platform: 'Kijiji',
        riskScore: 35,
        riskLevel: 'medium',
        flags: ['Limited photos'],
        scannedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        url: 'https://craigslist.org/apa/d/apartment/7812345678.html',
        platform: 'Craigslist',
        riskScore: 15,
        riskLevel: 'low',
        flags: [],
        scannedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ])
  }, [])

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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-amber-600 bg-amber-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredScans = scans.filter(scan => 
    filter === 'all' || scan.riskLevel === filter
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Scan History</h1>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="text-3xl font-bold text-gray-800">{scans.length}</div>
            <div className="text-sm text-gray-500">Total Scans</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="text-3xl font-bold text-red-600">{scans.filter(s => s.riskLevel === 'high').length}</div>
            <div className="text-sm text-gray-500">High Risk</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="text-3xl font-bold text-amber-600">{scans.filter(s => s.riskLevel === 'medium').length}</div>
            <div className="text-sm text-gray-500">Medium Risk</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{scans.filter(s => s.riskLevel === 'low').length}</div>
            <div className="text-sm text-gray-500">Low Risk</div>
          </div>
        </div>

        {/* Scans List */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800">All Scans</h2>
          </div>

          {filteredScans.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No scans found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredScans.map((scan) => (
                <div key={scan.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      scan.riskLevel === 'high' ? 'bg-red-100 text-red-600' :
                      scan.riskLevel === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-green-100 text-green-600'
                    } font-bold text-lg`}>
                      {scan.riskScore}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(scan.riskLevel)}`}>
                          {scan.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{scan.platform}</span>
                      </div>
                      
                      <div className="font-medium text-gray-800 truncate text-sm mb-1">
                        {scan.url}
                      </div>
                      
                      {scan.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {scan.flags.map((flag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        Scanned {new Date(scan.scannedAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

