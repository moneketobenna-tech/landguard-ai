'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Supported languages
export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', native: 'English' },
  es: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  fr: { name: 'French', flag: '🇫🇷', native: 'Français' },
  de: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  it: { name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
  pt: { name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
  nl: { name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' },
  ru: { name: 'Russian', flag: '🇷🇺', native: 'Русский' },
  zh: { name: 'Chinese', flag: '🇨🇳', native: '中文' },
  ja: { name: 'Japanese', flag: '🇯🇵', native: '日本語' },
  ko: { name: 'Korean', flag: '🇰🇷', native: '한국어' },
  ar: { name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
  hi: { name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
  tr: { name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
  pl: { name: 'Polish', flag: '🇵🇱', native: 'Polski' },
  vi: { name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt' },
  th: { name: 'Thai', flag: '🇹🇭', native: 'ไทย' },
  id: { name: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia' },
} as const

export type LanguageCode = keyof typeof LANGUAGES

interface Translations {
  [key: string]: string
}

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  translations: Translations
  t: (key: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Browser language to our language code mapping
const BROWSER_LANG_MAP: { [key: string]: LanguageCode } = {
  'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en',
  'es': 'es', 'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es',
  'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr',
  'de': 'de', 'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
  'it': 'it', 'it-IT': 'it',
  'pt': 'pt', 'pt-PT': 'pt', 'pt-BR': 'pt',
  'nl': 'nl', 'nl-NL': 'nl', 'nl-BE': 'nl',
  'ru': 'ru', 'ru-RU': 'ru',
  'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh', 'zh-HK': 'zh',
  'ja': 'ja', 'ja-JP': 'ja',
  'ko': 'ko', 'ko-KR': 'ko',
  'ar': 'ar', 'ar-SA': 'ar', 'ar-AE': 'ar',
  'hi': 'hi', 'hi-IN': 'hi',
  'tr': 'tr', 'tr-TR': 'tr',
  'pl': 'pl', 'pl-PL': 'pl',
  'vi': 'vi', 'vi-VN': 'vi',
  'th': 'th', 'th-TH': 'th',
  'id': 'id', 'id-ID': 'id',
}

function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en'
  
  // Check browser languages in order of preference
  const browserLangs = navigator.languages || [navigator.language]
  
  for (const lang of browserLangs) {
    // Try exact match first
    if (BROWSER_LANG_MAP[lang]) {
      return BROWSER_LANG_MAP[lang]
    }
    // Try base language (e.g., 'en' from 'en-US')
    const baseLang = lang.split('-')[0]
    if (BROWSER_LANG_MAP[baseLang]) {
      return BROWSER_LANG_MAP[baseLang]
    }
  }
  
  return 'en' // Default to English
}

// Default English translations (shown while API loads)
const DEFAULT_TRANSLATIONS: Translations = {
  // Navigation
  'nav.features': 'Features',
  'nav.pricing': 'Pricing',
  'nav.api': 'API',
  'nav.mobile': 'Mobile App',
  'nav.login': 'Login',
  'nav.download': 'Get Extension',
  
  // Hero
  'hero.badge': '🛡️ AI-Powered Protection',
  'hero.title': 'Stop Property Scams Before They Start',
  'hero.subtitle': 'LandGuard AI protects buyers from land and property scams before money changes hands. Our AI analyzes listings on Facebook Marketplace, Kijiji, Craigslist, Property Pro Nigeria, and Jumia House to detect fraud.',
  'hero.scan.placeholder': 'Paste listing URL to scan...',
  'hero.scan.button': 'Scan Listing',
  'hero.disclaimer': '⚠️ This is a risk analysis tool, not legal advice or property verification.',
  'hero.cta.chrome': 'Free Chrome Extension',
  'hero.cta.api': 'Explore API',
  
  // Trust badges
  'trust.local': '100% Local Analysis',
  'trust.privacy': 'Privacy First',
  'trust.instant': 'Instant Results',
  
  // Works Where You Shop
  'works.title': 'Works Where You Shop',
  'works.subtitle': 'Automatic protection on popular listing sites',
  'works.fb': 'Facebook Marketplace',
  'works.kijiji': 'Kijiji',
  'works.craigslist': 'Craigslist',
  'works.propertypro': 'Property Pro Nigeria',
  'works.jumia': 'Jumia House',
  
  // Pricing
  'pricing.title': 'Choose Your Protection',
  'pricing.subtitle': 'Start free, upgrade when you need more scans',
  'pricing.free': 'Free',
  'pricing.free.desc': 'Basic protection for occasional buyers',
  'pricing.pro': 'Pro',
  'pricing.pro.desc': 'Full protection for active property hunters',
  'pricing.api': 'API',
  'pricing.api.desc': 'For developers and businesses',
  'pricing.monthly': 'Monthly',
  'pricing.yearly': 'Yearly',
  'pricing.save20': 'Save 20%',
  'pricing.billedAnnually': 'Billed annually',
  'pricing.billedMonthly': 'Billed monthly',
  'pricing.year': 'year',
  'pricing.save': 'Save',
  'pricing.unlimited': 'Unlimited scans',
  'pricing.scans': 'scans per month',
  'pricing.chrome': 'Chrome extension',
  'pricing.cta.free': 'Get Started',
  'pricing.cta.pro': 'Upgrade to Pro',
  'pricing.popular': 'POPULAR',
  'pricing.perMonth': '/month',
  'pricing.forever': 'forever',
  'pricing.3scans': '3 scans per month',
  'pricing.listing': 'Listing Analysis',
  'pricing.seller': 'Seller Verification',
  'pricing.document': 'Document Scanning',
  'pricing.priority': 'Priority support',
  
  // Features
  'features.sectionTitle': 'Detect Scams Before They Happen',
  'features.sectionSubtitle': 'Our AI analyzes dozens of signals to protect you',
  'features.urgency.title': 'Urgency Detection',
  'features.urgency.desc': 'Flags pressure tactics like "urgent sale", "wire transfer only", and "deposit today"',
  'features.payment.title': 'Payment Red Flags',
  'features.payment.desc': 'Warns about untraceable payment requests like gift cards, crypto, and wire transfers',
  'features.remote.title': 'Remote Seller Alerts',
  'features.remote.desc': 'Detects sellers claiming to be overseas or unable to meet in person',
  'features.image.title': 'Image Analysis',
  'features.image.desc': 'Flags listings with suspiciously few photos or stock images',
  'features.template.title': 'Template Detection',
  'features.template.desc': 'Identifies generic, copy-paste language common in scam listings',
  'features.price.title': 'Price Analysis',
  'features.price.desc': 'Warns about unrealistically low prices that are too good to be true',
  'features.listing.title': 'Listing Analysis',
  'features.listing.desc': 'AI scans listing details for red flags',
  'features.seller.title': 'Seller Verification',
  'features.seller.desc': 'Cross-reference seller information',
  'features.document.title': 'Document Scanning',
  'features.document.desc': 'Verify property documents',
  
  // CTA
  'cta.title': 'Don\'t Become A Victim',
  'cta.subtitle': 'Property scams cost victims thousands of dollars. Protect yourself with LandGuard AI.',
  
  // Footer
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.contact': 'Contact',
  'footer.copyright': '© 2026 LandGuard AI. All rights reserved.',
  'footer.disclaimer': '⚠️ Disclaimer: This is a risk analysis tool, not legal advice or ownership verification.',
  
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.tryAgain': 'Try Again',
  'common.learnMore': 'Learn More',
  
  // API Section
  'api.badge': '🔌 Developer API',
  'api.title': 'Property Scam Detection API',
  'api.subtitle': 'Integrate AI-powered property scam detection into your platform.',
  'api.getStarted': 'Get Started',
  'api.contactSales': 'Contact Sales',
  'api.viewDocs': 'View Full API Documentation →',
  'api.fast': 'Fast Response',
  'api.fast.desc': '<500ms latency',
  'api.secure': 'Secure',
  'api.secure.desc': 'SOC 2 compliant',
  'api.uptime': '99.9% Uptime',
  'api.uptime.desc': 'Enterprise SLA',
  'api.global': 'Global CDN',
  'api.global.desc': 'Low latency worldwide',
  'api.starter': 'STARTER',
  'api.growth': 'GROWTH',
  'api.business': 'BUSINESS',
  'api.enterprise': 'ENTERPRISE',
  'api.credits': 'API credits',
  'api.unlimited': 'Unlimited credits',
  'api.custom': 'Custom',
  'api.scanListing': 'scan-listing endpoint',
  'api.scanSeller': 'scan-seller endpoint',
  'api.scanDocument': 'scan-document endpoint',
  'api.bulkExport': 'bulk export',
  'api.allEndpoints': 'All endpoints',
  'api.customConnectors': 'Custom connectors',
  'api.dedicatedSLA': 'Dedicated SLA',
  'api.prioritySupport': 'Priority support',
  'api.bestFor.starter': 'Best for: Early dev / small agencies',
  'api.bestFor.growth': 'Best for: PropTech & legal teams',
  'api.bestFor.business': 'Best for: Marketplaces & CRM',
  'api.bestFor.enterprise': 'Best for: Major platforms & portals',
  'api.quickStart': 'Quick Start',
  
  // Results
  'result.title': 'Scan Result',
  'result.riskScore': 'Risk Score',
  'result.high': 'HIGH RISK',
  'result.medium': 'MEDIUM RISK',
  'result.low': 'LOW RISK',
  'result.safe': 'SAFE',
  'result.noFlags': 'No major red flags detected',
  'result.recommendations': 'Recommendations',
  
  // Mobile
  'mobile.badge': 'Coming Soon',
  'mobile.title': 'LandGuard AI Mobile App',
  'mobile.subtitle': 'Scan properties on the go with our upcoming mobile app.',
  'mobile.coming': 'Coming Q1 2026',
  'mobile.feature1.title': 'Scan from Screenshots',
  'mobile.feature1.desc': 'Take a screenshot of any listing and our AI will analyze it instantly.',
  'mobile.feature2.title': 'Push Notifications',
  'mobile.feature2.desc': 'Get real-time alerts when new scams are detected in your area.',
  'mobile.feature3.title': 'Sync with Extension',
  'mobile.feature3.desc': 'Your scan history and settings sync across all your devices.',
  'mobile.feature4.title': 'Pro Features Included',
  'mobile.feature4.desc': 'Pro subscribers get full access to mobile app features at no extra cost.',
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [translations, setTranslations] = useState<Translations>(DEFAULT_TRANSLATIONS)
  const [isLoading, setIsLoading] = useState(true)

  // Load translations for a language
  const loadTranslations = async (lang: LanguageCode) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/language?lang=${lang}`)
      if (response.ok) {
        const data = await response.json()
        setTranslations(data.translations || {})
      }
    } catch (error) {
      console.error('Failed to load translations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize language on mount
  useEffect(() => {
    // Check localStorage first
    const savedLang = localStorage.getItem('preferred_language') as LanguageCode
    if (savedLang && LANGUAGES[savedLang]) {
      setLanguageState(savedLang)
      loadTranslations(savedLang)
    } else {
      // Auto-detect from browser
      const detectedLang = detectBrowserLanguage()
      setLanguageState(detectedLang)
      localStorage.setItem('preferred_language', detectedLang)
      loadTranslations(detectedLang)
    }
  }, [])

  // Set language and save preference
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('preferred_language', lang)
    loadTranslations(lang)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[key] || DEFAULT_TRANSLATIONS[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}


