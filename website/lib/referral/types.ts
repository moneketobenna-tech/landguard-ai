/**
 * Referral System Types - LandGuard AI
 * Type definitions for the viral referral system
 */

export interface ReferralUser {
  id: string
  email: string
  planType: 'free' | 'pro'
  proExpiresAt: string | null
  referralCode: string
  totalReferrals: number
  completedReferrals: number
  freeMonthsEarned: number
  createdAt: string
}

export interface Referral {
  id: string
  inviterId: string
  inviterEmail: string
  inviteeId: string
  inviteeEmail: string
  status: 'pending' | 'completed' | 'rewarded'
  deviceFingerprint?: string
  ipAddress?: string
  createdAt: string
  completedAt?: string
  rewardedAt?: string
}

export interface ReferralReward {
  id: string
  userId: string
  rewardType: 'pro_days' | 'invitee_trial'
  days: number
  activatesAt: string // 24h delay for anti-abuse
  expiresAt: string
  createdAt: string
}

export interface ReferralStatus {
  referralCode: string
  referralLink: string
  completed: number
  pending: number
  required: number
  freeMonthsEarned: number
  maxFreeMonths: number
  totalDaysEarned: number
  maxDays: number
  nextRewardAt: number // How many more needed for next reward
  recentReferrals: {
    email: string // Masked email
    status: string
    date: string
  }[]
}

export interface UseReferralRequest {
  referralCode: string
  deviceFingerprint?: string
}

export interface UseReferralResponse {
  success: boolean
  message: string
  inviterEmail?: string // Masked
}

// Constants
export const REFERRAL_CONFIG = {
  REFERRALS_FOR_REWARD: 3,        // 3 friends = 1 month
  REWARD_DAYS: 30,                 // 30 days per 3 referrals
  MAX_FREE_DAYS: 180,              // 6 months max
  INVITEE_TRIAL_DAYS: 7,          // 7-day trial for invitee
  REWARD_DELAY_HOURS: 24,          // 24h anti-abuse delay
  CODE_LENGTH: 6,                  // 6-char referral code
} as const

// Disposable email domains to block
export const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'sharklasers.com', 'guerrillamail.info', 'grr.la', 'spam4.me',
  'yopmail.com', 'getnada.com', 'mohmal.com', 'tempail.com',
  'dispostable.com', 'mailnesia.com', 'tempmailo.com', 'emailondeck.com'
]

