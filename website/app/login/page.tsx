'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-lg-blue to-lg-green rounded-xl flex items-center justify-center text-2xl">
            🛡️
          </div>
          <span className="text-2xl font-bold text-lg-silver">LandGuard AI</span>
        </Link>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-white/10">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-center font-medium transition ${
                isLogin ? 'text-lg-blue border-b-2 border-lg-blue' : 'text-lg-muted'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-center font-medium transition ${
                !isLogin ? 'text-lg-blue border-b-2 border-lg-blue' : 'text-lg-muted'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-lg-muted mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-lg-dark border border-white/10 rounded-lg px-4 py-3 text-lg-silver focus:outline-none focus:border-lg-blue transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-lg-muted mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-lg-dark border border-white/10 rounded-lg px-4 py-3 text-lg-silver focus:outline-none focus:border-lg-blue transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-lg-red/10 border border-lg-red/30 text-lg-red text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-lg-muted mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-lg-blue hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <Link href="/" className="text-lg-muted hover:text-lg-silver transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}

