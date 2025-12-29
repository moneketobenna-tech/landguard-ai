/**
 * Property Scam Database - LandGuard AI v8
 * Storage and retrieval for property scams, listings, and community alerts
 */

import { createClient } from '@vercel/kv'
import type {
  PropertyRecord,
  PropertyListing,
  ScamReport,
  CommunityAlert,
  SellerProfile,
  PropertyWatch,
  PriceHistory,
  PropertyStats,
  ListingHistorySummary,
  PropertyStatus,
  RiskLevel,
  ScamType,
  ListingPlatform
} from '@/types/property-scam'

// In-memory storage for development
const memoryProperties = new Map<string, PropertyRecord>()
const memoryListings = new Map<string, PropertyListing>()
const memoryReports = new Map<string, ScamReport>()
const memoryAlerts = new Map<string, CommunityAlert>()
const memorySellers = new Map<string, SellerProfile>()
const memoryWatches = new Map<string, PropertyWatch[]>()
const memoryPriceHistory = new Map<string, PriceHistory[]>()

let kvClient: ReturnType<typeof createClient> | null = null

async function getKV() {
  if (kvClient) return kvClient
  
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kvClient = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    return kvClient
  }
  
  return null
}

/**
 * Generate unique IDs
 */
function generatePropertyId(address: string, city: string, state: string): string {
  const normalized = `${address}_${city}_${state}`.toLowerCase().replace(/\s+/g, '_')
  return `prop_${Buffer.from(normalized).toString('base64').slice(0, 16)}`
}

function generateListingId(): string {
  return `listing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateSellerId(identifier: string): string {
  return `seller_${Buffer.from(identifier.toLowerCase()).toString('base64').slice(0, 12)}`
}

/**
 * Calculate property risk score
 */
function calculatePropertyRisk(property: Partial<PropertyRecord>, listings: PropertyListing[], reports: ScamReport[]): number {
  let score = 0
  
  // Base score on flags
  score += Math.min(property.totalFlags || 0, 5) * 10 // Max 50 points
  
  // Verified scam
  if (property.verifiedScam) score += 50
  
  // Multiple listings
  if (listings.length > 3) score += 10
  if (listings.length > 5) score += 10
  
  // Platform diversity (red flag)
  const platforms = new Set(listings.map(l => l.platform))
  if (platforms.size >= 3) score += 15
  
  // Price manipulation
  const prices = listings.map(l => l.price).filter(p => p > 0)
  if (prices.length > 1) {
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceVariance = ((maxPrice - minPrice) / minPrice) * 100
    if (priceVariance > 40) score += 20 // >40% price variance
  }
  
  // Scam reports
  score += Math.min(reports.length, 3) * 10 // Max 30 points
  
  return Math.min(Math.max(score, 0), 100)
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low'
  return 'safe'
}

/**
 * Create or update property record
 */
export async function upsertProperty(data: Omit<PropertyRecord, 'id' | 'riskScore' | 'riskLevel'>): Promise<PropertyRecord> {
  const id = generatePropertyId(data.address, data.city, data.state)
  
  const listings = await getPropertyListings(id)
  const reports = await getPropertyReports(id)
  const riskScore = calculatePropertyRisk(data, listings, reports)
  const riskLevel = getRiskLevel(riskScore)
  
  const property: PropertyRecord = {
    ...data,
    id,
    riskScore,
    riskLevel
  }
  
  const kv = await getKV()
  
  if (kv) {
    await kv.set(`property:${id}`, JSON.stringify(property))
    // Add to location index
    const locationKey = `properties:${data.city}:${data.state}:${data.country}`.toLowerCase()
    const locationProps = await kv.get(locationKey) || []
    const propList: string[] = typeof locationProps === 'string' ? JSON.parse(locationProps) : locationProps
    if (!propList.includes(id)) {
      propList.push(id)
      await kv.set(locationKey, JSON.stringify(propList))
    }
    console.log(`[Property DB] Upserted property: ${data.address}, ${data.city}`)
  } else {
    memoryProperties.set(id, property)
    console.log(`[Property DB/Memory] Upserted property: ${data.address}`)
  }
  
  return property
}

/**
 * Get property by ID
 */
export async function getProperty(id: string): Promise<PropertyRecord | null> {
  const kv = await getKV()
  
  if (kv) {
    const data = await kv.get(`property:${id}`)
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data as PropertyRecord
  }
  
  return memoryProperties.get(id) || null
}

/**
 * Search property by address
 */
export async function findPropertyByAddress(address: string, city: string, state: string): Promise<PropertyRecord | null> {
  const id = generatePropertyId(address, city, state)
  return getProperty(id)
}

/**
 * Add property listing
 */
export async function addPropertyListing(listing: Omit<PropertyListing, 'id'>): Promise<PropertyListing> {
  const id = generateListingId()
  const listingData: PropertyListing = { ...listing, id }
  
  const kv = await getKV()
  
  if (kv) {
    await kv.set(`listing:${id}`, JSON.stringify(listingData))
    // Add to property's listings
    const listingsKey = `property_listings:${listing.propertyId}`
    const listings = await kv.get(listingsKey) || []
    const listingIds: string[] = typeof listings === 'string' ? JSON.parse(listings) : listings
    listingIds.push(id)
    await kv.set(listingsKey, JSON.stringify(listingIds))
    console.log(`[Property DB] Added listing: ${listing.platform}`)
  } else {
    memoryListings.set(id, listingData)
    console.log(`[Property DB/Memory] Added listing: ${listing.platform}`)
  }
  
  return listingData
}

/**
 * Get all listings for a property
 */
export async function getPropertyListings(propertyId: string): Promise<PropertyListing[]> {
  const kv = await getKV()
  
  if (kv) {
    const listings = await kv.get(`property_listings:${propertyId}`) || []
    const listingIds: string[] = typeof listings === 'string' ? JSON.parse(listings) : listings
    const listingPromises = listingIds.map(id => kv.get(`listing:${id}`))
    const listingData = await Promise.all(listingPromises)
    return listingData
      .filter(Boolean)
      .map(data => typeof data === 'string' ? JSON.parse(data) : data as PropertyListing)
  }
  
  return Array.from(memoryListings.values())
    .filter(l => l.propertyId === propertyId)
}

/**
 * Create scam report
 */
export async function createScamReport(report: Omit<ScamReport, 'id'>): Promise<ScamReport> {
  const id = generateReportId()
  const reportData: ScamReport = { ...report, id }
  
  const kv = await getKV()
  
  if (kv) {
    await kv.set(`report:${id}`, JSON.stringify(reportData))
    // Add to property's reports
    const reportsKey = `property_reports:${report.propertyId}`
    const reports = await kv.get(reportsKey) || []
    const reportIds: string[] = typeof reports === 'string' ? JSON.parse(reports) : reports
    reportIds.push(id)
    await kv.set(reportsKey, JSON.stringify(reportIds))
    console.log(`[Property DB] Created scam report: ${report.scamType}`)
  } else {
    memoryReports.set(id, reportData)
    console.log(`[Property DB/Memory] Created scam report: ${report.scamType}`)
  }
  
  return reportData
}

/**
 * Get scam reports for a property
 */
export async function getPropertyReports(propertyId: string): Promise<ScamReport[]> {
  const kv = await getKV()
  
  if (kv) {
    const reports = await kv.get(`property_reports:${propertyId}`) || []
    const reportIds: string[] = typeof reports === 'string' ? JSON.parse(reports) : reports
    const reportPromises = reportIds.map(id => kv.get(`report:${id}`))
    const reportData = await Promise.all(reportPromises)
    return reportData
      .filter(Boolean)
      .map(data => typeof data === 'string' ? JSON.parse(data) : data as ScamReport)
  }
  
  return Array.from(memoryReports.values())
    .filter(r => r.propertyId === propertyId)
}

/**
 * Create community alert
 */
export async function createCommunityAlert(alert: Omit<CommunityAlert, 'id'>): Promise<CommunityAlert> {
  const id = generateAlertId()
  const alertData: CommunityAlert = { ...alert, id }
  
  const kv = await getKV()
  
  if (kv) {
    await kv.set(`alert:${id}`, JSON.stringify(alertData))
    // Add to property's alerts
    const alertsKey = `property_alerts:${alert.propertyId}`
    const alerts = await kv.get(alertsKey) || []
    const alertIds: string[] = typeof alerts === 'string' ? JSON.parse(alerts) : alerts
    alertIds.push(id)
    await kv.set(alertsKey, JSON.stringify(alertIds))
  } else {
    memoryAlerts.set(id, alertData)
  }
  
  return alertData
}

/**
 * Get community alerts for a property
 */
export async function getPropertyAlerts(propertyId: string): Promise<CommunityAlert[]> {
  const kv = await getKV()
  
  if (kv) {
    const alerts = await kv.get(`property_alerts:${propertyId}`) || []
    const alertIds: string[] = typeof alerts === 'string' ? JSON.parse(alerts) : alerts
    const alertPromises = alertIds.map(id => kv.get(`alert:${id}`))
    const alertData = await Promise.all(alertPromises)
    return alertData
      .filter(Boolean)
      .map(data => typeof data === 'string' ? JSON.parse(data) : data as CommunityAlert)
      .filter(a => a.isActive)
  }
  
  return Array.from(memoryAlerts.values())
    .filter(a => a.propertyId === propertyId && a.isActive)
}

/**
 * Update alert scan count
 */
export async function incrementAlertScanCount(alertId: string): Promise<void> {
  const kv = await getKV()
  
  if (kv) {
    const alert = await kv.get(`alert:${alertId}`)
    if (alert) {
      const alertData: CommunityAlert = typeof alert === 'string' ? JSON.parse(alert) : alert
      alertData.scanCount += 1
      alertData.lastScanned = new Date().toISOString()
      await kv.set(`alert:${alertId}`, JSON.stringify(alertData))
    }
  } else {
    const alert = memoryAlerts.get(alertId)
    if (alert) {
      alert.scanCount += 1
      alert.lastScanned = new Date().toISOString()
    }
  }
}

/**
 * Get property statistics
 */
export async function getPropertyStats(): Promise<PropertyStats> {
  const kv = await getKV()
  let properties: PropertyRecord[] = []
  
  if (kv) {
    // This is a simplified version - in production you'd want to track stats separately
    properties = Array.from(memoryProperties.values())
  } else {
    properties = Array.from(memoryProperties.values())
  }
  
  const flaggedProperties = properties.filter(p => p.status === 'flagged' || p.status === 'verified_scam').length
  const verifiedScams = properties.filter(p => p.verifiedScam).length
  const avgRiskScore = properties.length > 0 
    ? properties.reduce((sum, p) => sum + p.riskScore, 0) / properties.length 
    : 0
  
  return {
    totalProperties: properties.length,
    flaggedProperties,
    verifiedScams,
    activeAlerts: memoryAlerts.size,
    totalReports: memoryReports.size,
    avgRiskScore,
    scamsByType: {
      fake_listing: 0,
      price_manipulation: 0,
      photo_theft: 0,
      duplicate_listing: 0,
      seller_fraud: 0,
      wire_fraud: 0,
      rental_scam: 0
    }
  }
}

/**
 * Add property to user's watchlist
 */
export async function addPropertyWatch(userId: string, watch: Omit<PropertyWatch, 'id'>): Promise<PropertyWatch> {
  const id = `watch_${userId}_${watch.propertyId}`
  const watchData: PropertyWatch = { ...watch, id }
  
  const kv = await getKV()
  
  if (kv) {
    const watchesKey = `user_watches:${userId}`
    const watches = await kv.get(watchesKey) || []
    const watchList: PropertyWatch[] = typeof watches === 'string' ? JSON.parse(watches) : watches
    const existingIndex = watchList.findIndex(w => w.propertyId === watch.propertyId)
    if (existingIndex >= 0) {
      watchList[existingIndex] = watchData
    } else {
      watchList.push(watchData)
    }
    await kv.set(watchesKey, JSON.stringify(watchList))
  } else {
    const userWatches = memoryWatches.get(userId) || []
    const existingIndex = userWatches.findIndex(w => w.propertyId === watch.propertyId)
    if (existingIndex >= 0) {
      userWatches[existingIndex] = watchData
    } else {
      userWatches.push(watchData)
    }
    memoryWatches.set(userId, userWatches)
  }
  
  return watchData
}

/**
 * Get user's watched properties
 */
export async function getUserWatchedProperties(userId: string): Promise<PropertyWatch[]> {
  const kv = await getKV()
  
  if (kv) {
    const watches = await kv.get(`user_watches:${userId}`) || []
    return typeof watches === 'string' ? JSON.parse(watches) : watches as PropertyWatch[]
  }
  
  return memoryWatches.get(userId) || []
}

