/**
 * Forgot Password API - LandGuard AI
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@vercel/kv'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://landguardai.co'

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
  console.log('====== FORGOT PASSWORD API CALLED (LandGuard User) ======')
  
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      console.log('[ForgotPassword] No email provided')
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[ForgotPassword] Request for email: ${normalizedEmail}`)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    // Import user lookup
    const { getUserByEmail } = await import('@/lib/db/users')

    // Check if user exists
    const user = await getUserByEmail(normalizedEmail)
    console.log(`[ForgotPassword] User found: ${user ? 'YES' : 'NO'}`)
    
    if (!user) {
      console.log(`[ForgotPassword] No user found for ${normalizedEmail} - returning success to prevent enumeration`)
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent a password reset link.'
      })
    }

    // Generate token
    const resetToken = generateResetToken()
    console.log(`[ForgotPassword] Generated token for user: ${user.id}`)
    
    // Store in KV
    const kvClient = await getKV()
    if (kvClient) {
      const tokenData = JSON.stringify({
        userId: user.id,
        email: normalizedEmail,
        expiresAt: Date.now() + 3600000
      })
      
      try {
        await kvClient.set(`reset:${resetToken}`, tokenData, { ex: 3600 })
        console.log(`[ForgotPassword] Token stored in KV`)
      } catch (kvError) {
        console.error(`[ForgotPassword] KV error:`, kvError)
        // Try alternative method
        try {
          await kvClient.setex(`reset:${resetToken}`, 3600, tokenData)
          console.log(`[ForgotPassword] Token stored via setex`)
        } catch (e) {
          console.error(`[ForgotPassword] setex also failed:`, e)
        }
      }
    } else {
      console.warn(`[ForgotPassword] KV not available`)
    }
    
    // Send email
    console.log(`[ForgotPassword] Attempting to send email...`)
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const resetUrl = `${BASE_URL}/app/reset-password?token=${resetToken}`
    
    try {
      const result = await transporter.sendMail({
        from: `"LandGuard AI" <${process.env.SMTP_USER || 'support@landguardai.co'}>`,
        to: normalizedEmail,
        subject: '🔐 Reset Your LandGuard AI Password',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #16a34a 0%, #166534 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Password Reset Request</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1a2b3c;">Reset Your Password 🔐</h2>
      <p style="color: #4a5568;">We received a request to reset the password for <strong>${normalizedEmail}</strong>.</p>
      <p style="color: #4a5568;">Click the button below to reset your password. This link expires in 1 hour.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Reset Password →</a>
      </p>
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #1a2b3c;"><strong>Didn't request this?</strong></p>
        <p style="margin: 8px 0 0 0; color: #4a5568;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Or copy this link: <span style="color: #16a34a;">${resetUrl}</span></p>
    </div>
    <div style="background: #f5f7fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;"><strong>Guard AI Systems</strong> · LandGuard AI</p>
    </div>
  </div>
</body>
</html>
        `
      })
      console.log(`[ForgotPassword] Email sent successfully! MessageId: ${result.messageId}`)
    } catch (emailError) {
      console.error(`[ForgotPassword] Email sending failed:`, emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })

  } catch (error) {
    console.error('[ForgotPassword] Unexpected error:', error)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })
  }
}
