/**
 * Email Templates - LandGuard AI
 * 
 * Professional HTML email templates for transactional emails
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://landguardai.co'

// Common email styles
const styles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 40px 30px; text-align: center; }
  .header-icon { width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 28px; }
  .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
  .content { padding: 40px 30px; }
  .content h2 { color: #1a2b3c; font-size: 22px; margin: 0 0 20px 0; }
  .content p { color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
  .info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .info-box p { margin: 0; color: #1a2b3c; }
  .feature-list { list-style: none; padding: 0; margin: 20px 0; }
  .feature-list li { padding: 10px 0; color: #4a5568; font-size: 15px; }
  .feature-list li::before { content: "✓"; color: #22c55e; font-weight: bold; margin-right: 10px; }
  .footer { background: #f5f7fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { color: #6b7280; font-size: 14px; margin: 0 0 8px 0; }
  .footer a { color: #16a34a; text-decoration: none; }
  .divider { height: 1px; background: #e5e7eb; margin: 30px 0; }
`

/**
 * Welcome email template - sent after registration
 */
export function welcomeEmailTemplate(email: string, licenseKey?: string): { subject: string; html: string } {
  const subject = '🏠 Welcome to LandGuard AI - Your Account is Ready!'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LandGuard AI</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🏠</div>
      <h1>Welcome to LandGuard AI!</h1>
    </div>
    
    <div class="content">
      <h2>Your Account is Ready 🚀</h2>
      
      <p>Hi there!</p>
      
      <p>Thank you for creating your LandGuard AI account. You're now protected by the most advanced AI-powered property listing scam detector.</p>
      
      <div class="info-box">
        <p><strong>Account Email:</strong> ${email}</p>
        ${licenseKey ? `<p><strong>License Key:</strong> ${licenseKey}</p>` : ''}
      </div>
      
      <p>Here's what you can do with your free account:</p>
      
      <ul class="feature-list">
        <li>Scan property listings for potential scams</li>
        <li>Analyze seller profiles and history</li>
        <li>Get up to 3 free scans per month</li>
        <li>Use our Chrome extension for real-time protection</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${BASE_URL}/app" class="btn">Go to Dashboard →</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Guard AI Systems</strong> · LandGuard AI</p>
      <p>Protecting your property investments, one scan at a time.</p>
      <p><a href="${BASE_URL}">landguardai.co</a> · <a href="mailto:support@landguardai.co">support@landguardai.co</a></p>
    </div>
  </div>
</body>
</html>
  `
  
  return { subject, html }
}

/**
 * Password reset email template
 */
export function passwordResetEmailTemplate(
  email: string,
  resetToken: string
): { subject: string; html: string } {
  const resetUrl = `${BASE_URL}/app/reset-password?token=${resetToken}`
  const subject = '🔐 Reset Your LandGuard AI Password'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🔐</div>
      <h1>Password Reset Request</h1>
    </div>
    
    <div class="content">
      <h2>Reset Your Password</h2>
      
      <p>Hi there!</p>
      
      <p>We received a request to reset the password for your LandGuard AI account associated with <strong>${email}</strong>.</p>
      
      <p>Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password →</a>
      </p>
      
      <div class="info-box">
        <p><strong>Didn't request this?</strong></p>
        <p style="margin-top: 8px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7280;">If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 13px; color: #16a34a; word-break: break-all;">${resetUrl}</p>
    </div>
    
    <div class="footer">
      <p><strong>Guard AI Systems</strong> · LandGuard AI</p>
      <p>This is an automated email. Please do not reply.</p>
      <p><a href="${BASE_URL}">landguardai.co</a> · <a href="mailto:support@landguardai.co">support@landguardai.co</a></p>
    </div>
  </div>
</body>
</html>
  `
  
  return { subject, html }
}

/**
 * Subscription confirmation email
 */
export function subscriptionEmailTemplate(
  email: string, 
  planName: string,
  licenseKey: string,
  amount: string
): { subject: string; html: string } {
  const subject = '🎊 Welcome to LandGuard PRO - Subscription Confirmed!'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandGuard PRO - Subscription Confirmed</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🏆</div>
      <h1>You're Now PRO!</h1>
    </div>
    
    <div class="content">
      <h2>Subscription Confirmed</h2>
      
      <p>Hi there!</p>
      
      <p>Thank you for upgrading to <strong>LandGuard ${planName}</strong>! Your subscription is now active.</p>
      
      <div class="info-box">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>License Key:</strong> ${licenseKey}</p>
        <p><strong>Status:</strong> ✅ Active</p>
      </div>
      
      <p><strong>Your PRO Benefits:</strong></p>
      
      <ul class="feature-list">
        <li>Unlimited property scans</li>
        <li>Advanced fraud detection</li>
        <li>Priority customer support</li>
        <li>API access for developers</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${BASE_URL}/app" class="btn">Access PRO Dashboard →</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Guard AI Systems</strong> · LandGuard AI PRO</p>
      <p>Thank you for trusting us!</p>
      <p><a href="${BASE_URL}">landguardai.co</a> · <a href="mailto:support@landguardai.co">support@landguardai.co</a></p>
    </div>
  </div>
</body>
</html>
  `
  
  return { subject, html }
}

