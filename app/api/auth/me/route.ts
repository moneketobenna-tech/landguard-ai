/**
 * LandGuard AI - Get Current User
 * GET /api/auth/me
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import { getUserById, maskLicenseKey } from '@/lib/db/users'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    const token = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
      response.cookies.delete('lg_token')
      return response
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
      response.cookies.delete('lg_token')
      return response
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        planType: user.planType,
        licenseKey: maskLicenseKey(user.licenseKey),
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('[Me] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' })
  response.cookies.delete('lg_token')
  return response
}

