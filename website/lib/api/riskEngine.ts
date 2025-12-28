/**
 * LandGuard AI - Property Scam Risk Engine v2.0
 * Comprehensive analysis for property listings, sellers, and documents
 * Includes: Image Analysis, Template Detection, and Enhanced Risk Scoring
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

// === TEMPLATE DETECTION PATTERNS ===
// Common phrases found in scam listings (generic/copy-paste text)
const TEMPLATE_PHRASES = [
  'beautiful property',
  'great investment opportunity',
  'won\'t last long',
  'contact me for more details',
  'serious inquiries only',
  'ready to move in',
  'prime location',
  'motivated seller',
  'must see to appreciate',
  'priced to sell',
  'as is condition',
  'cash buyers preferred',
  'no agents please',
  'owner must relocate',
  'rare opportunity',
  'once in a lifetime',
  'dream home',
  'perfect starter home',
  'investment property',
  'rental income potential',
]

// Scam-specific template patterns
const SCAM_TEMPLATE_PATTERNS = [
  { pattern: /i am (selling|listing) (this|the) (property|house|land) (because|due to)/i, weight: 12 },
  { pattern: /my (husband|wife|spouse|father|mother) (passed away|died|is deceased)/i, weight: 15 },
  { pattern: /i am (relocating|moving) (to another|out of) (country|state|city)/i, weight: 12 },
  { pattern: /god bless/i, weight: 8 },
  { pattern: /you will (not|never) (regret|be disappointed)/i, weight: 8 },
  { pattern: /send (me|us) (your|the) (email|phone|contact)/i, weight: 10 },
  { pattern: /reply (to this email|with your)/i, weight: 10 },
  { pattern: /i will (send|provide) (you |)(the |)(keys|documents|deed)/i, weight: 15 },
  { pattern: /(keys|deed|documents) will be (sent|mailed|shipped)/i, weight: 18 },
  { pattern: /airbnb|booking\.com/i, weight: 12 }, // Fake rental scams
]

// === STOCK IMAGE DETECTION PATTERNS ===
// Common stock photo URL patterns and image hosting sites
const STOCK_IMAGE_INDICATORS = [
  'shutterstock',
  'istockphoto',
  'gettyimages',
  'depositphotos',
  'dreamstime',
  'adobestock',
  'stock.adobe',
  '123rf',
  'alamy',
  'bigstockphoto',
  'canstockphoto',
  'fotolia',
  'pixabay',
  'unsplash',
  'pexels',
  'freepik',
]

// Suspicious image filename patterns
const SUSPICIOUS_IMAGE_PATTERNS = [
  /stock[_-]?(photo|image)/i,
  /sample[_-]?(image|photo)/i,
  /placeholder/i,
  /default[_-]?(image|photo)/i,
  /generic/i,
  /\d{8,}[_-]?\d+/,  // Long numeric IDs typical of stock photos
  /DSC_?\d{4,}/i,    // Generic camera naming
  /IMG_?\d{4,}/i,
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
  const legitDomains = ['facebook', 'craigslist', 'kijiji', 'realtor', 'zillow', 'trulia', 'redfin', 'propertypro', 'jumia', 'juwai', 'rightmove', 'propertystar', 'zoopla']
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

// === NEW: IMAGE ANALYSIS ===

export interface ImageAnalysisResult {
  imageCount: number
  stockImageDetected: boolean
  suspiciousPatterns: string[]
  flags: RiskFlag[]
  score: number
}

export function analyzeImages(
  imageUrls: string[] = [],
  imageCount?: number
): ImageAnalysisResult {
  const flags: RiskFlag[] = []
  const suspiciousPatterns: string[] = []
  let stockImageDetected = false
  let analysisScore = 0
  
  const actualImageCount = imageUrls.length || imageCount || 0
  
  // Check image count
  if (actualImageCount === 0) {
    flags.push({
      id: generateFlagId(),
      category: 'Image Analysis',
      severity: 'high',
      description: 'No images provided (suspicious for property listing)',
      weight: 18
    })
    analysisScore += 18
  } else if (actualImageCount === 1) {
    flags.push({
      id: generateFlagId(),
      category: 'Image Analysis',
      severity: 'medium',
      description: 'Only 1 image (legitimate sellers typically provide multiple)',
      weight: 10
    })
    analysisScore += 10
  } else if (actualImageCount < 3) {
    flags.push({
      id: generateFlagId(),
      category: 'Image Analysis',
      severity: 'low',
      description: 'Few images provided (2 photos)',
      weight: 5
    })
    analysisScore += 5
  }
  
  // Analyze each image URL
  for (const url of imageUrls) {
    const urlLower = url.toLowerCase()
    
    // Check for stock image hosting sites
    for (const stockSite of STOCK_IMAGE_INDICATORS) {
      if (urlLower.includes(stockSite)) {
        stockImageDetected = true
        suspiciousPatterns.push(`Stock image source: ${stockSite}`)
        flags.push({
          id: generateFlagId(),
          category: 'Image Analysis',
          severity: 'critical',
          description: `Stock photo detected (${stockSite})`,
          weight: 25,
          evidence: url
        })
        analysisScore += 25
        break
      }
    }
    
    // Check for suspicious filename patterns
    for (const pattern of SUSPICIOUS_IMAGE_PATTERNS) {
      if (pattern.test(urlLower)) {
        suspiciousPatterns.push(`Suspicious filename pattern: ${pattern.source}`)
        if (!stockImageDetected) {
          flags.push({
            id: generateFlagId(),
            category: 'Image Analysis',
            severity: 'medium',
            description: 'Suspicious image filename pattern',
            weight: 12,
            evidence: url.split('/').pop()
          })
          analysisScore += 12
        }
        break
      }
    }
    
    // Check for generic/placeholder image indicators in URL
    if (/no[_-]?image|placeholder|default|sample/i.test(urlLower)) {
      flags.push({
        id: generateFlagId(),
        category: 'Image Analysis',
        severity: 'high',
        description: 'Placeholder/default image detected',
        weight: 15,
        evidence: url
      })
      analysisScore += 15
    }
    
    // Check for data URIs (sometimes used to embed stock images)
    if (url.startsWith('data:image')) {
      flags.push({
        id: generateFlagId(),
        category: 'Image Analysis',
        severity: 'low',
        description: 'Embedded image (cannot verify source)',
        weight: 5
      })
      analysisScore += 5
    }
  }
  
  return {
    imageCount: actualImageCount,
    stockImageDetected,
    suspiciousPatterns,
    flags,
    score: Math.min(100, analysisScore)
  }
}

// === NEW: TEMPLATE DETECTION ===

export interface TemplateAnalysisResult {
  isTemplateText: boolean
  genericPhraseCount: number
  scamPatternCount: number
  matchedPhrases: string[]
  flags: RiskFlag[]
  score: number
}

export function analyzeTemplate(text: string): TemplateAnalysisResult {
  const flags: RiskFlag[] = []
  const matchedPhrases: string[] = []
  const textLower = text.toLowerCase()
  let genericPhraseCount = 0
  let scamPatternCount = 0
  let analysisScore = 0
  
  // Check for generic template phrases
  for (const phrase of TEMPLATE_PHRASES) {
    if (textLower.includes(phrase.toLowerCase())) {
      genericPhraseCount++
      matchedPhrases.push(phrase)
    }
  }
  
  // Check for scam-specific template patterns
  for (const { pattern, weight } of SCAM_TEMPLATE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      scamPatternCount++
      matchedPhrases.push(match[0])
      
      const severity = weight >= 15 ? 'high' : weight >= 10 ? 'medium' : 'low'
      flags.push({
        id: generateFlagId(),
        category: 'Template Detection',
        severity,
        description: 'Scam template phrase detected',
        weight,
        evidence: match[0]
      })
      analysisScore += weight
    }
  }
  
  // Flag if many generic phrases found (indicates copy-paste)
  if (genericPhraseCount >= 5) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'high',
      description: `High number of generic phrases (${genericPhraseCount} found)`,
      weight: 15,
      evidence: matchedPhrases.slice(0, 3).join(', ')
    })
    analysisScore += 15
  } else if (genericPhraseCount >= 3) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'medium',
      description: `Multiple generic phrases detected (${genericPhraseCount} found)`,
      weight: 8,
      evidence: matchedPhrases.slice(0, 3).join(', ')
    })
    analysisScore += 8
  }
  
  // Check for very short descriptions (lazy/template)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount < 20 && text.length > 0) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'medium',
      description: 'Very short description (possibly copy-paste)',
      weight: 10
    })
    analysisScore += 10
  }
  
  // Check for excessive capitalization (common in scam templates)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.3 && text.length > 50) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'medium',
      description: 'Excessive capitalization (SHOUTING text)',
      weight: 8
    })
    analysisScore += 8
  }
  
  // Check for repetitive punctuation
  if (/[!?]{3,}/.test(text)) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'low',
      description: 'Excessive punctuation (unprofessional)',
      weight: 5
    })
    analysisScore += 5
  }
  
  // Check for ALL CAPS sections
  const allCapsWords = text.match(/\b[A-Z]{4,}\b/g) || []
  if (allCapsWords.length >= 3) {
    flags.push({
      id: generateFlagId(),
      category: 'Template Detection',
      severity: 'low',
      description: `Multiple ALL CAPS words (${allCapsWords.length} found)`,
      weight: 5,
      evidence: allCapsWords.slice(0, 3).join(', ')
    })
    analysisScore += 5
  }
  
  const isTemplateText = genericPhraseCount >= 3 || scamPatternCount >= 2
  
  return {
    isTemplateText,
    genericPhraseCount,
    scamPatternCount,
    matchedPhrases,
    flags,
    score: Math.min(100, analysisScore)
  }
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
  
  // NEW: Image Analysis
  const imageAnalysis = analyzeImages(request.imageUrls, request.imageCount)
  flags.push(...imageAnalysis.flags)
  
  // NEW: Template Detection
  const templateAnalysis = analyzeTemplate(textToAnalyze)
  flags.push(...templateAnalysis.flags)
  
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
  const recommendations = generateRecommendations(riskLevel, flags, imageAnalysis, templateAnalysis)
  
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
      apiVersion: '2.0.0'
    },
    analysis: {
      imageAnalysis: {
        imageCount: imageAnalysis.imageCount,
        stockImageDetected: imageAnalysis.stockImageDetected,
        score: imageAnalysis.score
      },
      templateAnalysis: {
        isTemplateText: templateAnalysis.isTemplateText,
        genericPhraseCount: templateAnalysis.genericPhraseCount,
        score: templateAnalysis.score
      }
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
  
  // Template analysis on listing history
  if (request.listingHistory && request.listingHistory.length > 0) {
    const historyText = request.listingHistory.join(' ')
    const templateAnalysis = analyzeTemplate(historyText)
    flags.push(...templateAnalysis.flags)
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
      apiVersion: '2.0.0'
    }
  }
}

export function scanDocument(request: ScanDocumentRequest): ScanResult {
  const startTime = Date.now()
  const flags: RiskFlag[] = []
  
  const textToAnalyze = request.documentText || ''
  
  flags.push(...analyzePatterns(textToAnalyze, DOCUMENT_PATTERNS, 'Document'))
  
  // Template detection for documents
  const templateAnalysis = analyzeTemplate(textToAnalyze)
  flags.push(...templateAnalysis.flags)
  
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
      apiVersion: '2.0.0'
    }
  }
}

function generateRecommendations(
  riskLevel: string, 
  flags: RiskFlag[],
  imageAnalysis?: ImageAnalysisResult,
  templateAnalysis?: TemplateAnalysisResult
): string[] {
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
  
  // NEW: Image-specific recommendations
  if (imageAnalysis) {
    if (imageAnalysis.stockImageDetected) {
      recs.push('🖼️ Stock photo detected - Request actual property photos')
      recs.push('📸 Ask for photos with today\'s date visible')
    }
    if (imageAnalysis.imageCount === 0) {
      recs.push('📷 No photos provided - Legitimate sellers show their property')
    } else if (imageAnalysis.imageCount < 3) {
      recs.push('📷 Request more photos of the property (interior/exterior)')
    }
  }
  
  // NEW: Template-specific recommendations
  if (templateAnalysis) {
    if (templateAnalysis.isTemplateText) {
      recs.push('📝 Generic/template text detected - Ask seller for specific details')
      recs.push('❓ Ask questions about the property that require unique answers')
    }
    if (templateAnalysis.scamPatternCount >= 2) {
      recs.push('⚠️ Multiple scam phrase patterns detected - High likelihood of fraud')
    }
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
