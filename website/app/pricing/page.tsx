'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const handleCheckout = async (plan: string) => {
    setLoading(plan)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: `${plan}-${billingCycle}` })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lg-blue to-lg-green rounded-xl flex items-center justify-center text-xl">
              🛡️
            </div>
            <span className="text-xl font-bold text-lg-silver">LandGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-lg-muted hover:text-lg-silver transition">Login</Link>
            <Link href="/download" className="btn-primary text-sm">Get Extension</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Choose Your <span className="gradient-text">Protection</span>
            </h1>
            <p className="text-xl text-lg-muted mb-8">
              Start free, upgrade when you need more scans
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-lg-darker p-2 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition ${
                  billingCycle === 'monthly' ? 'bg-lg-blue text-white' : 'text-lg-muted'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition ${
                  billingCycle === 'yearly' ? 'bg-lg-blue text-white' : 'text-lg-muted'
                }`}
              >
                Yearly <span className="text-lg-safe text-xs ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="text-lg-muted text-sm font-semibold mb-2">FREE</div>
              <div className="text-4xl font-bold mb-2">$0</div>
              <div className="text-lg-muted text-sm mb-6">Forever free</div>
              
              <ul className="space-y-3 mb-8">
                {[
                  '5 scans per month',
                  'Basic risk analysis',
                  'Chrome extension',
                  'Manual scanning only'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-silver text-sm">
                    <span className="text-lg-safe">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/download" className="btn-secondary w-full block text-center">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card border-lg-blue relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lg-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-lg-blue text-sm font-semibold mb-2">PRO</div>
              <div className="text-4xl font-bold mb-2">
                ${billingCycle === 'monthly' ? '9.99' : '7.99'}
                <span className="text-lg text-lg-muted">/mo</span>
              </div>
              <div className="text-lg-muted text-sm mb-6">
                {billingCycle === 'yearly' ? 'Billed annually ($95.88/year)' : 'Billed monthly'}
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited scans',
                  'Advanced AI analysis',
                  'Auto-scan on all sites',
                  'Detailed risk reports',
                  'Priority support',
                  'Scan history (unlimited)'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-silver text-sm">
                    <span className="text-lg-safe">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleCheckout('pro')}
                disabled={loading === 'pro'}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* API Plan */}
            <div className="card">
              <div className="text-lg-green text-sm font-semibold mb-2">API</div>
              <div className="text-4xl font-bold mb-2">
                ${billingCycle === 'monthly' ? '29' : '24'}
                <span className="text-lg text-lg-muted">/mo</span>
              </div>
              <div className="text-lg-muted text-sm mb-6">For developers & businesses</div>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  '10,000 API calls/month',
                  'RESTful API access',
                  'Webhook notifications',
                  'Custom integrations',
                  'Dedicated support'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-silver text-sm">
                    <span className="text-lg-safe">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/contact" className="btn-secondary w-full block text-center">
                Contact Sales
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards through our secure payment processor, Stripe.'
                },
                {
                  q: 'Is my data private?',
                  a: 'Yes! LandGuard AI is privacy-first. We don\'t store the listings you scan or sell your data.'
                }
              ].map((faq, i) => (
                <div key={i} className="card">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-lg-muted text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-lg-muted text-sm">
        <p>© 2024 LandGuard AI. All rights reserved.</p>
      </footer>
    </main>
  )
}

