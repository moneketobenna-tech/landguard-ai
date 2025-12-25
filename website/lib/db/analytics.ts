/**
 * Analytics Database - LandGuard AI
 * 
 * Tracks usage across all platforms:
 * - Website users
 * - Chrome Extension activations
 * - API requests
 * - Mobile app users
 */

export interface ApiRequest {
  id: string
  endpoint: string
  method: string
  platform: 'web' | 'extension' | 'mobile' | 'api'
  userAgent?: string
  timestamp: string
  userId?: string
  success: boolean
}

export interface ExtensionActivation {
  id: string
  licenseKey?: string
  version: string
  activatedAt: string
  lastSeenAt: string
  scansCount: number
}

export interface MobileUser {
  id: string
  deviceId: string
  platform: 'ios' | 'android'
  version: string
  registeredAt: string
  lastActiveAt: string
  isPro: boolean
}

export interface Analytics {
  totalApiRequests: number
  todayApiRequests: number
  extensionActivations: number
  mobileUsers: number
  scansByPlatform: {
    web: number
    extension: number
    mobile: number
    api: number
  }
}

// In-memory storage
const apiRequests: ApiRequest[] = []
const extensionActivations = new Map<string, ExtensionActivation>()
const mobileUsers = new Map<string, MobileUser>()

/**
 * Log an API request
 */
export function logApiRequest(request: Omit<ApiRequest, 'id' | 'timestamp'>): void {
  const entry: ApiRequest = {
    ...request,
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString()
  }
  apiRequests.push(entry)
  
  // Keep only last 10000 requests to prevent memory issues
  if (apiRequests.length > 10000) {
    apiRequests.shift()
  }
}

/**
 * Track extension activation
 */
export function trackExtensionActivation(
  instanceId: string,
  version: string,
  licenseKey?: string
): void {
  const existing = extensionActivations.get(instanceId)
  
  if (existing) {
    existing.lastSeenAt = new Date().toISOString()
    existing.scansCount++
    if (licenseKey) existing.licenseKey = licenseKey
  } else {
    extensionActivations.set(instanceId, {
      id: instanceId,
      licenseKey,
      version,
      activatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      scansCount: 1
    })
  }
}

/**
 * Track mobile user
 */
export function trackMobileUser(
  deviceId: string,
  platform: 'ios' | 'android',
  version: string,
  isPro: boolean = false
): void {
  const existing = mobileUsers.get(deviceId)
  
  if (existing) {
    existing.lastActiveAt = new Date().toISOString()
    existing.isPro = isPro
    existing.version = version
  } else {
    mobileUsers.set(deviceId, {
      id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      deviceId,
      platform,
      version,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isPro
    })
  }
}

/**
 * Get all analytics data
 */
export function getAnalytics(): Analytics {
  const today = new Date().toDateString()
  
  const todayRequests = apiRequests.filter(r => 
    new Date(r.timestamp).toDateString() === today
  )
  
  const scansByPlatform = {
    web: 0,
    extension: 0,
    mobile: 0,
    api: 0
  }
  
  apiRequests.forEach(r => {
    if (r.endpoint.includes('scan')) {
      scansByPlatform[r.platform]++
    }
  })
  
  return {
    totalApiRequests: apiRequests.length,
    todayApiRequests: todayRequests.length,
    extensionActivations: extensionActivations.size,
    mobileUsers: mobileUsers.size,
    scansByPlatform
  }
}

/**
 * Get recent API requests
 */
export function getRecentRequests(limit: number = 100): ApiRequest[] {
  return apiRequests.slice(-limit).reverse()
}

/**
 * Get all extension activations
 */
export function getExtensionActivations(): ExtensionActivation[] {
  return Array.from(extensionActivations.values())
}

/**
 * Get all mobile users
 */
export function getMobileUsers(): MobileUser[] {
  return Array.from(mobileUsers.values())
}

/**
 * Get active extensions (seen in last 24 hours)
 */
export function getActiveExtensions(): number {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let count = 0
  extensionActivations.forEach(ext => {
    if (new Date(ext.lastSeenAt) > oneDayAgo) count++
  })
  return count
}

/**
 * Get active mobile users (seen in last 24 hours)
 */
export function getActiveMobileUsers(): number {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let count = 0
  mobileUsers.forEach(user => {
    if (new Date(user.lastActiveAt) > oneDayAgo) count++
  })
  return count
}

