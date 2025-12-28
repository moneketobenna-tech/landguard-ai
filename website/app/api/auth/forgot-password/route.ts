/**
 * Forgot Password API - LandGuard AI
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@vercel/kv'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://landguardai.co'

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

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    // Import dependencies
    const { getUserByEmail } = await import('@/lib/db/users')
    const nodemailer = await import('nodemailer')

    // Check if user exists
    const user = await getUserByEmail(normalizedEmail)
    
    if (user) {
      // Generate token
      const resetToken = generateResetToken()
      
      // Store in KV
      const kvClient = await getKV()
      if (kvClient) {
        await kvClient.set(
          `reset:${resetToken}`,
          JSON.stringify({
            userId: user.id,
            email: normalizedEmail,
            expiresAt: Date.now() + 3600000
          }),
          { ex: 3600 }
        )
      }
      
      // Send email
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'mail.privateemail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      const resetUrl = `${BASE_URL}/app/reset-password?token=${resetToken}`
      
      await transporter.sendMail({
        from: `"LandGuard AI" <${process.env.SMTP_USER}>`,
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
        <a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Reset Password →</a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">Or copy this link: ${resetUrl}</p>
    </div>
    <div style="background: #f5f7fa; padding: 20px; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">LandGuard AI · Moneke Industries</p>
    </div>
  </div>
</body>
</html>
        `
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })

  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })
  }
}
