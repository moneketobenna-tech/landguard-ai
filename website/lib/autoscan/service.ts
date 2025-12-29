/**
 * Auto-Scan Service - LandGuard AI
 * Handles automatic scanning of saved listings for Pro users
 */

import { getKVClient } from '@/lib/kv/client'
import { 
  AutoScanSettings, 
  SavedListing, 
  AutoScanResult,
  DEFAULT_AUTO_SCAN_SETTINGS,
  AUTO_SCAN_INTERVALS 
} from './types'

const KV_PREFIX = {
  SETTINGS: 'lg:autoscan:settings:',
  SAVED: 'lg:autoscan:saved:',
  HISTORY: 'lg:autoscan:history:',
}

/**
 * Get user's auto-scan settings
 */
export async function getAutoScanSettings(userId: string): Promise<AutoScanSettings> {
  const kvClient = getKVClient()
  if (!kvClient) return DEFAULT_AUTO_SCAN_SETTINGS
  
  try {
    const settings = await kvClient.get(`${KV_PREFIX.SETTINGS}${userId}`)
    return settings ? { ...DEFAULT_AUTO_SCAN_SETTINGS, ...settings as AutoScanSettings } : DEFAULT_AUTO_SCAN_SETTINGS
  } catch (error) {
    console.error('[AutoScan] Error getting settings:', error)
    return DEFAULT_AUTO_SCAN_SETTINGS
  }
}

/**
 * Update user's auto-scan settings
 */
export async function updateAutoScanSettings(
  userId: string, 
  updates: Partial<AutoScanSettings>
): Promise<AutoScanSettings> {
  const kvClient = getKVClient()
  if (!kvClient) throw new Error('KV client not available')
  
  const current = await getAutoScanSettings(userId)
  const updated = { ...current, ...updates }
  
  await kvClient.set(`${KV_PREFIX.SETTINGS}${userId}`, updated)
  
  // Calculate next scan time if enabled
  if (updated.enabled) {
    const interval = AUTO_SCAN_INTERVALS.find(i => i.value === updated.interval)
    if (interval) {
      const nextScanAt = new Date(Date.now() + interval.minutes * 60 * 1000).toISOString()
      updated.nextScanAt = nextScanAt
      await kvClient.set(`${KV_PREFIX.SETTINGS}${userId}`, updated)
    }
  }
  
  return updated
}

/**
 * Get user's saved listings
 */
export async function getSavedListings(userId: string): Promise<SavedListing[]> {
  const kvClient = getKVClient()
  if (!kvClient) return []
  
  try {
    const saved = await kvClient.get(`${KV_PREFIX.SAVED}${userId}`)
    return (saved as SavedListing[]) || []
  } catch (error) {
    console.error('[AutoScan] Error getting saved listings:', error)
    return []
  }
}

/**
 * Add listing to saved
 */
export async function addSavedListing(
  userId: string, 
  listing: Omit<SavedListing, 'id' | 'addedAt'>
): Promise<SavedListing> {
  const kvClient = getKVClient()
  if (!kvClient) throw new Error('KV client not available')
  
  const saved = await getSavedListings(userId)
  
  // Check if already exists
  const existing = saved.find(l => l.url === listing.url)
  if (existing) {
    return existing
  }
  
  // Limit to 50 listings for Pro users
  if (saved.length >= 50) {
    throw new Error('Saved listings limit reached (50)')
  }
  
  const newListing: SavedListing = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...listing,
    addedAt: new Date().toISOString(),
  }
  
  saved.push(newListing)
  await kvClient.set(`${KV_PREFIX.SAVED}${userId}`, saved)
  
  return newListing
}

/**
 * Remove listing from saved
 */
export async function removeSavedListing(userId: string, listingId: string): Promise<boolean> {
  const kvClient = getKVClient()
  if (!kvClient) throw new Error('KV client not available')
  
  const saved = await getSavedListings(userId)
  const index = saved.findIndex(l => l.id === listingId)
  
  if (index === -1) return false
  
  saved.splice(index, 1)
  await kvClient.set(`${KV_PREFIX.SAVED}${userId}`, saved)
  
  return true
}

/**
 * Update saved listing with scan results
 */
export async function updateSavedListing(
  userId: string,
  listingId: string,
  updates: Partial<SavedListing>
): Promise<void> {
  const kvClient = getKVClient()
  if (!kvClient) return
  
  const saved = await getSavedListings(userId)
  const index = saved.findIndex(l => l.id === listingId)
  
  if (index !== -1) {
    saved[index] = { ...saved[index], ...updates }
    await kvClient.set(`${KV_PREFIX.SAVED}${userId}`, saved)
  }
}

/**
 * Record auto-scan results
 */
export async function recordAutoScanResults(
  userId: string,
  results: AutoScanResult[]
): Promise<void> {
  const kvClient = getKVClient()
  if (!kvClient) return
  
  const history = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    results,
    totalScanned: results.length,
    riskChanges: results.filter(r => r.riskChanged).length,
    createdAt: new Date().toISOString(),
  }
  
  const existingHistory = await kvClient.get(`${KV_PREFIX.HISTORY}${userId}`) || []
  const historyArray = Array.isArray(existingHistory) ? existingHistory : []
  
  historyArray.unshift(history)
  if (historyArray.length > 100) {
    historyArray.splice(100)
  }
  
  await kvClient.set(`${KV_PREFIX.HISTORY}${userId}`, historyArray)
  
  await updateAutoScanSettings(userId, {
    lastScanAt: history.createdAt,
  })
}

/**
 * Get auto-scan history
 */
export async function getAutoScanHistory(userId: string, limit = 10): Promise<any[]> {
  const kvClient = getKVClient()
  if (!kvClient) return []
  
  try {
    const history = await kvClient.get(`${KV_PREFIX.HISTORY}${userId}`)
    const historyArray = Array.isArray(history) ? history : []
    return historyArray.slice(0, limit)
  } catch (error) {
    console.error('[AutoScan] Error getting history:', error)
    return []
  }
}

/**
 * Check if user is due for auto-scan
 */
export async function isDueForScan(userId: string): Promise<boolean> {
  const settings = await getAutoScanSettings(userId)
  
  if (!settings.enabled) return false
  if (!settings.lastScanAt) return true
  
  const interval = AUTO_SCAN_INTERVALS.find(i => i.value === settings.interval)
  if (!interval) return false
  
  const lastScan = new Date(settings.lastScanAt).getTime()
  const now = Date.now()
  const intervalMs = interval.minutes * 60 * 1000
  
  return (now - lastScan) >= intervalMs
}


