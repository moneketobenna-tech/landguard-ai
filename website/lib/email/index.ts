/**
 * Email Module - LandGuard AI
 * 
 * Central export for all email functionality
 */

export { sendEmail, isEmailConfigured, verifyEmailConnection } from './service'
export { 
  welcomeEmailTemplate, 
  subscriptionEmailTemplate,
  passwordResetEmailTemplate
} from './templates'

// Convenience functions that combine template + sending
import { sendEmail } from './service'
import { 
  welcomeEmailTemplate,
  passwordResetEmailTemplate
} from './templates'

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(email: string, licenseKey?: string) {
  const { subject, html } = welcomeEmailTemplate(email, licenseKey)
  return sendEmail({ to: email, subject, html })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const { subject, html } = passwordResetEmailTemplate(email, resetToken)
  return sendEmail({ to: email, subject, html })
}

