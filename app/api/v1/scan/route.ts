/**
 * LandGuard AI - Listing Scan API
 * POST /api/v1/scan
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Risk patterns
const URGENCY_PATTERNS = [
  /urgent/i, /quick sale/i, /must sell/i, /deposit today/i, /wire transfer/i,
  /gift card/i, /immediate/i, /act fast/i, /won't last/i, /first come/i,
  /serious buyers only/i, /cash only/i, /motivated seller/i, /below market/i,
  /western union/i, /moneygram/i, /bitcoin/i, /crypto/i, /zelle/i, /venmo/i
]

const SUSPICIOUS_CONTACT = [
  /whatsapp only/i, /text only/i, /no calls/i, /telegram/i,
  /overseas/i, /out of (the )?country/i, /abroad/i, /traveling/i
]

const SUSPICIOUS_CLAIMS = [
  /owner financing/i, /rent to own/i, /no credit check/i, /bad credit ok/i,
  /no bank needed/i, /private sale/i, /off market/i, /exclusive deal/i
]

interface ScanRequest {
  url: string
  text?: string
  sellerPhone?: string
  sellerEmail?: string
}

interface RiskFlag {
  category: string
  description: string
  weight: number
}

function analyzeContent(text: string): RiskFlag[] {
  const flags: RiskFlag[] = []
  const lowerText = text.toLowerCase()

  // Check urgency
  let urgencyCount = 0
  URGENCY_PATTERNS.forEach(p => { if (p.test(lowerText)) urgencyCount++ })
  if (urgencyCount > 0) {
    flags.push({
      category: 'Urgency Language',
      description: `${urgencyCount} pressure tactics detected`,
      weight: Math.min(urgencyCount * 8, 30)
    })
  }

  // Check contact patterns
  let contactCount = 0
  SUSPICIOUS_CONTACT.forEach(p => { if (p.test(lowerText)) contactCount++ })
  if (contactCount > 0) {
    flags.push({
      category: 'Suspicious Contact',
      description: 'Unusual contact methods detected',
      weight: contactCount * 10
    })
  }

  // Check claims
  let claimCount = 0
  SUSPICIOUS_CLAIMS.forEach(p => { if (p.test(lowerText)) claimCount++ })
  if (claimCount > 0) {
    flags.push({
      category: 'Suspicious Claims',
      description: 'Unusual seller claims detected',
      weight: claimCount * 8
    })
  }

  // Payment red flags
  if (/wire|western union|moneygram|gift card|bitcoin|crypto|zelle|venmo/i.test(lowerText)) {
    flags.push({
      category: 'Risky Payment',
      description: 'Untraceable payment method requested',
      weight: 25
    })
  }

  // Remote seller
  if (/overseas|abroad|out of country|international|traveling|can't meet/i.test(lowerText)) {
    flags.push({
      category: 'Remote Seller',
      description: 'Seller claims to be overseas',
      weight: 18
    })
  }

  // Deposit before viewing
  if (/deposit|advance|upfront|before viewing|to hold|secure it/i.test(lowerText)) {
    flags.push({
      category: 'Advance Payment',
      description: 'Deposit requested before viewing',
      weight: 22
    })
  }

  return flags
}

function calculateScore(flags: RiskFlag[]): number {
  return Math.min(flags.reduce((sum, f) => sum + f.weight, 0), 100)
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

function getRecommendations(riskLevel: string, flags: RiskFlag[]): string[] {
  const recs: string[] = []
  
  if (riskLevel === 'high') {
    recs.push('⛔ Do NOT send any money or deposit')
    recs.push('🚫 Do NOT share personal information')
    recs.push('🔍 Verify ownership through land registry')
  } else if (riskLevel === 'medium') {
    recs.push('⚠️ Proceed with extreme caution')
    recs.push('🔍 Verify seller identity independently')
  } else {
    recs.push('✅ Listing appears legitimate')
    recs.push('📋 Use a licensed agent for transaction')
  }

  const categories = flags.map(f => f.category)
  if (categories.includes('Risky Payment')) {
    recs.push('💳 Only use traceable payment methods')
  }
  if (categories.includes('Remote Seller')) {
    recs.push('🤝 Insist on meeting seller in person')
  }

  return recs
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json()
    const { url, text = '' } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Analyze the URL and any provided text
    const contentToAnalyze = `${url} ${text}`
    const flags = analyzeContent(contentToAnalyze)
    const score = calculateScore(flags)
    const riskLevel = getRiskLevel(score)
    const recommendations = getRecommendations(riskLevel, flags)

    const result = {
      status: 'ok',
      url,
      score,
      riskLevel,
      flags: flags.map(f => `${f.category}: ${f.description}`),
      recommendations,
      scannedAt: new Date().toISOString()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Failed to scan listing' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'LandGuard AI Scan API',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/scan': 'Scan a listing URL for scam indicators'
    }
  })
}

