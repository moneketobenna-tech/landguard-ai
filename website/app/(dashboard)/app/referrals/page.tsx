'use client'

/**
 * Referrals Page - LandGuard AI
 * Full referral management dashboard
 */

import ReferralDashboard from '@/components/ReferralDashboard'

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <ReferralDashboard />
      </div>
    </div>
  )
}

