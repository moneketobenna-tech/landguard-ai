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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [translations, setTranslations] = useState<Translations>({})
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

