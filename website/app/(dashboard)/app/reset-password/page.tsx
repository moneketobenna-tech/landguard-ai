'use client'

/**
 * Reset Password Page - LandGuard AI
 * Allows users to set a new password using a reset token
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields')
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

    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/app/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
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
            
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Password Reset!</h1>
            
            <p className="text-gray-500 mb-6">
              Your password has been successfully reset. You'll be redirected to the login page shortly.
            </p>
            
            <Link 
              href="/app/login"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Login →
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
              🔑
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-500">
              Enter your new password below
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
          {token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
                />
              </div>

              <p className="text-gray-400 text-xs">
                Password must be at least 8 characters.
              </p>

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
                    Resetting...
                  </>
                ) : (
                  <>Reset Password →</>
                )}
              </button>
            </form>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

