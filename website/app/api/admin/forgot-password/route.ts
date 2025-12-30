/**
 * Admin Forgot Password API - LandGuard AI
 * Sends the admin password to the verified admin email
 */

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'moneketobenna@gmail.com'
const ADMIN_PASSWORD = 'LandGuardAdmin2025!'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Verify the email matches admin email
    if (email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email does not match admin records' },
        { status: 403 }
      )
    }

    // Send email with admin password
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    await transporter.sendMail({
      from: `"LandGuard AI" <${process.env.SMTP_USER || 'support@landguardai.co'}>`,
      to: ADMIN_EMAIL,
      subject: '🔐 LandGuard AI - Admin Password Recovery',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Admin Password Recovery</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1a2b3c;">Your Admin Password 🔐</h2>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
        You requested your LandGuard AI admin password. Here it is:
      </p>
      
      <div style="background: #f0fdf4; border: 2px solid #22C55E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; color: #1a2b3c; font-size: 13px;">Admin Password</p>
        <p style="margin: 8px 0 0 0; color: #16a34a; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 1px;">
          ${ADMIN_PASSWORD}
        </p>
      </div>
      
      <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice</strong></p>
        <p style="margin: 8px 0 0 0; color: #78350f;">Keep this password secure. Do not share it with anyone.</p>
      </div>
      
      <p style="color: #4a5568; font-size: 14px; margin-top: 24px;">
        If you didn't request this, please contact support immediately.
      </p>
    </div>
    <div style="background: #f5f7fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;"><strong>Guard AI Systems</strong> · LandGuard AI</p>
    </div>
  </div>
</body>
</html>
      `
    })

    console.log(`[Admin] Password recovery email sent to: ${ADMIN_EMAIL}`)

    return NextResponse.json({
      success: true,
      message: 'Password sent to admin email'
    })

  } catch (error) {
    console.error('[Admin] Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send recovery email' },
      { status: 500 }
    )
  }
}

