/**
 * Email Service - LandGuard AI
 * 
 * Handles sending transactional emails via SMTP
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'support@landguardai.co'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'LandGuard AI'

let transporter: Transporter | null = null

/**
 * Get or create email transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth
    })
  }
  return transporter
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass)
}

/**
 * Send an email
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn('[Email] SMTP not configured, skipping email send')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const transport = getTransporter()
    
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    })
    
    console.log(`[Email] Sent to ${options.to}: ${options.subject}`)
    return { success: true }
  } catch (error) {
    console.error('[Email] Send error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!isEmailConfigured()) {
    return false
  }

  try {
    const transport = getTransporter()
    await transport.verify()
    console.log('[Email] SMTP connection verified')
    return true
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error)
    return false
  }
}

