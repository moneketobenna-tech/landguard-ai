'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSelector from '@/components/LanguageSelector'

interface PriceData {
  cad: string
  local: string | null
  localCode: string | null
}

interface PricingData {
  country: string
  localCurrency: string
  localCurrencySymbol: string
  baseCurrency: string
  pro: {
    monthly: PriceData
    yearly: PriceData
    yearlyMonthly: PriceData
    yearlySavings: string
  }
  api: {
    monthly: PriceData
    yearly: PriceData
    yearlyMonthly: PriceData
    yearlySavings: string
  }
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pricing, setPricing] = useState<PricingData | null>(null)

  // Fetch localized pricing on mount
  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Failed to fetch pricing:', err))
  }, [])

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

  // Helper to display price - show local currency if available, otherwise CAD
  const displayPrice = (priceData: PriceData | undefined, fallback: string) => {
    if (!priceData) return fallback
    // Show local currency if available (non-Canadian users)
    if (priceData.local && pricing?.country !== 'CA') {
      return priceData.local
    }
    return priceData.cad
  }

  // Get the currency label
  const getCurrencyLabel = () => {
    if (!pricing || pricing.country === 'CA') return 'CAD'
    return pricing.localCurrency || 'CAD'
  }

  // Show CAD equivalent for non-Canadian users
  const displayCadEquivalent = (priceData: PriceData | undefined) => {
    if (!priceData || !pricing || pricing.country === 'CA') return null
    return `(${priceData.cad} CAD)`
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-lg-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lg-green-500 to-lg-green-600 rounded-xl flex items-center justify-center text-xl">
              🏠
            </div>
            <span className="text-xl font-bold text-lg-dark">LandGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-lg-gray-600 hover:text-lg-dark transition">Login</Link>
            <LanguageSelector />
            <Link href="/download" className="px-4 py-2 bg-lg-green-600 text-white rounded-lg font-semibold hover:bg-lg-green-700 transition text-sm">Get Extension</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-lg-dark">
              Choose Your <span className="text-lg-green-600">Protection</span>
            </h1>
            <p className="text-xl text-lg-gray-600 mb-8">
              Start free, upgrade when you need more scans
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-lg-gray-100 p-2 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition ${
                  billingCycle === 'monthly' ? 'bg-lg-green-600 text-white' : 'text-lg-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition ${
                  billingCycle === 'yearly' ? 'bg-lg-green-600 text-white' : 'text-lg-gray-600'
                }`}
              >
                Yearly <span className="text-green-500 text-xs ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-lg-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg-gray-500 text-sm font-semibold mb-2">FREE</div>
              <div className="text-4xl font-bold mb-2 text-lg-dark">$0</div>
              <div className="text-lg-gray-500 text-sm mb-6">Forever free</div>
              
              <ul className="space-y-3 mb-8">
                {[
                  '3 scans per month',
                  'Basic risk analysis',
                  'Chrome extension',
                  'Manual scanning only'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-gray-700 text-sm">
                    <span className="text-lg-green-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/download" className="block w-full py-3 px-6 border border-lg-green-600 text-lg-green-600 rounded-xl font-semibold text-center hover:bg-lg-green-50 transition">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-lg-green-600 rounded-2xl p-8 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-lg-green-600 text-sm font-semibold mb-2">PRO</div>
              <div className="text-4xl font-bold mb-1 text-lg-dark">
                {billingCycle === 'monthly' 
                  ? displayPrice(pricing?.pro.monthly, 'CA$14.99')
                  : displayPrice(pricing?.pro.yearlyMonthly, 'CA$11.99')
                }
                <span className="text-lg text-lg-gray-500">/mo</span>
              </div>
              {/* CAD equivalent for non-Canadian users */}
              {pricing?.country && pricing.country !== 'CA' && (
                <div className="text-lg-gray-400 text-xs mb-2">
                  {billingCycle === 'monthly' 
                    ? displayCadEquivalent(pricing?.pro.monthly)
                    : displayCadEquivalent(pricing?.pro.yearlyMonthly)
                  }
                </div>
              )}
              <div className="text-lg-gray-500 text-sm mb-6">
                {billingCycle === 'yearly' 
                  ? `Billed annually (${displayPrice(pricing?.pro.yearly, 'CA$143.88')}/year)` 
                  : 'Billed monthly'
                }
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
                  <li key={i} className="flex items-center gap-2 text-lg-gray-700 text-sm">
                    <span className="text-lg-green-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleCheckout('pro')}
                disabled={loading === 'pro'}
                className="w-full py-3 px-6 bg-lg-green-600 text-white rounded-xl font-semibold hover:bg-lg-green-700 transition disabled:opacity-50"
              >
                {loading === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* API Plan */}
            <div className="bg-white border border-lg-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-lg-green-500 text-sm font-semibold mb-2">API</div>
              <div className="text-4xl font-bold mb-1 text-lg-dark">
                {billingCycle === 'monthly' 
                  ? displayPrice(pricing?.api.monthly, 'CA$39')
                  : displayPrice(pricing?.api.yearlyMonthly, 'CA$32.40')
                }
                <span className="text-lg text-lg-gray-500">/mo</span>
              </div>
              {/* CAD equivalent for non-Canadian users */}
              {pricing?.country && pricing.country !== 'CA' && (
                <div className="text-lg-gray-400 text-xs mb-2">
                  {billingCycle === 'monthly' 
                    ? displayCadEquivalent(pricing?.api.monthly)
                    : displayCadEquivalent(pricing?.api.yearlyMonthly)
                  }
                </div>
              )}
              <div className="text-lg-gray-500 text-sm mb-6">For developers & businesses</div>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  '10,000 API calls/month',
                  'RESTful API access',
                  'Webhook notifications',
                  'Custom integrations',
                  'Dedicated support'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-gray-700 text-sm">
                    <span className="text-lg-green-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              
              <Link href="/contact" className="block w-full py-3 px-6 border border-lg-green-600 text-lg-green-600 rounded-xl font-semibold text-center hover:bg-lg-green-50 transition">
                Contact Sales
              </Link>
            </div>
          </div>

          {/* Currency Notice */}
          {pricing?.country && pricing.country !== 'CA' && (
            <div className="mt-8 text-center">
              <p className="text-lg-gray-500 text-sm">
                🌍 Prices shown in {pricing.localCurrency}. You will be billed in CAD.
              </p>
            </div>
          )}

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-lg-dark">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards through our secure payment processor, Stripe. Stripe will handle currency conversion if you\'re paying in a different currency.'
                },
                {
                  q: 'Is my data private?',
                  a: 'Yes! LandGuard AI is privacy-first. We don\'t store the listings you scan or sell your data.'
                }
              ].map((faq, i) => (
                <div key={i} className="bg-white border border-lg-gray-200 rounded-2xl p-6">
                  <h3 className="font-semibold mb-2 text-lg-dark">{faq.q}</h3>
                  <p className="text-lg-gray-600 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-lg-gray-200 text-center text-lg-gray-500 text-sm">
        <p>© 2024 LandGuard AI. All rights reserved.</p>
      </footer>
    </main>
  )
}
