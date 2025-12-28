'use client'

import { useState } from 'react'
import Link from 'next/link'
import LanguageSelector from '@/components/LanguageSelector'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // In production, you would send this to your backend
    // For now, we'll simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏠</span>
              </div>
              <span className="text-xl font-bold text-gray-800">LandGuard AI</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition-colors">
                Pricing
              </Link>
              <LanguageSelector />
              <Link href="/app" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Contact <span className="text-green-600">Support</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? Need help? We're here to assist you with anything related to LandGuard AI.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We'll get back to you within 24-48 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', subject: 'general', message: '' })
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="api">API Support</option>
                    <option value="partnership">Partnership Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>📧</span> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-8">
            {/* Direct Contact */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Direct Contact</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email Support</h3>
                    <a href="mailto:support@landguardai.co" className="text-green-600 hover:underline text-lg">
                      support@landguardai.co
                    </a>
                    <p className="text-sm text-gray-500 mt-1">
                      We typically respond within 24-48 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Support Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9 AM - 6 PM EST
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pro users receive priority support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Website</h3>
                    <a href="https://landguardai.co" className="text-green-600 hover:underline">
                      landguardai.co
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">How do I upgrade to Pro?</h3>
                  <p className="text-gray-600 text-sm">
                    Visit our <Link href="/pricing" className="text-green-600 hover:underline">pricing page</Link> and 
                    click "Get Started" on the Pro plan. You can pay with any major credit card.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Can I get a refund?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes! We offer a 7-day money-back guarantee. Contact support within 7 days of your 
                    purchase for a full refund.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">How do I install the Chrome extension?</h3>
                  <p className="text-gray-600 text-sm">
                    Visit our <Link href="/download" className="text-green-600 hover:underline">download page</Link> for 
                    installation instructions. The extension is available on the Chrome Web Store.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Is my data secure?</h3>
                  <p className="text-gray-600 text-sm">
                    Absolutely. We use industry-standard encryption and never sell your data. 
                    Read our <Link href="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> for details.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">What websites does LandGuard AI support?</h3>
                  <p className="text-gray-600 text-sm">
                    We support Facebook Marketplace, Kijiji, Craigslist, Property Pro Nigeria, Jumia House, Zillow, Realtor.com, 
                    Trulia, Redfin, Rightmove, and Zoopla.
                  </p>
                </div>
              </div>
            </div>

            {/* Pro Support Badge */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Pro Priority Support</h3>
                  <p className="text-white/80 text-sm">
                    Pro users get faster response times and dedicated support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white">🏠</span>
              </div>
              <span className="font-bold">LandGuard AI</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} LandGuard AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

