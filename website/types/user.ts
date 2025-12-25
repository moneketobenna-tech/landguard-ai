/**
 * User Types - LandGuard AI
 */

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
}

export interface UserPublic {
  id: string
  email: string
  planType: PlanType
  licenseKey?: string
  createdAt: string
  stripePortalUrl?: string
}

export interface ScanHistory {
  id: string
  userId: string
  url: string
  platform: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  flags: string[]
  scannedAt: string
}

