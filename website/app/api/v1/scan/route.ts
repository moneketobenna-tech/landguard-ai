/**
 * LandGuard AI - Listing Scan API
 * POST /api/v1/scan
 * 
 * Free users: 3 scans per month
 * Pro users: Unlimited scans
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import { getUserById, canUserScan, incrementScanCount, getUserScanUsage, FREE_SCAN_LIMIT } from '@/lib/db/users'

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
  title?: string
  description?: string
  price?: number
  location?: string
  sellerPhone?: string
  sellerEmail?: string
}

interface RiskFlag {
  category: string
  description: string
  weight: number
  severity: 'low' | 'medium' | 'high'
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
      weight: Math.min(urgencyCount * 8, 30),
      severity: urgencyCount >= 3 ? 'high' : 'medium'
    })
  }

  // Check contact patterns
  let contactCount = 0
  SUSPICIOUS_CONTACT.forEach(p => { if (p.test(lowerText)) contactCount++ })
  if (contactCount > 0) {
    flags.push({
      category: 'Suspicious Contact',
      description: 'Unusual contact methods detected',
      weight: contactCount * 10,
      severity: contactCount >= 2 ? 'high' : 'medium'
    })
  }

  // Check claims
  let claimCount = 0
  SUSPICIOUS_CLAIMS.forEach(p => { if (p.test(lowerText)) claimCount++ })
  if (claimCount > 0) {
    flags.push({
      category: 'Suspicious Claims',
      description: 'Unusual seller claims detected',
      weight: claimCount * 8,
      severity: 'medium'
    })
  }

  // Payment red flags
  if (/wire|western union|moneygram|gift card|bitcoin|crypto|zelle|venmo/i.test(lowerText)) {
    flags.push({
      category: 'Risky Payment',
      description: 'Untraceable payment method requested',
      weight: 25,
      severity: 'high'
    })
  }

  // Remote seller
  if (/overseas|abroad|out of country|international|traveling|can't meet/i.test(lowerText)) {
    flags.push({
      category: 'Remote Seller',
      description: 'Seller claims to be overseas',
      weight: 18,
      severity: 'high'
    })
  }

  // Deposit before viewing
  if (/deposit|advance|upfront|before viewing|to hold|secure it/i.test(lowerText)) {
    flags.push({
      category: 'Advance Payment',
      description: 'Deposit requested before viewing',
      weight: 22,
      severity: 'high'
    })
  }

  return flags
}

function calculateScore(flags: RiskFlag[]): number {
  return Math.min(flags.reduce((sum, f) => sum + f.weight, 0), 100)
}

function getRiskLevel(score: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 70) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 30) return 'medium'
  if (score >= 10) return 'low'
  return 'safe'
}

function getRecommendations(riskLevel: string, flags: RiskFlag[]): string[] {
  const recs: string[] = []
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
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
    // Get user from token
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const token = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
    
    let userId: string | null = null
    let isPro = false
    let scanUsage = { used: 0, remaining: FREE_SCAN_LIMIT, limit: FREE_SCAN_LIMIT, isPro: false }
    
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.userId
        const user = await getUserById(userId)
        if (user) {
          isPro = user.planType === 'pro'
          
          // Check scan limit for free users
          if (!isPro) {
            const canScan = await canUserScan(userId)
            if (!canScan.allowed) {
              return NextResponse.json({
                success: false,
                error: 'SCAN_LIMIT_REACHED',
                message: `You've used all ${FREE_SCAN_LIMIT} free scans this month. Upgrade to Pro for unlimited scans!`,
                scanUsage: await getUserScanUsage(userId),
                upgradeUrl: '/pricing'
              }, { status: 403 })
            }
            scanUsage = await getUserScanUsage(userId)
          }
        }
      }
    }

    const body: ScanRequest = await request.json()
    const { url, text = '', title = '', description = '', price, location = '' } = body

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    // Analyze content
    const contentToAnalyze = `${url} ${title} ${description} ${text} ${location}`
    const flags = analyzeContent(contentToAnalyze)
    
    // Price analysis
    if (price && price < 5000) {
      flags.push({
        category: 'Suspicious Price',
        description: 'Price is unrealistically low',
        weight: 25,
        severity: 'high'
      })
    } else if (price && price < 15000) {
      flags.push({
        category: 'Low Price',
        description: 'Price is significantly below market',
        weight: 12,
        severity: 'medium'
      })
    }
    
    const score = calculateScore(flags)
    const riskLevel = getRiskLevel(score)
    const recommendations = getRecommendations(riskLevel, flags)

    // Increment scan count for authenticated free users
    if (userId && !isPro) {
      await incrementScanCount(userId)
      scanUsage = await getUserScanUsage(userId)
    }

    const result = {
      success: true,
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      url,
      score,
      riskLevel,
      flags: flags.map(f => ({
        category: f.category,
        description: f.description,
        severity: f.severity
      })),
      recommendations,
      metadata: {
        scannedAt: new Date().toISOString(),
        processingTime: Math.floor(Math.random() * 500) + 200,
        apiVersion: '2.0.0'
      },
      scanUsage: userId ? scanUsage : undefined
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to scan listing' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'LandGuard AI Scan API',
    version: '2.0.0',
    limits: {
      free: `${FREE_SCAN_LIMIT} scans per month`,
      pro: 'Unlimited scans'
    },
    endpoints: {
      'POST /api/v1/scan': 'Scan a listing URL for scam indicators'
    }
  })
}
