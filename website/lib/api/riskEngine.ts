/**
 * LandGuard AI - Property Scam Risk Engine
 * Comprehensive analysis for property listings, sellers, and documents
 */

import { RiskFlag, ScanListingRequest, ScanSellerRequest, ScanDocumentRequest, ScanResult } from './types'

// === PATTERN DEFINITIONS ===

const URGENCY_PATTERNS = [
  { pattern: /urgent/i, description: 'Urgency language', weight: 8 },
  { pattern: /quick sale/i, description: 'Rushing sale', weight: 10 },
  { pattern: /must sell (fast|today|now|immediately)/i, description: 'Pressure to sell immediately', weight: 15 },
  { pattern: /deposit (today|now|immediately)/i, description: 'Immediate deposit request', weight: 20 },
  { pattern: /act (fast|now|quickly)/i, description: 'Pressure tactics', weight: 8 },
  { pattern: /won't last/i, description: 'False scarcity', weight: 8 },
  { pattern: /first come first serve/i, description: 'Pressure tactic', weight: 10 },
  { pattern: /serious buyers only/i, description: 'Filtering tactic', weight: 5 },
  { pattern: /motivated seller/i, description: 'Urgency signal', weight: 6 },
  { pattern: /below market (value|price)/i, description: 'Too good to be true pricing', weight: 12 },
  { pattern: /unbelievable (deal|price|offer)/i, description: 'Suspicious pricing claims', weight: 15 },
]

const PAYMENT_PATTERNS = [
  { pattern: /wire transfer/i, description: 'Wire transfer requested', weight: 25 },
  { pattern: /western union/i, description: 'Western Union payment', weight: 30 },
  { pattern: /moneygram/i, description: 'MoneyGram payment', weight: 30 },
  { pattern: /gift card/i, description: 'Gift card payment', weight: 35 },
  { pattern: /bitcoin|crypto(currency)?/i, description: 'Cryptocurrency payment', weight: 25 },
  { pattern: /zelle/i, description: 'Zelle payment requested', weight: 15 },
  { pattern: /venmo/i, description: 'Venmo payment requested', weight: 15 },
  { pattern: /cash app/i, description: 'Cash App payment requested', weight: 15 },
  { pattern: /upfront (payment|deposit)/i, description: 'Upfront payment required', weight: 20 },
  { pattern: /non-refundable deposit/i, description: 'Non-refundable deposit', weight: 22 },
]

const CONTACT_PATTERNS = [
  { pattern: /whatsapp only/i, description: 'WhatsApp-only communication', weight: 15 },
  { pattern: /text only/i, description: 'Text-only communication', weight: 12 },
  { pattern: /no (phone )?calls/i, description: 'Avoiding phone calls', weight: 15 },
  { pattern: /telegram/i, description: 'Telegram contact', weight: 12 },
  { pattern: /email only/i, description: 'Email-only communication', weight: 10 },
]

const SELLER_PATTERNS = [
  { pattern: /overseas|abroad/i, description: 'Seller claims to be overseas', weight: 20 },
  { pattern: /out of (the )?(country|town|state)/i, description: 'Remote seller', weight: 18 },
  { pattern: /traveling/i, description: 'Seller traveling', weight: 12 },
  { pattern: /can'?t meet (in person)?/i, description: 'Cannot meet in person', weight: 18 },
  { pattern: /military|deployed/i, description: 'Military deployment claim', weight: 15 },
  { pattern: /missionary|charity work/i, description: 'Missionary work claim', weight: 15 },
  { pattern: /inherited (property|house|land)/i, description: 'Inheritance claim', weight: 8 },
  { pattern: /divorce|estate sale/i, description: 'Personal situation claim', weight: 6 },
]

const CLAIM_PATTERNS = [
  { pattern: /owner financing/i, description: 'Owner financing offered', weight: 10 },
  { pattern: /rent to own/i, description: 'Rent-to-own scheme', weight: 12 },
  { pattern: /no credit check/i, description: 'No credit check claim', weight: 15 },
  { pattern: /bad credit (ok|welcome)/i, description: 'Targeting bad credit', weight: 12 },
  { pattern: /no (bank|mortgage) needed/i, description: 'Avoiding traditional financing', weight: 15 },
  { pattern: /private sale/i, description: 'Private sale claim', weight: 8 },
  { pattern: /off market/i, description: 'Off-market listing', weight: 6 },
  { pattern: /exclusive deal/i, description: 'Exclusivity claim', weight: 10 },
  { pattern: /investor special/i, description: 'Targeting investors', weight: 8 },
]

const DOCUMENT_PATTERNS = [
  { pattern: /quit\s?claim deed/i, description: 'Quitclaim deed warning', weight: 12 },
  { pattern: /warranty deed/i, description: 'Warranty deed (verify)', weight: 0 },
  { pattern: /notarized|notary/i, description: 'Notarization mentioned', weight: -5 },
  { pattern: /title (insurance|company)/i, description: 'Title insurance mentioned', weight: -8 },
  { pattern: /escrow/i, description: 'Escrow mentioned', weight: -10 },
  { pattern: /attorney|lawyer/i, description: 'Legal representation', weight: -8 },
  { pattern: /forged|fake/i, description: 'Potential document issues', weight: 25 },
  { pattern: /expired/i, description: 'Expired document', weight: 15 },
]

// === ANALYSIS FUNCTIONS ===

function generateFlagId(): string {
  return `flag_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function analyzePatterns(
  text: string,
  patterns: { pattern: RegExp; description: string; weight: number }[],
  category: string
): RiskFlag[] {
  const flags: RiskFlag[] = []
  
  for (const p of patterns) {
    const matches = text.match(p.pattern)
    if (matches) {
      const severity = p.weight >= 25 ? 'critical' 
        : p.weight >= 15 ? 'high' 
        : p.weight >= 8 ? 'medium' 
        : 'low'
      
      flags.push({
        id: generateFlagId(),
        category,
        severity,
        description: p.description,
        weight: p.weight,
        evidence: matches[0]
      })
    }
  }
  
  return flags
}

function analyzeUrl(url: string): RiskFlag[] {
  const flags: RiskFlag[] = []
  
  // Check for suspicious domains
  const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'shorturl']
  const urlLower = url.toLowerCase()
  
  for (const domain of suspiciousDomains) {
    if (urlLower.includes(domain)) {
      flags.push({
        id: generateFlagId(),
        category: 'Suspicious URL',
        severity: 'medium',
        description: 'Shortened URL detected',
        weight: 10,
        evidence: domain
      })
      break
    }
  }
  
  // Check for typosquatting
  const legitDomains = ['facebook', 'craigslist', 'kijiji', 'realtor', 'zillow', 'trulia', 'redfin']
  for (const domain of legitDomains) {
    const typos = [
      domain.replace('a', '4'),
      domain.replace('o', '0'),
      domain.replace('i', '1'),
      domain + 's',
      domain.slice(0, -1)
    ]
    for (const typo of typos) {
      if (urlLower.includes(typo) && !urlLower.includes(domain)) {
        flags.push({
          id: generateFlagId(),
          category: 'Suspicious URL',
          severity: 'high',
          description: 'Possible typosquatting domain',
          weight: 18,
          evidence: typo
        })
        break
      }
    }
  }
  
  return flags
}

function analyzePricing(price: number | undefined, description: string): RiskFlag[] {
  const flags: RiskFlag[] = []
  
  if (!price) return flags
  
  // Extract price mentions from description
  const priceMatches = description.match(/\$[\d,]+/g) || []
  const originalPrices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')))
  
  // Check for dramatic price drops
  for (const originalPrice of originalPrices) {
    if (originalPrice > price * 2) {
      flags.push({
        id: generateFlagId(),
        category: 'Price Analysis',
        severity: 'high',
        description: 'Dramatic price reduction (>50%)',
        weight: 15,
        evidence: `Original: $${originalPrice}, Current: $${price}`
      })
      break
    }
  }
  
  // Check for suspicious price amounts
  if (price < 1000 && description.toLowerCase().includes('acre')) {
    flags.push({
      id: generateFlagId(),
      category: 'Price Analysis',
      severity: 'high',
      description: 'Suspiciously low price for land',
      weight: 20
    })
  }
  
  return flags
}

function analyzeEmail(email: string | undefined): RiskFlag[] {
  const flags: RiskFlag[] = []
  if (!email) return flags
  
  const emailLower = email.toLowerCase()
  
  // Check for free email providers in professional context
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
  const domain = emailLower.split('@')[1]
  
  // This is informational, not necessarily a red flag
  if (freeProviders.includes(domain)) {
    flags.push({
      id: generateFlagId(),
      category: 'Contact Analysis',
      severity: 'low',
      description: 'Personal email used (verify business credentials)',
      weight: 3
    })
  }
  
  // Check for suspicious email patterns
  if (/\d{4,}/.test(emailLower)) {
    flags.push({
      id: generateFlagId(),
      category: 'Contact Analysis',
      severity: 'medium',
      description: 'Email contains many numbers',
      weight: 8
    })
  }
  
  return flags
}

function analyzePhone(phone: string | undefined): RiskFlag[] {
  const flags: RiskFlag[] = []
  if (!phone) return flags
  
  // Check for VOIP/virtual number patterns (example area codes)
  const voipAreaCodes = ['456', '500', '533', '544', '566', '577', '588']
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length >= 10) {
    const areaCode = cleaned.slice(-10, -7)
    if (voipAreaCodes.includes(areaCode)) {
      flags.push({
        id: generateFlagId(),
        category: 'Contact Analysis',
        severity: 'medium',
        description: 'Possible VOIP/virtual phone number',
        weight: 10
      })
    }
  }
  
  return flags
}

// === MAIN SCAN FUNCTIONS ===

export function scanListing(request: ScanListingRequest): ScanResult {
  const startTime = Date.now()
  const flags: RiskFlag[] = []
  
  const textToAnalyze = [
    request.title || '',
    request.description || '',
    request.sellerName || '',
    request.sellerContact || '',
    request.location || ''
  ].join(' ')
  
  // Analyze all patterns
  flags.push(...analyzePatterns(textToAnalyze, URGENCY_PATTERNS, 'Urgency'))
  flags.push(...analyzePatterns(textToAnalyze, PAYMENT_PATTERNS, 'Payment'))
  flags.push(...analyzePatterns(textToAnalyze, CONTACT_PATTERNS, 'Contact'))
  flags.push(...analyzePatterns(textToAnalyze, SELLER_PATTERNS, 'Seller'))
  flags.push(...analyzePatterns(textToAnalyze, CLAIM_PATTERNS, 'Claims'))
  flags.push(...analyzeUrl(request.url))
  flags.push(...analyzePricing(request.price, textToAnalyze))
  
  // Calculate score
  const totalWeight = flags.reduce((sum, f) => sum + Math.max(0, f.weight), 0)
  const score = Math.min(100, totalWeight)
  
  // Determine risk level
  const riskLevel = score >= 70 ? 'critical'
    : score >= 50 ? 'high'
    : score >= 30 ? 'medium'
    : score >= 10 ? 'low'
    : 'safe'
  
  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, flags)
  
  return {
    scanId: `scan_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: 'completed',
    score,
    riskLevel,
    flags: flags.filter(f => f.weight > 0),
    recommendations,
    metadata: {
      url: request.url,
      scannedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      apiVersion: '1.0.0'
    }
  }
}

export function scanSeller(request: ScanSellerRequest): ScanResult {
  const startTime = Date.now()
  const flags: RiskFlag[] = []
  
  const textToAnalyze = [
    request.name || '',
    request.email || '',
    request.phone || '',
    ...(request.listingHistory || [])
  ].join(' ')
  
  flags.push(...analyzePatterns(textToAnalyze, SELLER_PATTERNS, 'Seller Profile'))
  flags.push(...analyzePatterns(textToAnalyze, CONTACT_PATTERNS, 'Contact Methods'))
  flags.push(...analyzeEmail(request.email))
  flags.push(...analyzePhone(request.phone))
  
  if (request.profileUrl) {
    flags.push(...analyzeUrl(request.profileUrl))
  }
  
  // Check listing history for patterns
  if (request.listingHistory && request.listingHistory.length > 10) {
    flags.push({
      id: generateFlagId(),
      category: 'Seller Activity',
      severity: 'medium',
      description: 'High volume of listings',
      weight: 8
    })
  }
  
  const totalWeight = flags.reduce((sum, f) => sum + Math.max(0, f.weight), 0)
  const score = Math.min(100, totalWeight)
  
  const riskLevel = score >= 70 ? 'critical'
    : score >= 50 ? 'high'
    : score >= 30 ? 'medium'
    : score >= 10 ? 'low'
    : 'safe'
  
  return {
    scanId: `scan_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: 'completed',
    score,
    riskLevel,
    flags: flags.filter(f => f.weight > 0),
    recommendations: generateRecommendations(riskLevel, flags),
    metadata: {
      scannedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      apiVersion: '1.0.0'
    }
  }
}

export function scanDocument(request: ScanDocumentRequest): ScanResult {
  const startTime = Date.now()
  const flags: RiskFlag[] = []
  
  const textToAnalyze = request.documentText || ''
  
  flags.push(...analyzePatterns(textToAnalyze, DOCUMENT_PATTERNS, 'Document'))
  
  // Document-specific checks
  if (request.documentType === 'deed') {
    // Check for essential deed elements
    const essentialElements = [
      { pattern: /grantor/i, name: 'Grantor identification' },
      { pattern: /grantee/i, name: 'Grantee identification' },
      { pattern: /legal description/i, name: 'Legal description' },
      { pattern: /consideration/i, name: 'Consideration' },
    ]
    
    for (const element of essentialElements) {
      if (!element.pattern.test(textToAnalyze)) {
        flags.push({
          id: generateFlagId(),
          category: 'Document Completeness',
          severity: 'medium',
          description: `Missing: ${element.name}`,
          weight: 10
        })
      }
    }
  }
  
  // Check for address verification
  if (request.propertyAddress && !textToAnalyze.toLowerCase().includes(request.propertyAddress.toLowerCase())) {
    flags.push({
      id: generateFlagId(),
      category: 'Address Verification',
      severity: 'high',
      description: 'Document address does not match provided address',
      weight: 20
    })
  }
  
  const totalWeight = flags.reduce((sum, f) => sum + Math.max(0, f.weight), 0)
  const score = Math.min(100, totalWeight)
  
  const riskLevel = score >= 70 ? 'critical'
    : score >= 50 ? 'high'
    : score >= 30 ? 'medium'
    : score >= 10 ? 'low'
    : 'safe'
  
  return {
    scanId: `scan_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: 'completed',
    score,
    riskLevel,
    flags: flags.filter(f => f.weight > 0),
    recommendations: generateDocumentRecommendations(riskLevel, flags, request.documentType),
    metadata: {
      scannedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      apiVersion: '1.0.0'
    }
  }
}

function generateRecommendations(riskLevel: string, flags: RiskFlag[]): string[] {
  const recs: string[] = []
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recs.push('⛔ Do NOT send any money or deposit')
    recs.push('🚫 Do NOT share personal/financial information')
    recs.push('🔍 Verify property ownership through county records')
    recs.push('📞 Contact local authorities if you suspect fraud')
  } else if (riskLevel === 'medium') {
    recs.push('⚠️ Proceed with extreme caution')
    recs.push('🔍 Verify seller identity independently')
    recs.push('💼 Consider using a licensed real estate agent')
    recs.push('🏛️ Check county property records')
  } else if (riskLevel === 'low') {
    recs.push('✅ Listing appears mostly legitimate')
    recs.push('📋 Still verify ownership before proceeding')
    recs.push('💼 Use a licensed agent for the transaction')
  } else {
    recs.push('✅ No significant red flags detected')
    recs.push('📋 Standard due diligence recommended')
    recs.push('🏦 Use escrow for any payments')
  }
  
  // Category-specific recommendations
  const categories = new Set(flags.map(f => f.category))
  
  if (categories.has('Payment')) {
    recs.push('💳 Only use traceable payment methods (escrow, bank transfer)')
  }
  if (categories.has('Seller')) {
    recs.push('🤝 Insist on meeting the seller in person')
    recs.push('📄 Request government ID verification')
  }
  if (categories.has('Contact')) {
    recs.push('📞 Request a video call to verify identity')
  }
  
  return recs
}

function generateDocumentRecommendations(riskLevel: string, flags: RiskFlag[], docType: string): string[] {
  const recs: string[] = []
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recs.push('⛔ Do NOT proceed with this document')
    recs.push('⚖️ Have a real estate attorney review immediately')
    recs.push('🔍 Verify document authenticity with issuing authority')
  } else if (riskLevel === 'medium') {
    recs.push('⚠️ Document requires professional review')
    recs.push('⚖️ Consult with a real estate attorney')
    recs.push('🏛️ Verify with county recorder\'s office')
  } else {
    recs.push('✅ Document appears valid')
    recs.push('📋 Recommended: Attorney review before signing')
    recs.push('🔐 Ensure proper notarization')
  }
  
  if (docType === 'deed') {
    recs.push('🏠 Obtain title insurance')
    recs.push('📜 Verify chain of title')
  }
  
  return recs
}

