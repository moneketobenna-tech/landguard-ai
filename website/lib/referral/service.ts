/**
 * Referral Service - LandGuard AI
 * Core business logic for the referral system
 */

import { createClient } from '@vercel/kv'
import { 
  Referral, 
  ReferralReward, 
  ReferralStatus, 
  REFERRAL_CONFIG,
  DISPOSABLE_EMAIL_DOMAINS 
} from './types'

// Generate unique referral code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < REFERRAL_CONFIG.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Mask email for privacy (show first 2 chars and domain)
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

// Check if email is from disposable domain
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain)
}

// Get KV client
async function getKV() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return null
}

/**
 * Get or create referral code for a user
 */
export async function getUserReferralCode(userId: string): Promise<string | null> {
  const kv = await getKV()
  if (!kv) return null

  // Check if user already has a referral code
  const existingCode = await kv.get(`user:${userId}:referral_code`)
  if (existingCode) return existingCode as string

  // Generate new code and ensure uniqueness
  let code: string
  let attempts = 0
  do {
    code = generateReferralCode()
    const existing = await kv.get(`referral_code:${code}`)
    if (!existing) break
    attempts++
  } while (attempts < 10)

  // Store the code
  await kv.set(`user:${userId}:referral_code`, code)
  await kv.set(`referral_code:${code}`, userId) // Reverse lookup

  return code
}

/**
 * Get user ID from referral code
 */
export async function getUserIdFromCode(code: string): Promise<string | null> {
  const kv = await getKV()
  if (!kv) return null
  
  const userId = await kv.get(`referral_code:${code.toUpperCase()}`)
  return userId as string | null
}

/**
 * Register a referral when invitee signs up
 */
export async function useReferralCode(
  inviteeId: string,
  inviteeEmail: string,
  referralCode: string,
  deviceFingerprint?: string,
  ipAddress?: string
): Promise<{ success: boolean; message: string; inviterEmail?: string }> {
  const kv = await getKV()
  if (!kv) return { success: false, message: 'Service unavailable' }

  const code = referralCode.toUpperCase().trim()

  // Get inviter from code
  const inviterId = await getUserIdFromCode(code)
  if (!inviterId) {
    return { success: false, message: 'Invalid referral code' }
  }

  // Prevent self-referral
  if (inviterId === inviteeId) {
    return { success: false, message: 'Cannot use your own referral code' }
  }

  // Check if invitee already used a referral
  const existingReferral = await kv.get(`user:${inviteeId}:referred_by`)
  if (existingReferral) {
    return { success: false, message: 'Already used a referral code' }
  }

  // Check for device fingerprint abuse (one referral per device)
  if (deviceFingerprint) {
    const deviceReferral = await kv.get(`device:${deviceFingerprint}:referral`)
    if (deviceReferral) {
      console.log(`[Referral] Blocked duplicate device: ${deviceFingerprint}`)
      return { success: false, message: 'Device already used for referral' }
    }
  }

  // Check disposable email
  if (isDisposableEmail(inviteeEmail)) {
    console.log(`[Referral] Blocked disposable email: ${inviteeEmail}`)
    return { success: false, message: 'Disposable emails not allowed' }
  }

  // Check if inviter has reached max free months
  const inviterStats = await getReferralStats(inviterId)
  if (inviterStats && inviterStats.totalDaysEarned >= REFERRAL_CONFIG.MAX_FREE_DAYS) {
    // Still allow referral but inviter won't get more rewards
    console.log(`[Referral] Inviter ${inviterId} at max rewards`)
  }

  // Get inviter email for display
  const inviterData = await kv.get(`user:${inviterId}`)
  const inviterEmail = (inviterData as any)?.email || 'Unknown'

  // Create referral record
  const referralId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const referral: Referral = {
    id: referralId,
    inviterId,
    inviterEmail,
    inviteeId,
    inviteeEmail,
    status: 'pending',
    deviceFingerprint,
    ipAddress,
    createdAt: new Date().toISOString()
  }

  // Store referral
  await kv.set(`referral:${referralId}`, JSON.stringify(referral))
  await kv.set(`user:${inviteeId}:referred_by`, inviterId)
  await kv.sadd(`user:${inviterId}:referrals`, referralId)

  // Mark device as used
  if (deviceFingerprint) {
    await kv.set(`device:${deviceFingerprint}:referral`, referralId, { ex: 86400 * 365 })
  }

  console.log(`[Referral] Created: ${inviteeId} referred by ${inviterId}`)

  return { 
    success: true, 
    message: 'Referral registered! Complete a scan to activate rewards.',
    inviterEmail: maskEmail(inviterEmail)
  }
}

/**
 * Complete referral after invitee's first scan
 */
export async function completeReferral(inviteeId: string): Promise<{ 
  success: boolean; 
  inviterRewarded: boolean;
  inviteeTrial: boolean;
}> {
  const kv = await getKV()
  if (!kv) return { success: false, inviterRewarded: false, inviteeTrial: false }

  // Get the referral for this invitee
  const inviterId = await kv.get(`user:${inviteeId}:referred_by`) as string
  if (!inviterId) {
    return { success: false, inviterRewarded: false, inviteeTrial: false }
  }

  // Find the pending referral
  const referralIds = await kv.smembers(`user:${inviterId}:referrals`) as string[]
  let targetReferral: Referral | null = null
  let targetReferralId: string | null = null

  for (const refId of referralIds) {
    const refData = await kv.get(`referral:${refId}`)
    if (refData) {
      const ref = typeof refData === 'string' ? JSON.parse(refData) : refData as Referral
      if (ref.inviteeId === inviteeId && ref.status === 'pending') {
        targetReferral = ref
        targetReferralId = refId
        break
      }
    }
  }

  if (!targetReferral || !targetReferralId) {
    return { success: false, inviterRewarded: false, inviteeTrial: false }
  }

  // Mark referral as completed
  targetReferral.status = 'completed'
  targetReferral.completedAt = new Date().toISOString()
  await kv.set(`referral:${targetReferralId}`, JSON.stringify(targetReferral))

  // Increment completed count for inviter
  await kv.incr(`user:${inviterId}:completed_referrals`)

  // Give invitee their 7-day trial
  let inviteeTrial = false
  const inviteeHasTrial = await kv.get(`user:${inviteeId}:referral_trial`)
  if (!inviteeHasTrial) {
    await grantProDays(inviteeId, REFERRAL_CONFIG.INVITEE_TRIAL_DAYS, 'invitee_trial')
    await kv.set(`user:${inviteeId}:referral_trial`, 'granted')
    inviteeTrial = true
  }

  // Check if inviter should get reward (every 3 completed)
  let inviterRewarded = false
  const completedCount = await kv.get(`user:${inviterId}:completed_referrals`) as number || 0
  const rewardedCount = await kv.get(`user:${inviterId}:rewarded_referrals`) as number || 0
  const unrewardedCount = completedCount - rewardedCount

  if (unrewardedCount >= REFERRAL_CONFIG.REFERRALS_FOR_REWARD) {
    // Check if under max cap
    const totalDaysEarned = await kv.get(`user:${inviterId}:total_referral_days`) as number || 0
    
    if (totalDaysEarned < REFERRAL_CONFIG.MAX_FREE_DAYS) {
      // Grant reward with 24h delay
      await grantProDays(inviterId, REFERRAL_CONFIG.REWARD_DAYS, 'pro_days', true)
      
      // Update rewarded count
      await kv.incrby(`user:${inviterId}:rewarded_referrals`, REFERRAL_CONFIG.REFERRALS_FOR_REWARD)
      await kv.incrby(`user:${inviterId}:total_referral_days`, REFERRAL_CONFIG.REWARD_DAYS)
      
      // Mark referrals as rewarded
      let toReward = REFERRAL_CONFIG.REFERRALS_FOR_REWARD
      for (const refId of referralIds) {
        if (toReward <= 0) break
        const refData = await kv.get(`referral:${refId}`)
        if (refData) {
          const ref = typeof refData === 'string' ? JSON.parse(refData) : refData as Referral
          if (ref.status === 'completed') {
            ref.status = 'rewarded'
            ref.rewardedAt = new Date().toISOString()
            await kv.set(`referral:${refId}`, JSON.stringify(ref))
            toReward--
          }
        }
      }
      
      inviterRewarded = true
      console.log(`[Referral] Rewarded inviter ${inviterId} with ${REFERRAL_CONFIG.REWARD_DAYS} days`)
    }
  }

  console.log(`[Referral] Completed: invitee=${inviteeId}, inviter=${inviterId}, rewarded=${inviterRewarded}`)

  return { success: true, inviterRewarded, inviteeTrial }
}

/**
 * Grant Pro days to a user
 */
async function grantProDays(
  userId: string, 
  days: number, 
  rewardType: 'pro_days' | 'invitee_trial',
  withDelay: boolean = false
): Promise<void> {
  const kv = await getKV()
  if (!kv) return

  const now = new Date()
  const activatesAt = withDelay 
    ? new Date(now.getTime() + REFERRAL_CONFIG.REWARD_DELAY_HOURS * 60 * 60 * 1000)
    : now

  // Get user's current pro expiry
  const userData = await kv.get(`user:${userId}`)
  const user = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : null
  
  let startDate = activatesAt
  if (user?.proExpiresAt) {
    const existingExpiry = new Date(user.proExpiresAt)
    if (existingExpiry > activatesAt) {
      startDate = existingExpiry
    }
  }

  const expiresAt = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)

  // Create reward record
  const rewardId = `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const reward: ReferralReward = {
    id: rewardId,
    userId,
    rewardType,
    days,
    activatesAt: activatesAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  }

  await kv.set(`reward:${rewardId}`, JSON.stringify(reward))
  await kv.sadd(`user:${userId}:rewards`, rewardId)

  // Update user's pro status (if no delay or reward type is invitee trial)
  if (!withDelay || rewardType === 'invitee_trial') {
    if (user) {
      user.planType = 'pro'
      user.proExpiresAt = expiresAt.toISOString()
      await kv.set(`user:${userId}`, JSON.stringify(user))
    }
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStatus | null> {
  const kv = await getKV()
  if (!kv) return null

  const referralCode = await getUserReferralCode(userId)
  if (!referralCode) return null

  const completedCount = await kv.get(`user:${userId}:completed_referrals`) as number || 0
  const totalDaysEarned = await kv.get(`user:${userId}:total_referral_days`) as number || 0
  const rewardedCount = await kv.get(`user:${userId}:rewarded_referrals`) as number || 0

  // Get recent referrals
  const referralIds = await kv.smembers(`user:${userId}:referrals`) as string[]
  const recentReferrals: { email: string; status: string; date: string }[] = []

  for (const refId of referralIds.slice(-10)) { // Last 10
    const refData = await kv.get(`referral:${refId}`)
    if (refData) {
      const ref = typeof refData === 'string' ? JSON.parse(refData) : refData as Referral
      recentReferrals.push({
        email: maskEmail(ref.inviteeEmail),
        status: ref.status,
        date: ref.createdAt
      })
    }
  }

  const pendingCount = referralIds.length - completedCount
  const freeMonthsEarned = Math.floor(totalDaysEarned / 30)
  const progressToNextReward = completedCount - rewardedCount

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://landguardai.co'

  return {
    referralCode,
    referralLink: `${baseUrl}/invite/${referralCode}`,
    completed: completedCount,
    pending: Math.max(0, pendingCount),
    required: REFERRAL_CONFIG.REFERRALS_FOR_REWARD,
    freeMonthsEarned,
    maxFreeMonths: Math.floor(REFERRAL_CONFIG.MAX_FREE_DAYS / 30),
    totalDaysEarned,
    maxDays: REFERRAL_CONFIG.MAX_FREE_DAYS,
    nextRewardAt: REFERRAL_CONFIG.REFERRALS_FOR_REWARD - progressToNextReward,
    recentReferrals: recentReferrals.reverse()
  }
}

/**
 * Process pending rewards (called periodically or on login)
 */
export async function processPendingRewards(userId: string): Promise<void> {
  const kv = await getKV()
  if (!kv) return

  const rewardIds = await kv.smembers(`user:${userId}:rewards`) as string[]
  const now = new Date()

  for (const rewardId of rewardIds) {
    const rewardData = await kv.get(`reward:${rewardId}`)
    if (!rewardData) continue

    const reward = typeof rewardData === 'string' ? JSON.parse(rewardData) : rewardData as ReferralReward
    const activatesAt = new Date(reward.activatesAt)
    const expiresAt = new Date(reward.expiresAt)

    // Check if reward should activate and hasn't expired
    if (activatesAt <= now && expiresAt > now) {
      const userData = await kv.get(`user:${userId}`)
      if (userData) {
        const user = typeof userData === 'string' ? JSON.parse(userData) : userData
        const currentExpiry = user.proExpiresAt ? new Date(user.proExpiresAt) : now
        
        if (expiresAt > currentExpiry) {
          user.planType = 'pro'
          user.proExpiresAt = expiresAt.toISOString()
          await kv.set(`user:${userId}`, JSON.stringify(user))
          console.log(`[Referral] Activated reward ${rewardId} for user ${userId}`)
        }
      }
    }
  }
}

