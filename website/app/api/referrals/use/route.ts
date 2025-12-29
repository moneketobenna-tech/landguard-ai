/**
 * Use Referral Code API - LandGuard AI
 * POST /api/referrals/use
 */

import { NextRequest, NextResponse } from 'next/server'
import { useReferralCode } from '@/lib/referral'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralCode, deviceFingerprint } = body

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
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

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') ||
                      'unknown'

    const result = await useReferralCode(
      payload.userId,
      payload.email,
      referralCode,
      deviceFingerprint,
      ipAddress
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      invitedBy: result.inviterEmail
    })

  } catch (error) {
    console.error('[Referral] Use code error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}

