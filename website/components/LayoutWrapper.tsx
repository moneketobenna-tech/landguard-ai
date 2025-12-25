'use client'

/**
 * Layout Wrapper - LandGuard AI
 * Provides language context for i18n across all pages
 */

import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export default function LayoutWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}

