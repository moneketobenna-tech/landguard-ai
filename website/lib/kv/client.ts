/**
 * KV Client - LandGuard AI
 * Unified Vercel KV / Upstash Redis client
 */

// Redis client instance - lazily initialized
let kvClient: any = null
let kvConfigCache: { url: string; token: string } | null | undefined = undefined

/**
 * Get KV configuration from environment variables
 */
function getKVConfig(): { url: string; token: string } | null {
  if (kvConfigCache !== undefined) {
    return kvConfigCache
  }
  
  // Check for KV_ prefix (standard Vercel KV)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kvConfigCache = { url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN }
    return kvConfigCache
  }
  
  // Check for UPSTASH_ prefix
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    kvConfigCache = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }
    return kvConfigCache
  }
  
  // Check for REDIS_ REST prefix
  if (process.env.REDIS_REST_API_URL && process.env.REDIS_REST_API_TOKEN) {
    kvConfigCache = { url: process.env.REDIS_REST_API_URL, token: process.env.REDIS_REST_API_TOKEN }
    return kvConfigCache
  }
  
  kvConfigCache = null
  return null
}

/**
 * Initialize KV client
 */
async function initKVClient(): Promise<any> {
  if (kvClient) return kvClient
  
  const config = getKVConfig()
  if (!config) {
    console.log('[KV] No KV config found, client unavailable')
    return null
  }
  
  try {
    const { Redis } = await import('@upstash/redis')
    kvClient = new Redis({
      url: config.url,
      token: config.token,
    })
    console.log('[KV] Client initialized successfully')
    return kvClient
  } catch (error) {
    console.error('[KV] Failed to initialize client:', error)
    return null
  }
}

/**
 * Get the KV client instance
 * Returns null if not available
 */
export function getKVClient(): any {
  if (kvClient) return kvClient
  
  // Initialize synchronously if possible
  const config = getKVConfig()
  if (!config) return null
  
  // Trigger async init but return null for now
  initKVClient().catch(() => {})
  
  // For synchronous calls, create a new instance
  try {
    // Dynamic require for synchronous initialization
    const { Redis } = require('@upstash/redis')
    kvClient = new Redis({
      url: config.url,
      token: config.token,
    })
    return kvClient
  } catch {
    return null
  }
}

/**
 * Get KV client async (preferred)
 */
export async function getKVClientAsync(): Promise<any> {
  return await initKVClient()
}

export default getKVClient

