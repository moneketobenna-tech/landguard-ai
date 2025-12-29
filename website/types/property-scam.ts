/**
 * Property Scam History & Alert System Types - LandGuard AI v8
 * 
 * Track property scams, cross-platform listings, and community alerts
 */

export type PropertyStatus = 'active' | 'flagged' | 'verified_scam' | 'cleared' | 'under_review'
export type ListingPlatform = 'craigslist' | 'facebook' | 'rightmove' | 'zillow' | 'realtor' | 'kijiji' | 'juwai' | 'other'
export type ScamType = 'fake_listing' | 'price_manipulation' | 'photo_theft' | 'duplicate_listing' | 'seller_fraud' | 'wire_fraud' | 'rental_scam'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe'

/**
 * Property Record - Core property information
 */
export interface PropertyRecord {
  id: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  latitude?: number
  longitude?: number
  status: PropertyStatus
  riskScore: number // 0-100
  riskLevel: RiskLevel
  firstFlagged?: string // ISO date
  lastChecked: string
  totalFlags: number
  verifiedScam: boolean
  notes?: string
}

/**
 * Property Listing - Individual listing across platforms
 */
export interface PropertyListing {
  id: string
  propertyId: string
  platform: ListingPlatform
  listingUrl: string
  sellerName?: string
  sellerPhone?: string
  sellerEmail?: string
  price: number
  currency: string
  description?: string
  photoUrls: string[]
  listedDate: string
  removedDate?: string
  isActive: boolean
  isFlagged: boolean
  scamTypes: ScamType[]
  flagCount: number
}

/**
 * Scam Report - User-submitted or system-detected scam report
 */
export interface ScamReport {
  id: string
  propertyId: string
  listingId?: string
  reportedBy: string // userId or 'system'
  reporterType: 'user' | 'community' | 'system'
  scamType: ScamType
  severity: RiskLevel
  description: string
  evidence?: string[] // URLs to evidence
  timestamp: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
}

/**
 * Community Alert - Shared warning about a property
 */
export interface CommunityAlert {
  id: string
  propertyId: string
  title: string
  message: string
  alertType: 'warning' | 'danger' | 'info'
  severity: RiskLevel
  createdBy: string // userId
  createdAt: string
  upvotes: number
  downvotes: number
  scanCount: number // How many users scanned this property
  lastScanned?: string
  isActive: boolean
}

/**
 * Seller Profile - Track suspicious seller patterns
 */
export interface SellerProfile {
  id: string
  identifiers: {
    phone?: string[]
    email?: string[]
    name?: string[]
  }
  totalListings: number
  activeListings: number
  flaggedListings: number
  scamReports: number
  platforms: ListingPlatform[]
  firstSeen: string
  lastSeen: string
  riskScore: number
  riskLevel: RiskLevel
  isBlacklisted: boolean
  notes?: string
}

/**
 * Property Watch - User tracking a property
 */
export interface PropertyWatch {
  id: string
  userId: string
  propertyId: string
  addedAt: string
  lastChecked: string
  notificationsEnabled: boolean
  alertTypes: string[] // Types of changes to alert on
}

/**
 * Price History - Track price changes for manipulation detection
 */
export interface PriceHistory {
  id: string
  propertyId: string
  listingId: string
  price: number
  currency: string
  timestamp: string
  priceChange?: number
  percentChange?: number
}

/**
 * Scam Pattern - Detected suspicious patterns
 */
export interface ScamPattern {
  pattern: string
  description: string
  severity: RiskLevel
  confidence: number // 0-100
  detectedAt: string
}

/**
 * Property Statistics
 */
export interface PropertyStats {
  totalProperties: number
  flaggedProperties: number
  verifiedScams: number
  activeAlerts: number
  totalReports: number
  avgRiskScore: number
  scamsByType: Record<ScamType, number>
}

/**
 * Listing History Summary
 */
export interface ListingHistorySummary {
  propertyId: string
  totalListings: number
  platforms: ListingPlatform[]
  priceRange: { min: number; max: number }
  avgPrice: number
  listingFrequency: number // Listings per 30 days
  uniqueSellers: number
  suspiciousActivity: ScamPattern[]
}

/**
 * Nearby Properties - Properties near a location
 */
export interface NearbyProperties {
  properties: PropertyRecord[]
  flaggedCount: number
  scamCount: number
  radius: number // in miles/km
  center: { lat: number; lng: number }
}

/**
 * Request/Response Types
 */
export interface CheckPropertyRequest {
  address: string
  city?: string
  state?: string
  country?: string
  listingUrl?: string
}

export interface CheckPropertyResponse {
  success: boolean
  property: PropertyRecord
  listings: PropertyListing[]
  alerts: CommunityAlert[]
  history: ListingHistorySummary
  nearbyScams: number
}

export interface ReportScamRequest {
  propertyId?: string
  address?: string
  listingUrl?: string
  scamType: ScamType
  description: string
  evidence?: string[]
}

export interface ReportScamResponse {
  success: boolean
  reportId: string
  message: string
}

export interface GetNearbyScamsRequest {
  latitude: number
  longitude: number
  radius?: number // in miles
}

export interface GetNearbyScamsResponse {
  success: boolean
  scams: NearbyProperties
  heatmap: Array<{ lat: number; lng: number; intensity: number }>
}

export interface WatchPropertyRequest {
  propertyId: string
  notificationsEnabled: boolean
}

export interface WatchPropertyResponse {
  success: boolean
  message: string
}

