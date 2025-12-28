'use client'

/**
 * Forgot Password Page - LandGuard AI
 * Allows users to request a password reset email
 */

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!email) {
      setError('Please enter your email address')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch {
      setError('Network error. Please try again.')
    }

    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)' }}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
                🏠
              </div>
              <span className="text-2xl font-bold text-white">
                LandGuard<span className="text-green-300"> AI</span>
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl">
              ✓
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email</h1>
            
            <p className="text-gray-500 mb-6">
              If an account exists for <strong className="text-gray-700">{email}</strong>, we've sent a password reset link. Please check your email and follow the instructions.
            </p>
            
            <p className="text-gray-400 text-sm mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Link href="/app/login" className="text-green-600 hover:text-green-700 font-semibold">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🏠
            </div>
            <span className="text-2xl font-bold text-white">
              LandGuard<span className="text-green-300"> AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-3xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
            <p className="text-gray-500">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </>
              ) : (
                <>Send Reset Link →</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link href="/app/login" className="text-green-600 hover:text-green-700 font-medium">
              ← Back to Login
            </Link>
          </div>
        </div>

        {/* Back to Website */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-green-300 hover:text-white text-sm transition-colors">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}

