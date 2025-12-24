/**
 * LandGuard AI - User Database
 * Uses Vercel KV or in-memory fallback
 */

import { createClient } from '@vercel/kv'

export interface User {
  id: string
  email: string
  passwordHash: string
  planType: 'free' | 'pro'
  licenseKey?: string
  stripeCustomerId?: string
  createdAt: string
  updatedAt: string
}

// In-memory storage for development
const memoryUsers = new Map<string, User>()
const memoryEmailIndex = new Map<string, string>()

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

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = []
  for (let s = 0; s < 4; s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)]
    }
    segments.push(segment)
  }
  return segments.join('-')
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
    updatedAt: new Date().toISOString()
  }

  const kv = await getKV()
  
  if (kv) {
    await kv.set(`user:${id}`, JSON.stringify(user))
    await kv.set(`email:${normalizedEmail}`, id)
  } else {
    memoryUsers.set(id, user)
    memoryEmailIndex.set(normalizedEmail, id)
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

export async function updateUserPlan(id: string, planType: 'free' | 'pro', stripeCustomerId?: string): Promise<User | null> {
  const user = await getUserById(id)
  if (!user) return null

  user.planType = planType
  if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId
  user.updatedAt = new Date().toISOString()

  const kv = await getKV()
  if (kv) {
    await kv.set(`user:${id}`, JSON.stringify(user))
  } else {
    memoryUsers.set(id, user)
  }

  return user
}

export async function getAllUsers(): Promise<User[]> {
  const kv = await getKV()
  
  if (kv) {
    const keys = await kv.keys('user:*')
    const users: User[] = []
    for (const key of keys) {
      const data = await kv.get(key)
      if (data) {
        users.push(typeof data === 'string' ? JSON.parse(data) : data as User)
      }
    }
    return users
  }
  
  return Array.from(memoryUsers.values())
}

export function maskLicenseKey(key?: string): string {
  if (!key) return ''
  const parts = key.split('-')
  if (parts.length !== 4) return '****-****-****-****'
  return `${parts[0]}-****-****-${parts[3]}`
}

