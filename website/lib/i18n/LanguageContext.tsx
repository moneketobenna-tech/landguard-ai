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
  'hero.subtitle': 'LandGuard AI protects buyers from land and property scams before money changes hands. Our AI analyzes listings on Facebook Marketplace, Kijiji, and Craigslist to detect fraud.',
  'hero.scan.placeholder': 'Paste listing URL to scan...',
  'hero.scan.button': 'Scan Listing',
  'hero.disclaimer': '⚠️ This is a risk analysis tool, not legal advice or property verification.',
  'hero.cta.chrome': 'Free Chrome Extension',
  'hero.cta.api': 'Explore API',
  
  // Pricing
  'pricing.title': 'Choose Your Protection',
  'pricing.subtitle': 'Start free, upgrade when you need more scans',
  'pricing.free': 'Free',
  'pricing.pro': 'Pro',
  'pricing.monthly': 'Monthly',
  'pricing.yearly': 'Yearly',
  'pricing.save20': 'Save 20%',
  'pricing.billedAnnually': 'Billed annually',
  'pricing.billedMonthly': 'Billed monthly',
  'pricing.year': 'year',
  'pricing.unlimited': 'Unlimited scans',
  'pricing.scans': 'scans per month',
  'pricing.chrome': 'Chrome extension',
  'pricing.cta.free': 'Get Started',
  'pricing.cta.pro': 'Upgrade to Pro',
  
  // Features
  'features.listing.title': 'Listing Analysis',
  'features.listing.desc': 'AI scans listing details for red flags',
  'features.seller.title': 'Seller Verification',
  'features.seller.desc': 'Cross-reference seller information',
  'features.price.title': 'Price Analysis',
  'features.price.desc': 'Compare prices with market data',
  'features.document.title': 'Document Scanning',
  'features.document.desc': 'Verify property documents',
  
  // CTA
  'cta.title': 'Don\'t Become A Victim',
  'cta.subtitle': 'Property scams cost victims thousands of dollars. Protect yourself with LandGuard AI.',
  
  // Footer
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.contact': 'Contact',
  'footer.copyright': '© 2024 LandGuard AI. All rights reserved.',
  
  // API Section
  'api.badge': '🔌 Developer API',
  'api.title': 'Property Scam Detection API',
  'api.subtitle': 'Integrate AI-powered property scam detection into your platform.',
  'api.getStarted': 'Get Started',
  'api.contactSales': 'Contact Sales',
  'api.viewDocs': 'View Full API Documentation →',
  
  // Mobile
  'mobile.badge': 'Coming Soon',
  'mobile.title': 'LandGuard AI Mobile App',
  'mobile.subtitle': 'Scan properties on the go with our upcoming mobile app.',
  'mobile.coming': 'Coming Q1 2026',
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
    return translations[key] || key
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


