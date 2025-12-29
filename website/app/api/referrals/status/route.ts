/**
 * Referral Status API - LandGuard AI
 * GET /api/referrals/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReferralStats, processPendingRewards } from '@/lib/referral'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Process any pending rewards first
    await processPendingRewards(payload.userId)

    // Get referral stats
    const stats = await getReferralStats(payload.userId)

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve referral stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...stats
    })

  } catch (error) {
    console.error('[Referral] Status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get referral status' },
      { status: 500 }
    )
  }
}

