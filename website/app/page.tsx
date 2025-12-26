'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface PricePoint {
  cad: string
  local: string | null
  localCode: string | null
  localAmount: number | null
}

interface PricingData {
  country: string
  localCurrency: string
  localCurrencySymbol: string
  baseCurrency: string
  pro: {
    monthly: PricePoint
    yearly: PricePoint
    yearlyMonthly: PricePoint
    yearlySavings: string
  }
  apiStarter: { monthly: PricePoint; credits: number }
  apiGrowth: { monthly: PricePoint; credits: number }
  apiBusiness: { monthly: PricePoint; credits: number }
  apiEnterprise: { monthly: PricePoint; credits: number }
}

function HomePageContent() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { t } = useLanguage()

  // Fetch pricing data
  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Failed to fetch pricing:', err))
  }, [])

  // Helper to display price
  const displayPrice = (priceData: { cad: string; local: string | null } | undefined, fallback: string) => {
    if (!priceData) return fallback
    return priceData.local || priceData.cad
  }

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-lg-green shadow-md">
              <img 
                src="/logo.png" 
                alt="LandGuard AI" 
                className="w-full h-full object-cover object-top scale-150"
              />
            </div>
            <span className="text-xl font-bold text-lg-text">LandGuard AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-lg-text-muted hover:text-lg-green transition">{t('nav.features')}</Link>
            <Link href="#pricing" className="text-lg-text-muted hover:text-lg-green transition">{t('nav.pricing')}</Link>
            <Link href="#api" className="text-lg-text-muted hover:text-lg-green transition">{t('nav.api')}</Link>
            <Link href="#mobile" className="text-lg-text-muted hover:text-lg-green transition">{t('nav.mobile')}</Link>
            <Link href="/app/login" className="text-lg-text-muted hover:text-lg-green transition">{t('nav.login')}</Link>
            <LanguageSelector />
            <Link href="/download" className="btn-primary text-sm">{t('nav.download')}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-lg-bg-alt border border-lg-green/30 rounded-full px-4 py-2 mb-8">
            <span className="text-lg-green text-sm font-medium">{t('hero.badge')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-lg-text">
            {t('hero.title')}
          </h1>
          
          <p className="text-xl text-lg-text-muted max-w-3xl mx-auto mb-12">
            {t('hero.subtitle')}
          </p>

          {/* Scan Box */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="card p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('hero.scan.placeholder')}
                  className="flex-1 bg-white border border-lg-border rounded-lg px-4 py-3 text-lg-text placeholder-lg-text-muted focus:outline-none focus:border-lg-green transition"
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
                      {t('hero.scan.scanning')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">🔍 {t('hero.scan.button')}</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-lg-text-muted mt-3">
                {t('hero.disclaimer')}
              </p>
            </div>
          </div>

          {/* Scan Result */}
          {result && (
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-lg-text">{t('result.title')}</h3>
                  <span className={`risk-pill risk-pill-${result.riskLevel}`}>
                    {result.riskLevel === 'high' ? t('result.high') : result.riskLevel === 'medium' ? t('result.medium') : t('result.low')}
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
                    <div className="text-sm text-lg-text-muted">{t('result.riskScore')}</div>
                  </div>
                  <div className="flex-1 text-left">
                    {result.flags?.length > 0 ? (
                      <ul className="space-y-2">
                        {result.flags.slice(0, 3).map((flag: string, i: number) => (
                          <li key={i} className="text-sm text-lg-text flex items-start gap-2">
                            <span className="text-lg-amber">⚠️</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-lg-safe">✅ {t('result.noFlags')}</p>
                    )}
                  </div>
                </div>

                {result.recommendations?.length > 0 && (
                  <div className="border-t border-lg-border pt-4">
                    <h4 className="text-sm text-lg-green font-semibold mb-2">{t('result.recommendations')}:</h4>
                    <ul className="space-y-1">
                      {result.recommendations.slice(0, 3).map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-lg-text-muted">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-lg-text-muted mb-12">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>{t('trust.local')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>{t('trust.privacy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>{t('trust.instant')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-lg-green">3.2K+</div>
              <div className="text-sm text-lg-text-muted">Scams Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-lg-green">97.5%</div>
              <div className="text-sm text-lg-text-muted">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-lg-green">19K+</div>
              <div className="text-sm text-lg-text-muted">Users Protected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-lg-green">$840K+</div>
              <div className="text-sm text-lg-text-muted">Funds Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-lg-text">{t('features.sectionTitle')}</h2>
            <p className="text-lg-text-muted text-lg">{t('features.sectionSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🚨',
                titleKey: 'features.urgency.title',
                descKey: 'features.urgency.desc'
              },
              {
                icon: '💳',
                titleKey: 'features.payment.title',
                descKey: 'features.payment.desc'
              },
              {
                icon: '🌍',
                titleKey: 'features.remote.title',
                descKey: 'features.remote.desc'
              },
              {
                icon: '📸',
                titleKey: 'features.image.title',
                descKey: 'features.image.desc'
              },
              {
                icon: '📝',
                titleKey: 'features.template.title',
                descKey: 'features.template.desc'
              },
              {
                icon: '💰',
                titleKey: 'features.price.title',
                descKey: 'features.price.desc'
              }
            ].map((feature, i) => (
              <div key={i} className="card text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-lg-text">{t(feature.titleKey)}</h3>
                <p className="text-lg-text-muted">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Sites */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-lg-text">{t('works.title')}</h2>
          <p className="text-lg-text-muted text-lg mb-12">{t('works.subtitle')}</p>
          
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { nameKey: 'works.fb', icon: '📘' },
              { nameKey: 'works.kijiji', icon: '🟢' },
              { nameKey: 'works.craigslist', icon: '📋' }
            ].map((site, i) => (
              <div key={i} className="card px-8 py-6 flex items-center gap-4">
                <span className="text-3xl">{site.icon}</span>
                <span className="text-lg font-medium text-lg-text">{t(site.nameKey)}</span>
                <span className="text-lg-safe">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-lg-text">{t('pricing.title')}</h2>
            <p className="text-lg-text-muted text-lg">{t('pricing.subtitle')}</p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-lg-bg-alt border border-lg-green/30 p-2 rounded-full mt-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition font-medium ${
                  billingCycle === 'monthly' ? 'bg-lg-green text-white' : 'text-lg-text-muted hover:text-lg-text'
                }`}
              >
                {t('pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition font-medium ${
                  billingCycle === 'yearly' ? 'bg-lg-green text-white' : 'text-lg-text-muted hover:text-lg-text'
                }`}
              >
                {t('pricing.yearly')} <span className="text-lg-safe text-xs ml-1">{t('pricing.save20')}</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="text-lg-text-muted text-sm font-semibold mb-2">{t('pricing.free')}</div>
              <div className="text-4xl font-bold mb-4 text-lg-text">$0<span className="text-lg text-lg-text-muted">/{t('pricing.monthly')}</span></div>
              <ul className="space-y-3 mb-8">
                {[
                  `3 ${t('pricing.scans')}`,
                  t('features.listing.desc'),
                  t('pricing.chrome'),
                  t('features.listing.title')
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-text">
                    <span className="text-lg-safe">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/download" className="btn-secondary w-full block text-center">
                {t('pricing.cta.free')}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-lg-green relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lg-green text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-lg-green text-sm font-semibold mb-2">{t('pricing.pro')}</div>
              <div className="text-4xl font-bold mb-1 text-lg-text">
                {billingCycle === 'monthly' 
                  ? displayPrice(pricing?.pro.monthly, 'CA$14.99')
                  : displayPrice(pricing?.pro.yearlyMonthly, 'CA$11.99')
                }
                <span className="text-lg text-lg-text-muted">/{t('pricing.monthly')}</span>
              </div>
              {/* Show billing info */}
              <div className="text-sm text-lg-text-muted mb-3">
                {billingCycle === 'yearly' 
                  ? `${t('pricing.billedAnnually')} (${displayPrice(pricing?.pro.yearly, 'CA$143.88')}/${t('pricing.year')})`
                  : t('pricing.billedMonthly')
                }
              </div>
              {/* Show CAD equivalent for non-Canadian users */}
              {pricing?.country && pricing.country !== 'CA' && (
                <div className="text-xs text-lg-text-muted mb-3">
                  ≈ {billingCycle === 'monthly' ? pricing.pro.monthly.cad : pricing.pro.yearly.cad} CAD
                </div>
              )}
              <ul className="space-y-3 mb-8">
                {[
                  t('pricing.unlimited'),
                  t('features.listing.desc'),
                  t('features.seller.title'),
                  t('features.price.title'),
                  t('features.document.title'),
                  t('nav.api')
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-lg-text">
                    <span className="text-lg-safe">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="btn-primary w-full block text-center">
                {t('pricing.cta.pro')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-lg-bg-alt border border-lg-green/30 rounded-full px-4 py-2 mb-4">
              <span className="text-lg-green text-sm font-medium">{t('api.badge')}</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-lg-text">{t('api.title')}</h2>
            <p className="text-lg-text-muted text-lg max-w-3xl mx-auto">
              {t('api.subtitle')}
            </p>
          </div>

          {/* API Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: '⚡', titleKey: 'api.fast', descKey: 'api.fast.desc' },
              { icon: '🔒', titleKey: 'api.secure', descKey: 'api.secure.desc' },
              { icon: '📊', titleKey: 'api.uptime', descKey: 'api.uptime.desc' },
              { icon: '🌍', titleKey: 'api.global', descKey: 'api.global.desc' }
            ].map((item, i) => (
              <div key={i} className="card text-center py-6">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-lg-text">{t(item.titleKey)}</div>
                <div className="text-sm text-lg-text-muted">{t(item.descKey)}</div>
              </div>
            ))}
          </div>

          {/* API Pricing Tiers */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {/* Starter */}
            <div className="card">
              <div className="text-lg-text-muted text-sm font-semibold mb-2">{t('api.starter')}</div>
              <div className="text-3xl font-bold mb-1 text-lg-text">
                {displayPrice(pricing?.apiStarter?.monthly, 'CA$269')}
                <span className="text-base text-lg-text-muted">{t('pricing.perMonth')}</span>
              </div>
              <div className="text-sm text-lg-green mb-4">5,000 {t('api.credits')}</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanListing')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanSeller')}
                </li>
                <li className="flex items-center gap-2 text-lg-text-muted">
                  <span>✗</span> {t('api.scanDocument')}
                </li>
                <li className="flex items-center gap-2 text-lg-text-muted">
                  <span>✗</span> {t('api.bulkExport')}
                </li>
              </ul>
              <div className="text-xs text-lg-text-muted mb-4">{t('api.bestFor.starter')}</div>
              <Link href="/api/pricing" className="btn-secondary w-full block text-center text-sm">
                {t('api.getStarted')}
              </Link>
            </div>

            {/* Growth */}
            <div className="card border-2 border-lg-green relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lg-green text-white text-xs font-bold px-3 py-1 rounded-full">
                {t('pricing.popular')}
              </div>
              <div className="text-lg-green text-sm font-semibold mb-2">{t('api.growth')}</div>
              <div className="text-3xl font-bold mb-1 text-lg-text">
                {displayPrice(pricing?.apiGrowth?.monthly, 'CA$1,079')}
                <span className="text-base text-lg-text-muted">{t('pricing.perMonth')}</span>
              </div>
              <div className="text-sm text-lg-green mb-4">25,000 {t('api.credits')}</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanListing')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanSeller')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanDocument')}
                </li>
                <li className="flex items-center gap-2 text-lg-text-muted">
                  <span>✗</span> {t('api.bulkExport')}
                </li>
              </ul>
              <div className="text-xs text-lg-text-muted mb-4">{t('api.bestFor.growth')}</div>
              <Link href="/api/pricing" className="btn-primary w-full block text-center text-sm">
                {t('api.getStarted')}
              </Link>
            </div>

            {/* Business */}
            <div className="card">
              <div className="text-lg-text-muted text-sm font-semibold mb-2">{t('api.business')}</div>
              <div className="text-3xl font-bold mb-1 text-lg-text">
                {displayPrice(pricing?.apiBusiness?.monthly, 'CA$3,374')}
                <span className="text-base text-lg-text-muted">{t('pricing.perMonth')}</span>
              </div>
              <div className="text-sm text-lg-green mb-4">100,000 {t('api.credits')}</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanListing')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanSeller')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.scanDocument')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.bulkExport')}
                </li>
              </ul>
              <div className="text-xs text-lg-text-muted mb-4">{t('api.bestFor.business')}</div>
              <Link href="/api/pricing" className="btn-secondary w-full block text-center text-sm">
                {t('api.getStarted')}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="card bg-gradient-to-br from-lg-green/10 to-lg-green/5">
              <div className="text-lg-green text-sm font-semibold mb-2">{t('api.enterprise')}</div>
              <div className="text-3xl font-bold mb-1 text-lg-text">
                {t('api.custom')}
                <span className="text-base text-lg-text-muted"> {displayPrice(pricing?.apiEnterprise?.monthly, 'CA$6,749')}+</span>
              </div>
              <div className="text-sm text-lg-green mb-4">{t('api.unlimited')}</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.allEndpoints')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.customConnectors')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.dedicatedSLA')}
                </li>
                <li className="flex items-center gap-2 text-lg-text">
                  <span className="text-lg-safe">✓</span> {t('api.prioritySupport')}
                </li>
              </ul>
              <div className="text-xs text-lg-text-muted mb-4">{t('api.bestFor.enterprise')}</div>
              <Link href="/api/pricing" className="btn-primary w-full block text-center text-sm">
                {t('api.contactSales')}
              </Link>
            </div>
          </div>

          {/* Code Example */}
          <div className="max-w-4xl mx-auto">
            <div className="card overflow-hidden">
              <div className="bg-lg-bg-alt border-b border-lg-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm text-lg-text-muted ml-2">{t('api.quickStart')}</span>
              </div>
              <pre className="p-6 bg-gray-900 text-sm overflow-x-auto">
                <code className="text-gray-300">{`// Scan a property listing for scams
const response = await fetch('https://api.landguardai.co/v1/scan-listing', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://facebook.com/marketplace/item/123456'
  })
});

const result = await response.json();
// { score: 75, riskLevel: "high", flags: [...], recommendations: [...] }`}</code>
              </pre>
            </div>
            <div className="text-center mt-6">
              <Link href="/api/docs" className="text-lg-green hover:underline font-medium">
                {t('api.viewDocs')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Coming Soon */}
      <section id="mobile" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-lg-green/10 border border-lg-green/30 rounded-full px-4 py-2 mb-4">
              <span className="text-lg-green text-sm font-medium">📱 {t('mobile.badge')}</span>
            </span>
            <h2 className="text-4xl font-bold mb-4 text-lg-text">
              {t('mobile.title')}
            </h2>
            <p className="text-xl text-lg-text-muted max-w-2xl mx-auto">
              {t('mobile.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Phone Mockup */}
            <div className="relative">
              <div className="relative mx-auto w-64">
                {/* Phone Frame */}
                <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl"></div>
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* App Screen Preview */}
                    <div className="p-4 bg-gradient-to-b from-lg-green/10 to-white min-h-[400px]">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-lg-green rounded-lg flex items-center justify-center text-white text-sm">🏠</div>
                        <span className="font-bold text-lg-text">LandGuard AI</span>
                      </div>
                      
                      {/* Sample Scan Result */}
                      <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-lg-text">Listing Scan</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">High Risk</span>
                        </div>
                        <div className="text-3xl font-bold text-red-500 mb-2">78</div>
                        <div className="text-xs text-lg-text-muted">Risk Score</div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-amber-50 rounded-lg p-3 text-xs">
                          <span className="text-amber-600">⚠️ Suspicious pricing detected</span>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 text-xs">
                          <span className="text-amber-600">⚠️ New seller account</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-lg-green/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-lg-green/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lg-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  📸
                </div>
                <div>
                  <h3 className="font-semibold text-lg-text mb-1">{t('mobile.feature1.title')}</h3>
                  <p className="text-lg-text-muted text-sm">{t('mobile.feature1.desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lg-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🔔
                </div>
                <div>
                  <h3 className="font-semibold text-lg-text mb-1">{t('mobile.feature2.title')}</h3>
                  <p className="text-lg-text-muted text-sm">{t('mobile.feature2.desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lg-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🔄
                </div>
                <div>
                  <h3 className="font-semibold text-lg-text mb-1">{t('mobile.feature3.title')}</h3>
                  <p className="text-lg-text-muted text-sm">{t('mobile.feature3.desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lg-green/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  ⭐
                </div>
                <div>
                  <h3 className="font-semibold text-lg-text mb-1">{t('mobile.feature4.title')}</h3>
                  <p className="text-lg-text-muted text-sm">{t('mobile.feature4.desc')}</p>
                </div>
              </div>

              {/* Coming Soon Badge */}
              <div className="pt-4">
                <div className="inline-flex items-center gap-3 bg-lg-bg-alt border border-lg-border rounded-xl px-6 py-4">
                  <div className="flex -space-x-1">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 bg-lg-green rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 2H6.477C5.105 2 4 3.105 4 4.477v15.046C4 20.895 5.105 22 6.477 22h11.046C18.895 22 20 20.895 20 19.523V4.477C20 3.105 18.895 2 17.523 2zM12 20c-.828 0-1.5-.672-1.5-1.5S11.172 17 12 17s1.5.672 1.5 1.5S12.828 20 12 20zm5-4H7V5h10v11z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-lg-text">iOS & Android</div>
                    <div className="text-xs text-lg-text-muted">{t('mobile.coming')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-section-alt">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-lg-text">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-lg-text-muted mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/download" className="btn-primary text-lg px-10 py-4 inline-block">
              {t('hero.cta.chrome')}
            </Link>
            <Link href="/api/docs" className="btn-secondary text-lg px-10 py-4 inline-block">
              {t('hero.cta.api')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-lg-border bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-lg-green">
                <img 
                  src="/logo.png" 
                  alt="LandGuard AI" 
                  className="w-full h-full object-cover object-top scale-150"
                />
              </div>
              <span className="font-semibold text-lg-text">LandGuard AI</span>
            </div>
            <div className="flex gap-8 text-lg-text-muted text-sm">
              <Link href="/privacy" className="hover:text-lg-green transition">{t('footer.privacy')}</Link>
              <Link href="/terms" className="hover:text-lg-green transition">{t('footer.terms')}</Link>
              <Link href="/contact" className="hover:text-lg-green transition">{t('footer.contact')}</Link>
            </div>
            <div className="text-lg-text-muted text-sm">
              {t('footer.copyright')}
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-lg-text-muted">
            {t('footer.disclaimer')}
          </div>
        </div>
      </footer>
    </main>
  )
}

// Export the page component (LanguageProvider is now in layout)
export default function HomePage() {
  return <HomePageContent />
}
