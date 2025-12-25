/**
 * LandGuard AI - Price Localization API
 * GET /api/pricing
 * 
 * Returns prices in CAD (base currency) with local currency equivalents based on user location
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Base prices in CAD (what you receive)
const BASE_PRICES = {
  pro: {
    monthly: 14.99,
    yearly: 143.88, // $11.99/month
    yearlyMonthly: 11.99,
  },
  api: {
    monthly: 39,
    yearly: 388.80, // $32.40/month
    yearlyMonthly: 32.40,
  },
}

// Exchange rates FROM CAD to other currencies
// CAD = 1.0, others are CAD -> X conversion rates
// Using ISO 3166-1 alpha-2 country codes
const EXCHANGE_RATES: Record<string, { rate: number; symbol: string; code: string }> = {
  // North America
  CA: { rate: 1, symbol: '$', code: 'CAD' },
  US: { rate: 0.74, symbol: '$', code: 'USD' },
  MX: { rate: 12.7, symbol: 'MX$', code: 'MXN' },
  
  // Europe - EUR countries
  AT: { rate: 0.68, symbol: '€', code: 'EUR' }, // Austria
  BE: { rate: 0.68, symbol: '€', code: 'EUR' }, // Belgium
  CY: { rate: 0.68, symbol: '€', code: 'EUR' }, // Cyprus
  EE: { rate: 0.68, symbol: '€', code: 'EUR' }, // Estonia
  FI: { rate: 0.68, symbol: '€', code: 'EUR' }, // Finland
  FR: { rate: 0.68, symbol: '€', code: 'EUR' }, // France
  DE: { rate: 0.68, symbol: '€', code: 'EUR' }, // Germany
  GR: { rate: 0.68, symbol: '€', code: 'EUR' }, // Greece
  IE: { rate: 0.68, symbol: '€', code: 'EUR' }, // Ireland
  IT: { rate: 0.68, symbol: '€', code: 'EUR' }, // Italy
  LV: { rate: 0.68, symbol: '€', code: 'EUR' }, // Latvia
  LT: { rate: 0.68, symbol: '€', code: 'EUR' }, // Lithuania
  LU: { rate: 0.68, symbol: '€', code: 'EUR' }, // Luxembourg
  MT: { rate: 0.68, symbol: '€', code: 'EUR' }, // Malta
  NL: { rate: 0.68, symbol: '€', code: 'EUR' }, // Netherlands
  PT: { rate: 0.68, symbol: '€', code: 'EUR' }, // Portugal
  SK: { rate: 0.68, symbol: '€', code: 'EUR' }, // Slovakia
  SI: { rate: 0.68, symbol: '€', code: 'EUR' }, // Slovenia
  ES: { rate: 0.68, symbol: '€', code: 'EUR' }, // Spain
  
  // Europe - Non-EUR
  GB: { rate: 0.58, symbol: '£', code: 'GBP' }, // United Kingdom
  CH: { rate: 0.65, symbol: 'CHF', code: 'CHF' }, // Switzerland
  SE: { rate: 7.66, symbol: 'kr', code: 'SEK' }, // Sweden
  NO: { rate: 7.88, symbol: 'kr', code: 'NOK' }, // Norway
  DK: { rate: 5.06, symbol: 'kr', code: 'DKK' }, // Denmark
  PL: { rate: 2.96, symbol: 'zł', code: 'PLN' }, // Poland
  CZ: { rate: 16.8, symbol: 'Kč', code: 'CZK' }, // Czech Republic
  HU: { rate: 260, symbol: 'Ft', code: 'HUF' }, // Hungary
  RO: { rate: 3.4, symbol: 'lei', code: 'RON' }, // Romania
  BG: { rate: 1.33, symbol: 'лв', code: 'BGN' }, // Bulgaria
  HR: { rate: 0.68, symbol: '€', code: 'EUR' }, // Croatia (now EUR)
  
  // Asia Pacific
  AU: { rate: 1.13, symbol: 'A$', code: 'AUD' }, // Australia
  NZ: { rate: 1.21, symbol: 'NZ$', code: 'NZD' }, // New Zealand
  JP: { rate: 110, symbol: '¥', code: 'JPY' }, // Japan
  KR: { rate: 972, symbol: '₩', code: 'KRW' }, // South Korea
  CN: { rate: 5.3, symbol: '¥', code: 'CNY' }, // China
  HK: { rate: 5.76, symbol: 'HK$', code: 'HKD' }, // Hong Kong
  TW: { rate: 23.5, symbol: 'NT$', code: 'TWD' }, // Taiwan
  SG: { rate: 0.99, symbol: 'S$', code: 'SGD' }, // Singapore
  MY: { rate: 3.29, symbol: 'RM', code: 'MYR' }, // Malaysia
  TH: { rate: 26, symbol: '฿', code: 'THB' }, // Thailand
  ID: { rate: 11500, symbol: 'Rp', code: 'IDR' }, // Indonesia
  PH: { rate: 41, symbol: '₱', code: 'PHP' }, // Philippines
  VN: { rate: 18000, symbol: '₫', code: 'VND' }, // Vietnam
  IN: { rate: 61, symbol: '₹', code: 'INR' }, // India
  
  // Middle East
  AE: { rate: 2.70, symbol: 'د.إ', code: 'AED' }, // UAE
  SA: { rate: 2.76, symbol: '﷼', code: 'SAR' }, // Saudi Arabia
  IL: { rate: 2.7, symbol: '₪', code: 'ILS' }, // Israel
  TR: { rate: 21.5, symbol: '₺', code: 'TRY' }, // Turkey
  
  // South America
  BR: { rate: 3.66, symbol: 'R$', code: 'BRL' }, // Brazil
  AR: { rate: 600, symbol: '$', code: 'ARS' }, // Argentina
  CL: { rate: 650, symbol: '$', code: 'CLP' }, // Chile
  CO: { rate: 2900, symbol: '$', code: 'COP' }, // Colombia
  PE: { rate: 2.76, symbol: 'S/', code: 'PEN' }, // Peru
  
  // Africa
  ZA: { rate: 13.6, symbol: 'R', code: 'ZAR' }, // South Africa
  NG: { rate: 1140, symbol: '₦', code: 'NGN' }, // Nigeria
  EG: { rate: 22.8, symbol: 'E£', code: 'EGP' }, // Egypt
  KE: { rate: 113, symbol: 'KSh', code: 'KES' }, // Kenya
}

// Get country from various headers
function getCountryFromRequest(request: NextRequest): string {
  // Try Vercel header first (most common for Vercel deployments)
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry) {
    console.log('[Pricing API] Detected country from Vercel:', vercelCountry)
    return vercelCountry.toUpperCase()
  }
  
  // Try Cloudflare header
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry) {
    console.log('[Pricing API] Detected country from Cloudflare:', cfCountry)
    return cfCountry.toUpperCase()
  }
  
  // Try custom header (for testing)
  const customCountry = request.headers.get('x-country')
  if (customCountry) {
    console.log('[Pricing API] Detected country from x-country:', customCountry)
    return customCountry.toUpperCase()
  }
  
  // Default to Canada
  console.log('[Pricing API] No country header found, defaulting to CA')
  return 'CA'
}

function formatPrice(amount: number, currency: { symbol: string; code: string }): string {
  // Round to 2 decimal places for most currencies, 0 for JPY, KRW, etc.
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'CLP', 'COP']
  const decimals = noDecimalCurrencies.includes(currency.code) ? 0 : 2
  
  const formatted = amount.toFixed(decimals)
  return `${currency.symbol}${formatted}`
}

function convertPrice(cadPrice: number, countryCode: string): { 
  cad: string
  local: string | null
  localCode: string | null
  localAmount: number | null
} {
  const cadCurrency = { symbol: 'CA$', code: 'CAD' }
  const localCurrency = EXCHANGE_RATES[countryCode]
  
  const cadFormatted = formatPrice(cadPrice, cadCurrency)
  
  if (!localCurrency || countryCode === 'CA') {
    return {
      cad: cadFormatted,
      local: null,
      localCode: null,
      localAmount: null,
    }
  }
  
  const localAmount = cadPrice * localCurrency.rate
  const localFormatted = formatPrice(localAmount, localCurrency)
  
  return {
    cad: cadFormatted,
    local: localFormatted,
    localCode: localCurrency.code,
    localAmount,
  }
}

export async function GET(request: NextRequest) {
  const countryCode = getCountryFromRequest(request)
  const currency = EXCHANGE_RATES[countryCode] || EXCHANGE_RATES['CA']
  
  console.log('[Pricing API] Returning prices for country:', countryCode, 'currency:', currency?.code || 'CAD')
  
  const prices = {
    country: countryCode,
    localCurrency: currency?.code || 'CAD',
    localCurrencySymbol: currency?.symbol || '$',
    baseCurrency: 'CAD',
    
    pro: {
      monthly: convertPrice(BASE_PRICES.pro.monthly, countryCode),
      yearly: convertPrice(BASE_PRICES.pro.yearly, countryCode),
      yearlyMonthly: convertPrice(BASE_PRICES.pro.yearlyMonthly, countryCode),
      yearlySavings: '20%',
    },
    
    api: {
      monthly: convertPrice(BASE_PRICES.api.monthly, countryCode),
      yearly: convertPrice(BASE_PRICES.api.yearly, countryCode),
      yearlyMonthly: convertPrice(BASE_PRICES.api.yearlyMonthly, countryCode),
      yearlySavings: '17%',
    },
    
    // Raw CAD prices for reference
    basePrices: BASE_PRICES,
  }
  
  return NextResponse.json(prices, {
    headers: {
      'Cache-Control': 'no-store, max-age=0', // Don't cache - we need fresh geolocation
    },
  })
}
