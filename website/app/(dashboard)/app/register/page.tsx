'use client'

/**
 * Register Page - LandGuard AI
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, isAuthenticated } = useAuth()
  const [step, setStep] = useState<'userType' | 'details'>('userType')
  const [userType, setUserType] = useState<'customer' | 'business' | ''>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/app')
    }
  }, [isLoading, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain uppercase, lowercase, and a number')
      return
    }

    setSubmitting(true)

    const result = await register(email, password, userType as 'customer' | 'business')
    
    if (result.success) {
      router.push('/app')
    } else {
      setError(result.error || 'Registration failed')
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-3 text-gray-900 hover:text-green-600 transition-colors">
          <span className="text-3xl">🏡</span>
          <span className="text-xl font-bold">
            LandGuard<span className="text-green-600"> AI</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
          {/* Register Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="inline-block text-6xl mb-4">🏡</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 'userType' ? 'Create Account' : 'Account Details'}
              </h1>
              <p className="text-gray-600">
                {step === 'userType' ? 'Choose your account type' : 'Complete your registration'}
              </p>
            </div>

            {/* Step 1: User Type Selection */}
            {step === 'userType' && (
              <div className="space-y-4">
                {/* Customer Option */}
                <button
                  type="button"
                  onClick={() => {
                    setUserType('customer')
                    setStep('details')
                  }}
                  className="w-full p-6 text-left border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">I'm a Customer</h3>
                      <p className="text-sm text-gray-600">Individual looking for property protection</p>
                    </div>
                    <span className="text-green-500 text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <div className="pl-16 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Listing scanning & analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Chrome extension</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Scam alerts</span>
                    </div>
                  </div>
                </button>

                {/* Business Option */}
                <button
                  type="button"
                  onClick={() => {
                    setUserType('business')
                    setStep('details')
                  }}
                  className="w-full p-6 text-left border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0">
                      🏢
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">I'm a Business</h3>
                      <p className="text-sm text-gray-600">Company needing API access & integrations</p>
                    </div>
                    <span className="text-purple-500 text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <div className="pl-16 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Everything in Customer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>API access & keys</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Bulk scanning & integrations</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Registration Details */}
            {step === 'details' && (
              <div>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('userType')
                    setError('')
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                  <span>←</span> Change account type
                </button>

                {/* User Type Badge */}
                <div className={`mb-5 p-3 rounded-xl border ${
                  userType === 'customer' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{userType === 'customer' ? '👤' : '🏢'}</span>
                    <span className={`text-sm font-semibold ${
                      userType === 'customer' ? 'text-blue-700' : 'text-purple-700'
                    }`}>
                      {userType === 'customer' ? 'Customer Account' : 'Business Account'}
            </span>
                  </div>
        </div>

                {/* Error Message */}
          {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                    <span>⚠️</span>
              {error}
            </div>
          )}

                {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                      required
                placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
                    <p className="mt-1 text-xs text-gray-500">
                      Must include uppercase, lowercase, and a number
                    </p>
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Creating Account...
                </>
              ) : (
                      <>
                        Create Account
                        <span>→</span>
                      </>
              )}
            </button>
          </form>
              </div>
            )}

            {/* Login Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
              Already have an account?{' '}
                <Link href="/app/login" className="text-green-600 font-semibold hover:text-green-700">
                Sign in
              </Link>
            </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5 shadow-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">What you'll get:</h3>
            <div className="space-y-2">
              {[
                'Free listing scanning & risk analysis',
                'Property scam detection',
                'AI-powered fraud alerts',
                'Chrome extension access'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  {item}
              </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <p className="mt-5 text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-gray-700 hover:text-gray-900">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-gray-700 hover:text-gray-900">Privacy Policy</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-gray-600">
          <span className="text-green-600 font-semibold">Guard AI Systems</span> · LandGuard AI © 2025
        </p>
      </footer>
    </div>
  )
}
