/**
 * Auto-Scan Types - LandGuard AI
 * Type definitions for the automatic scanning feature (Pro users only)
 */

export interface AutoScanSettings {
  enabled: boolean
  interval: AutoScanInterval
  notifyOnRiskChange: boolean
  notifyOnHighRisk: boolean
  scanOnLogin: boolean
  lastScanAt?: string
  nextScanAt?: string
}

export type AutoScanInterval = '30m' | '1h' | '6h' | '12h' | '24h'

export interface SavedListing {
  id: string
  url: string
  title?: string
  platform?: string
  price?: number
  location?: string
  addedAt: string
  lastScanScore?: number
  lastScanRisk?: 'low' | 'medium' | 'high' | 'critical'
  lastScanAt?: string
}

export interface AutoScanResult {
  listingUrl: string
  title?: string
  previousScore: number
  currentScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  previousRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskChanged: boolean
  scannedAt: string
  flags: string[]
}

export interface AutoScanHistory {
  id: string
  userId: string
  results: AutoScanResult[]
  totalScanned: number
  riskChanges: number
  createdAt: string
}

export const AUTO_SCAN_INTERVALS: { value: AutoScanInterval; label: string; minutes: number }[] = [
  { value: '30m', label: 'Every 30 minutes', minutes: 30 },
  { value: '1h', label: 'Every hour', minutes: 60 },
  { value: '6h', label: 'Every 6 hours', minutes: 360 },
  { value: '12h', label: 'Every 12 hours', minutes: 720 },
  { value: '24h', label: 'Once a day', minutes: 1440 },
]

export const DEFAULT_AUTO_SCAN_SETTINGS: AutoScanSettings = {
  enabled: false,
  interval: '6h',
  notifyOnRiskChange: true,
  notifyOnHighRisk: true,
  scanOnLogin: true,
}

