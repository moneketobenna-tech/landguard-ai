/**
 * LandGuard AI - User Registration
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser, getUserByEmail } from '@/lib/db/users'
import { signToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

interface RegisterRequest {
  email: string
  password: string
  userType?: 'customer' | 'business'
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, password, userType } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser(email, passwordHash, userType)

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      planType: user.planType
    })

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        planType: user.planType,
        userType: user.userType,
        licenseKey: user.licenseKey
      }
    })

    response.cookies.set('lg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('[Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}

