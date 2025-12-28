/**
 * Reset Password API - LandGuard AI
 * POST /api/auth/reset-password
 * 
 * Resets the user's password using a valid reset token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/db/users'
import bcrypt from 'bcryptjs'
import { createClient } from '@vercel/kv'

export const dynamic = 'force-dynamic'

interface ResetTokenData {
  userId: string
  email: string
  expiresAt: number
}

async function getKV() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'New password is required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Get KV client
    const kvClient = await getKV()
    if (!kvClient) {
      return NextResponse.json(
        { success: false, error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Get and validate reset token
    const tokenDataRaw = await kvClient.get(`reset:${token}`)
    if (!tokenDataRaw) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    // Parse token data
    let tokenData: ResetTokenData
    if (typeof tokenDataRaw === 'string') {
      tokenData = JSON.parse(tokenDataRaw)
    } else {
      tokenData = tokenDataRaw as ResetTokenData
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      // Delete expired token
      await kvClient.del(`reset:${token}`)
      return NextResponse.json(
        { success: false, error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Get user
    const user = await getUserById(tokenData.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12)
    await updateUser(user.id, { passwordHash })

    // Delete used reset token
    await kvClient.del(`reset:${token}`)

    console.log(`[Auth] Password reset successful for: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('[Auth] Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}

