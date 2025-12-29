/**
 * LandGuard AI - API Key Management
 */

import { createClient } from '@vercel/kv'
import { ApiKey, ApiTier, API_TIERS } from './types'

// In-memory fallback
const memoryApiKeys = new Map<string, ApiKey>()

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
 * Generate a secure API key
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const prefix = 'lgai_'
  let key = prefix
  
  // Generate 32 random characters
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return key
}

/**
 * Create a new API key
 * NOTE: This function should only be called after verifying the user has userType='business'
 */
export async function createApiKey(
  userId: string,
  tier: ApiTier,
  name: string
): Promise<ApiKey> {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  
  const apiKey: ApiKey = {
    id: `key_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    key: generateApiKey(),
    userId,
    tier,
    name,
    createdAt: now.toISOString(),
    usageCount: 0,
    monthlyUsage: 0,
    monthlyReset: nextMonth.toISOString(),
    isActive: true
  }

  const kv = await getKV()
  
  if (kv) {
    await kv.set(`apikey:${apiKey.key}`, JSON.stringify(apiKey))
    // Index by user
    const userKeys = await getUserApiKeys(userId)
    userKeys.push(apiKey.id)
    await kv.set(`user:${userId}:apikeys`, JSON.stringify(userKeys))
  } else {
    memoryApiKeys.set(apiKey.key, apiKey)
  }

  return apiKey
}

/**
 * Get API key by key string
 */
export async function getApiKey(key: string): Promise<ApiKey | null> {
  const kv = await getKV()
  
  if (kv) {
    const data = await kv.get(`apikey:${key}`)
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data as ApiKey
  }
  
  return memoryApiKeys.get(key) || null
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<string[]> {
  const kv = await getKV()
  
  if (kv) {
    const data = await kv.get(`user:${userId}:apikeys`)
    if (!data) return []
    return typeof data === 'string' ? JSON.parse(data) : data as string[]
  }
  
  return Array.from(memoryApiKeys.values())
    .filter(k => k.userId === userId)
    .map(k => k.id)
}

/**
 * Validate API key and check permissions
 */
export async function validateApiKey(
  key: string,
  endpoint: string
): Promise<{
  valid: boolean
  apiKey?: ApiKey
  error?: string
  errorCode?: string
}> {
  const apiKey = await getApiKey(key)
  
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key', errorCode: 'INVALID_KEY' }
  }
  
  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is disabled', errorCode: 'KEY_DISABLED' }
  }
  
  // Check monthly reset
  const now = new Date()
  const resetDate = new Date(apiKey.monthlyReset)
  if (now >= resetDate) {
    // Reset monthly usage
    apiKey.monthlyUsage = 0
    apiKey.monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    await updateApiKey(apiKey)
  }
  
  // Check rate limit
  const tierConfig = API_TIERS[apiKey.tier]
  if (tierConfig.monthlyCredits !== -1 && apiKey.monthlyUsage >= tierConfig.monthlyCredits) {
    return { 
      valid: false, 
      error: 'Monthly credit limit exceeded', 
      errorCode: 'RATE_LIMIT_EXCEEDED',
      apiKey 
    }
  }
  
  // Check endpoint access
  if (!tierConfig.endpoints.includes(endpoint)) {
    return { 
      valid: false, 
      error: `Endpoint '${endpoint}' not available in ${tierConfig.name} tier`, 
      errorCode: 'ENDPOINT_NOT_ALLOWED',
      apiKey 
    }
  }
  
  return { valid: true, apiKey }
}

/**
 * Update API key
 */
export async function updateApiKey(apiKey: ApiKey): Promise<void> {
  const kv = await getKV()
  
  if (kv) {
    await kv.set(`apikey:${apiKey.key}`, JSON.stringify(apiKey))
  } else {
    memoryApiKeys.set(apiKey.key, apiKey)
  }
}

/**
 * Record API usage
 */
export async function recordApiUsage(key: string, credits: number = 1): Promise<void> {
  const apiKey = await getApiKey(key)
  if (!apiKey) return
  
  apiKey.usageCount += credits
  apiKey.monthlyUsage += credits
  apiKey.lastUsedAt = new Date().toISOString()
  
  await updateApiKey(apiKey)
}

/**
 * Revoke API key
 */
export async function revokeApiKey(key: string): Promise<boolean> {
  const apiKey = await getApiKey(key)
  if (!apiKey) return false
  
  apiKey.isActive = false
  await updateApiKey(apiKey)
  return true
}

/**
 * Get usage stats for an API key
 */
export async function getApiKeyStats(key: string): Promise<{
  totalUsage: number
  monthlyUsage: number
  monthlyLimit: number
  remainingCredits: number
  tier: string
} | null> {
  const apiKey = await getApiKey(key)
  if (!apiKey) return null
  
  const tierConfig = API_TIERS[apiKey.tier]
  const monthlyLimit = tierConfig.monthlyCredits
  const remainingCredits = monthlyLimit === -1 
    ? -1 
    : Math.max(0, monthlyLimit - apiKey.monthlyUsage)
  
  return {
    totalUsage: apiKey.usageCount,
    monthlyUsage: apiKey.monthlyUsage,
    monthlyLimit,
    remainingCredits,
    tier: tierConfig.name
  }
}

