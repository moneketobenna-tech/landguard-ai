/**
 * Forgot Password API - LandGuard AI
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset email to the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db/users'
import { sendPasswordResetEmail } from '@/lib/email'
import { createClient } from '@vercel/kv'

export const dynamic = 'force-dynamic'

// Token expiry: 1 hour
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await getUserByEmail(normalizedEmail)
    
    // Always return success to prevent email enumeration attacks
    if (user) {
      // Generate reset token
      const resetToken = generateResetToken()
      const expiresAt = Date.now() + RESET_TOKEN_EXPIRY

      // Store reset token in KV
      const kvClient = await getKV()
      if (kvClient) {
        await kvClient.set(
          `reset:${resetToken}`,
          JSON.stringify({
            userId: user.id,
            email: normalizedEmail,
            expiresAt
          }),
          { ex: 3600 } // Expire after 1 hour
        )
        
        console.log(`[Auth] Password reset token generated for: ${normalizedEmail}`)
        
        // Send password reset email
        await sendPasswordResetEmail(normalizedEmail, resetToken)
      } else {
        console.warn('[Auth] KV not available, cannot store reset token')
      }
    } else {
      console.log(`[Auth] Password reset requested for non-existent email: ${normalizedEmail}`)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })

  } catch (error) {
    console.error('[Auth] Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}

