/**
 * Complete Referral API - LandGuard AI
 * POST /api/referrals/complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { completeReferral } from '@/lib/referral'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const result = await completeReferral(payload.userId)

    if (!result.success) {
      return NextResponse.json({
        success: true,
        message: 'No pending referral to complete',
        inviterRewarded: false,
        inviteeTrial: false
      })
    }

    return NextResponse.json({
      success: true,
      message: result.inviteeTrial 
        ? '🎁 You earned a 7-day Pro trial!' 
        : 'Referral completed!',
      inviterRewarded: result.inviterRewarded,
      inviteeTrial: result.inviteeTrial
    })

  } catch (error) {
    console.error('[Referral] Complete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete referral' },
      { status: 500 }
    )
  }
}

