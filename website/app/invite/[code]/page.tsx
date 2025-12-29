'use client'

/**
 * Invite Landing Page - LandGuard AI
 * Handles referral links: /invite/{CODE}
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      localStorage.setItem('referralCode', code.toUpperCase())
      setLoading(false)
    }
  }, [code])

  const handleGetStarted = () => {
    router.push(`/app/register?ref=${code}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-slate-700">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Gift Card Design */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LandGuard AI</h1>
                <p className="text-green-200 text-sm">Property Scam Detection</p>
              </div>
            </div>

            {/* Gift Message */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm text-white mb-4">
                <span>🎁</span>
                <span>You&apos;ve been invited!</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Get 7 Days of Pro FREE
              </h2>
              <p className="text-green-100 text-lg">
                Your friend invited you to try LandGuard AI Pro. 
                Scan any property listing for scams and fraud instantly.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {[
                'Deep property listing analysis',
                'Real-time scam detection',
                'Fake agent verification',
                'Unlimited scans for 7 days'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-white">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="w-full bg-white text-green-700 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Claim Your Free Trial →
            </button>

            {/* Referral Code */}
            <div className="mt-6 text-center">
              <p className="text-green-200 text-sm">
                Referral Code: <span className="font-mono font-bold text-white">{code?.toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Already have account */}
        <div className="mt-6 text-center">
          <p className="text-slate-400">
            Already have an account?{' '}
            <Link href="/app/login" className="text-green-400 hover:text-green-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span>No Card Required</span>
          </div>
        </div>
      </div>
    </div>
  )
}

