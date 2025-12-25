/**
 * LandGuard AI - User Database v2
 * Uses Vercel KV or in-memory fallback
 * Supports admin functions: ban, unban, delete
 */

import { createClient } from '@vercel/kv'

export type PlanType = 'free' | 'pro' | 'banned'

export interface User {
  id: string
  email: string
  passwordHash: string
  planType: PlanType
  licenseKey?: string
  stripeCustomerId?: string
  createdAt: string
  updatedAt: string
  isBanned?: boolean
  banReason?: string
}

// In-memory storage for development
const memoryUsers = new Map<string, User>()
const memoryEmailIndex = new Map<string, string>()
const memoryUserIdsList: string[] = []

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

function generateId(): string {
  return 'lg_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function generateLicenseKey(isPro: boolean = false): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const prefix = isPro ? 'LGPRO' : ''
  const segments = isPro ? [] : []
  
  if (isPro) segments.push(prefix)
  
  for (let s = 0; s < (isPro ? 3 : 4); s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)]
    }
    segments.push(segment)
  }
  return segments.join('-')
}

/**
 * Get the master list of user IDs
 */
async function getUserIdList(kv: any): Promise<string[]> {
  try {
    const listData = await kv.get('users:all_ids')
    if (!listData) return []
    if (Array.isArray(listData)) return listData
    if (typeof listData === 'string') {
      try { return JSON.parse(listData) } catch { return [] }
    }
    return []
  } catch (e) {
    console.error('[DB] Error getting user ID list:', e)
    return []
  }
}

/**
 * Add a user ID to the master list
 */
async function addUserIdToList(kv: any, userId: string): Promise<void> {
  const currentList = await getUserIdList(kv)
  if (!currentList.includes(userId)) {
    currentList.push(userId)
    await kv.set('users:all_ids', JSON.stringify(currentList))
  }
}

/**
 * Remove a user ID from the master list
 */
async function removeUserIdFromList(kv: any, userId: string): Promise<void> {
  const currentList = await getUserIdList(kv)
  const newList = currentList.filter((id: string) => id !== userId)
  await kv.set('users:all_ids', JSON.stringify(newList))
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim()
  const id = generateId()
  
  const user: User = {
    id,
    email: normalizedEmail,
    passwordHash,
    planType: 'free',
    licenseKey: generateLicenseKey(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBanned: false
  }

  const kv = await getKV()
  
  if (kv) {
    await kv.set(`user:${id}`, JSON.stringify(user))
    await kv.set(`email:${normalizedEmail}`, id)
    await addUserIdToList(kv, id)
    console.log(`[DB/KV] Created user: ${normalizedEmail}`)
  } else {
    memoryUsers.set(id, user)
    memoryEmailIndex.set(normalizedEmail, id)
    memoryUserIdsList.push(id)
    console.log(`[DB/Memory] Created user: ${normalizedEmail}`)
  }

  return user
}

export async function getUserById(id: string): Promise<User | null> {
  const kv = await getKV()
  
  if (kv) {
    const data = await kv.get(`user:${id}`)
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data as User
  }
  
  return memoryUsers.get(id) || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim()
  const kv = await getKV()
  
  if (kv) {
    const userId = await kv.get(`email:${normalizedEmail}`)
    if (!userId) return null
    return getUserById(userId as string)
  }
  
  const userId = memoryEmailIndex.get(normalizedEmail)
  if (!userId) return null
  return memoryUsers.get(userId) || null
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): Promise<User | null> {
  const user = await getUserById(id)
  if (!user) return null

  const updatedUser: User = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  const kv = await getKV()
  if (kv) {
    await kv.set(`user:${id}`, JSON.stringify(updatedUser))
    console.log(`[DB/KV] Updated user: ${user.email}`)
  } else {
    memoryUsers.set(id, updatedUser)
    console.log(`[DB/Memory] Updated user: ${user.email}`)
  }

  return updatedUser
}

export async function updateUserPlan(id: string, planType: PlanType, stripeCustomerId?: string): Promise<User | null> {
  const updates: Partial<User> = { planType }
  if (stripeCustomerId) updates.stripeCustomerId = stripeCustomerId
  if (planType !== 'banned') updates.isBanned = false
  return updateUser(id, updates)
}

/**
 * Ban a user
 */
export async function banUser(id: string, reason?: string): Promise<User | null> {
  console.log(`[DB] Banning user ${id}${reason ? ` - Reason: ${reason}` : ''}`)
  return updateUser(id, { 
    planType: 'banned' as PlanType, 
    isBanned: true,
    banReason: reason 
  })
}

/**
 * Unban a user
 */
export async function unbanUser(id: string): Promise<User | null> {
  console.log(`[DB] Unbanning user ${id}`)
  return updateUser(id, { 
    planType: 'free', 
    isBanned: false,
    banReason: undefined 
  })
}

/**
 * Delete a user permanently
 */
export async function deleteUser(id: string): Promise<boolean> {
  const user = await getUserById(id)
  if (!user) return false

  const kv = await getKV()

  if (kv) {
    await kv.del(`user:${id}`)
    await kv.del(`email:${user.email}`)
    await removeUserIdFromList(kv, id)
    
    if (user.stripeCustomerId) {
      await kv.del(`stripe:${user.stripeCustomerId}`)
    }
    
    console.log(`[DB/KV] Deleted user: ${user.email}`)
  } else {
    memoryUsers.delete(id)
    memoryEmailIndex.delete(user.email)
    const idx = memoryUserIdsList.indexOf(id)
    if (idx > -1) memoryUserIdsList.splice(idx, 1)
    console.log(`[DB/Memory] Deleted user: ${user.email}`)
  }

  return true
}

export async function getAllUsers(): Promise<User[]> {
  const kv = await getKV()
  
  if (kv) {
    try {
      // First try the master ID list
      const userIds = await getUserIdList(kv)
      if (userIds.length > 0) {
        const users: User[] = []
        for (const userId of userIds) {
          const user = await getUserById(userId)
          if (user) users.push(user)
        }
        return users
      }
      
      // Fallback to keys scan
      const keys = await kv.keys('user:*')
      const users: User[] = []
      for (const key of keys) {
        const data = await kv.get(key)
        if (data) {
          users.push(typeof data === 'string' ? JSON.parse(data) : data as User)
        }
      }
      return users
    } catch (e) {
      console.error('[DB/KV] Error fetching all users:', e)
      return []
    }
  }
  
  return Array.from(memoryUsers.values())
}

export async function getUserByStripeId(stripeCustomerId: string): Promise<User | null> {
  const kv = await getKV()
  
  if (kv) {
    const userId = await kv.get(`stripe:${stripeCustomerId}`)
    if (!userId) {
      // Fallback: search all users
      const allUsers = await getAllUsers()
      return allUsers.find(u => u.stripeCustomerId === stripeCustomerId) || null
    }
    return getUserById(userId as string)
  }
  
  // Memory fallback
  const allUsers = Array.from(memoryUsers.values())
  return allUsers.find(u => u.stripeCustomerId === stripeCustomerId) || null
}

export function maskLicenseKey(key?: string): string {
  if (!key) return ''
  const parts = key.split('-')
  if (parts.length < 2) return '****-****-****-****'
  return `${parts[0]}-****-****-${parts[parts.length - 1]}`
}

/**
 * Get debug info for admin
 */
export async function getDbDebugInfo(): Promise<Record<string, any>> {
  const kv = await getKV()
  
  return {
    kvConnected: !!kv,
    timestamp: new Date().toISOString(),
    memoryUsersCount: memoryUsers.size
  }
}
