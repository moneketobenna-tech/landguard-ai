/**
 * Forgot Password API - LandGuard AI
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset email to the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db/users'
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    console.log(`[Auth] Forgot password request for: ${normalizedEmail}`)

    // Try to get user - wrap in try/catch to handle DB errors gracefully
    let user = null
    try {
      user = await getUserByEmail(normalizedEmail)
    } catch (dbError) {
      console.error('[Auth] Database error while fetching user:', dbError)
      // Continue - we'll return success anyway to prevent email enumeration
    }
    
    // If user exists, try to generate reset token and send email
    if (user) {
      try {
        // Generate reset token
        const resetToken = generateResetToken()
        const expiresAt = Date.now() + RESET_TOKEN_EXPIRY

        // Try to store reset token in KV
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
          
          // Try to send password reset email
          try {
            const { sendPasswordResetEmail } = await import('@/lib/email')
            await sendPasswordResetEmail(normalizedEmail, resetToken)
            console.log(`[Auth] Password reset email sent to: ${normalizedEmail}`)
          } catch (emailError) {
            console.error('[Auth] Failed to send email:', emailError)
          }
        } else {
          console.warn('[Auth] KV not available, cannot store reset token')
        }
      } catch (tokenError) {
        console.error('[Auth] Error generating/storing reset token:', tokenError)
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
    
    // Check if it's a JSON parse error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}
