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
const EXCHANGE_RATES: Record<string, { rate: number; symbol: string; code: string }> = {
  CA: { rate: 1, symbol: '$', code: 'CAD' },
  US: { rate: 0.74, symbol: '$', code: 'USD' },
  GB: { rate: 0.58, symbol: '£', code: 'GBP' },
  EU: { rate: 0.68, symbol: '€', code: 'EUR' },
  DE: { rate: 0.68, symbol: '€', code: 'EUR' },
  FR: { rate: 0.68, symbol: '€', code: 'EUR' },
  IT: { rate: 0.68, symbol: '€', code: 'EUR' },
  ES: { rate: 0.68, symbol: '€', code: 'EUR' },
  NL: { rate: 0.68, symbol: '€', code: 'EUR' },
  AU: { rate: 1.13, symbol: 'A$', code: 'AUD' },
  JP: { rate: 110, symbol: '¥', code: 'JPY' },
  IN: { rate: 61, symbol: '₹', code: 'INR' },
  BR: { rate: 3.66, symbol: 'R$', code: 'BRL' },
  MX: { rate: 12.7, symbol: 'MX$', code: 'MXN' },
  KR: { rate: 972, symbol: '₩', code: 'KRW' },
  SG: { rate: 0.99, symbol: 'S$', code: 'SGD' },
  HK: { rate: 5.76, symbol: 'HK$', code: 'HKD' },
  CH: { rate: 0.65, symbol: 'CHF', code: 'CHF' },
  SE: { rate: 7.66, symbol: 'kr', code: 'SEK' },
  NO: { rate: 7.88, symbol: 'kr', code: 'NOK' },
  DK: { rate: 5.06, symbol: 'kr', code: 'DKK' },
  PL: { rate: 2.96, symbol: 'zł', code: 'PLN' },
  NZ: { rate: 1.21, symbol: 'NZ$', code: 'NZD' },
  ZA: { rate: 13.6, symbol: 'R', code: 'ZAR' },
  AE: { rate: 2.70, symbol: 'د.إ', code: 'AED' },
  PH: { rate: 41, symbol: '₱', code: 'PHP' },
  MY: { rate: 3.29, symbol: 'RM', code: 'MYR' },
  TH: { rate: 26, symbol: '฿', code: 'THB' },
  ID: { rate: 11500, symbol: 'Rp', code: 'IDR' },
  VN: { rate: 18000, symbol: '₫', code: 'VND' },
  NG: { rate: 1140, symbol: '₦', code: 'NGN' },
}

// Get country from various headers
function getCountryFromRequest(request: NextRequest): string {
  // Try Cloudflare header first
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry) return cfCountry
  
  // Try Vercel header
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry
  
  // Try custom header (for testing)
  const customCountry = request.headers.get('x-country')
  if (customCountry) return customCountry
  
  // Default to Canada
  return 'CA'
}

function formatPrice(amount: number, currency: { symbol: string; code: string }): string {
  // Round to 2 decimal places for most currencies, 0 for JPY, KRW, etc.
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR']
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
  
  const prices = {
    country: countryCode,
    localCurrency: currency.code,
    localCurrencySymbol: currency.symbol,
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
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
