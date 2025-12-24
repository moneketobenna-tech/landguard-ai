'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleScan = async () => {
    if (!url) return
    setScanning(true)
    setResult(null)

    try {
      const response = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-lg-blue/20">
              <img src="/logo.png" alt="LandGuard AI" className="h-14 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-lg-muted hover:text-lg-silver transition">Features</Link>
            <Link href="#pricing" className="text-lg-muted hover:text-lg-silver transition">Pricing</Link>
            <Link href="/login" className="text-lg-muted hover:text-lg-silver transition">Login</Link>
            <Link href="/download" className="btn-primary text-sm">Get Extension</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-lg-blue/10 border border-lg-blue/30 rounded-full px-4 py-2 mb-8">
            <span className="text-lg-blue text-sm font-medium">🛡️ AI-Powered Protection</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Stop Property Scams
            <br />
            <span className="gradient-text">Before They Start</span>
          </h1>
          
          <p className="text-xl text-lg-muted max-w-3xl mx-auto mb-12">
            LandGuard AI protects buyers from land and property scams before money changes hands. 
            Our AI analyzes listings on Facebook Marketplace, Kijiji, and Craigslist to detect fraud.
          </p>

          {/* Scan Box */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="card p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste listing URL to scan..."
                  className="flex-1 bg-lg-dark border border-white/10 rounded-lg px-4 py-3 text-lg-silver placeholder-lg-muted focus:outline-none focus:border-lg-blue transition"
                />
                <button
                  onClick={handleScan}
                  disabled={scanning || !url}
                  className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanning ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scanning...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">🔍 Scan Listing</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-lg-muted mt-3">
                ⚠️ This is a risk analysis tool, not legal advice or ownership verification.
              </p>
            </div>
          </div>

          {/* Scan Result */}
          {result && (
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Scan Result</h3>
                  <span className={`risk-pill risk-pill-${result.riskLevel}`}>
                    {result.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>
                
                <div className="flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${
                      result.score >= 60 ? 'text-lg-red' : 
                      result.score >= 30 ? 'text-lg-amber' : 'text-lg-safe'
                    }`}>
                      {result.score}
                    </div>
                    <div className="text-sm text-lg-muted">Risk Score</div>
                  </div>
                  <div className="flex-1 text-left">
                    {result.flags?.length > 0 ? (
                      <ul className="space-y-2">
                        {result.flags.slice(0, 3).map((flag: string, i: number) => (
                          <li key={i} className="text-sm text-lg-silver flex items-start gap-2">
                            <span className="text-lg-amber">⚠️</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-lg-safe">✅ No major red flags detected</p>
                    )}
                  </div>
                </div>

                {result.recommendations?.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm text-lg-blue font-semibold mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {result.recommendations.slice(0, 3).map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-lg-muted">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-lg-muted">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>100% Local Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-lg-darker">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Detect Scams Before They Happen</h2>
            <p className="text-lg-muted text-lg">Our AI analyzes dozens of signals to protect you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🚨',
                title: 'Urgency Detection',
                description: 'Flags pressure tactics like "urgent sale", "wire transfer only", and "deposit today"'
              },
              {
                icon: '💳',
                title: 'Payment Red Flags',
                description: 'Warns about untraceable payment requests like gift cards, crypto, and wire transfers'
              },
              {
                icon: '🌍',
                title: 'Remote Seller Alerts',
                description: 'Detects sellers claiming to be overseas or unable to meet in person'
              },
              {
                icon: '📸',
                title: 'Image Analysis',
                description: 'Flags listings with suspiciously few photos or stock images'
              },
              {
                icon: '📝',
                title: 'Template Detection',
                description: 'Identifies generic, copy-paste language common in scam listings'
              },
              {
                icon: '💰',
                title: 'Price Analysis',
                description: 'Warns about unrealistically low prices that are too good to be true'
              }
            ].map((feature, i) => (
              <div key={i} className="card text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-lg-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Sites */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Works Where You Shop</h2>
          <p className="text-lg-muted text-lg mb-12">Automatic protection on popular listing sites</p>
          
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: 'Facebook Marketplace', icon: '📘' },
              { name: 'Kijiji', icon: '🟢' },
              { name: 'Craigslist', icon: '📋' }
            ].map((site, i) => (
              <div key={i} className="card px-8 py-6 flex items-center gap-4">
                <span className="text-3xl">{site.icon}</span>
                <span className="text-lg font-medium">{site.name}</span>
                <span className="text-lg-safe">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-lg-darker">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-lg-muted text-lg">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="text-lg-muted text-sm font-semibold mb-2">FREE</div>
              <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-lg-muted">/month</span></div>
              <ul className="space-y-3 mb-8">
                {[
                  '3 scans per month',
                  'Basic risk analysis',
                  'Chrome extension',
                  'Manual scanning'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-silver">
                    <span className="text-lg-safe">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/download" className="btn-secondary w-full block text-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card border-lg-blue relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lg-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-lg-blue text-sm font-semibold mb-2">PRO</div>
              <div className="text-4xl font-bold mb-4">$9.99<span className="text-lg text-lg-muted">/month</span></div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited scans',
                  'Advanced AI analysis',
                  'Auto-scan on all sites',
                  'Priority support',
                  'Detailed reports',
                  'API access'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-silver">
                    <span className="text-lg-safe">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="btn-primary w-full block text-center">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Don't Become a Victim
          </h2>
          <p className="text-xl text-lg-muted mb-8">
            Property scams cost victims thousands of dollars. Protect yourself with LandGuard AI.
          </p>
          <Link href="/download" className="btn-primary text-lg px-10 py-4 inline-block">
            Get Free Chrome Extension
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <div className="overflow-hidden rounded-lg border border-white/10">
                <img src="/logo.png" alt="LandGuard AI" className="h-12 w-auto" />
              </div>
            </div>
            <div className="flex gap-8 text-lg-muted text-sm">
              <Link href="/privacy" className="hover:text-lg-silver transition">Privacy</Link>
              <Link href="/terms" className="hover:text-lg-silver transition">Terms</Link>
              <Link href="/contact" className="hover:text-lg-silver transition">Contact</Link>
            </div>
            <div className="text-lg-muted text-sm">
              © 2024 LandGuard AI. All rights reserved.
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-lg-muted">
            ⚠️ Disclaimer: This is a risk analysis tool, not legal advice or ownership verification.
          </div>
        </div>
      </footer>
    </main>
  )
}

