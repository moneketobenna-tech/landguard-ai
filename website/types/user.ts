/**
 * User & Auth Types - LandGuard AI
 * 
 * Plan Types:
 * - free: Basic free users (no API access)
 * - pro: Pro users - individual customers (no API access)
 * - business: Business users (API access with starter limits)
 * - enterprise: Enterprise users (API access with higher limits)
 * - banned: Banned users
 */

export type PlanType = 'free' | 'pro' | 'business' | 'enterprise' | 'banned'

/**
 * Check if a plan has API access (business/enterprise only)
 */
export function hasApiAccess(planType: PlanType): boolean {
  return planType === 'business' || planType === 'enterprise'
}

/**
 * Check if a plan is a paid plan
 */
export function isPaidPlan(planType: PlanType): boolean {
  return planType !== 'free' && planType !== 'banned'
}

export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  updatedAt: string
  planType: PlanType
  stripeCustomerId?: string
  licenseKey?: string
  ipAddress?: string
  isBanned?: boolean
  referralCode?: string
  proExpiresAt?: string
}

export interface UserPublic {
  id: string
  email: string
  createdAt: string
  planType: PlanType
  licenseKey?: string
  nextBillingDate?: string
  referralCode?: string
}

export interface AuthTokenPayload {
  userId: string
  email: string
  planType: PlanType
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: UserPublic
  token?: string
  error?: string
}
