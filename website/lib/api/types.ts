/**
 * LandGuard AI - API Types v2.0
 * Includes Image Analysis and Template Detection
 */

export type ApiTier = 'starter' | 'growth' | 'business' | 'enterprise'

export interface ApiKey {
  id: string
  key: string
  userId: string
  tier: ApiTier
  name: string
  createdAt: string
  lastUsedAt?: string
  usageCount: number
  monthlyUsage: number
  monthlyReset: string // ISO date when monthly usage resets
  isActive: boolean
}

export interface ApiTierConfig {
  name: string
  monthlyPrice: number
  monthlyCredits: number
  endpoints: string[]
  features: string[]
}

export const API_TIERS: Record<ApiTier, ApiTierConfig> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 199,
    monthlyCredits: 5000,
    endpoints: ['scan-listing', 'scan-seller'],
    features: ['Basic scam detection', 'Email support']
  },
  growth: {
    name: 'Growth',
    monthlyPrice: 799,
    monthlyCredits: 25000,
    endpoints: ['scan-listing', 'scan-seller', 'scan-document'],
    features: ['Advanced AI analysis', 'Document verification', 'Priority support']
  },
  business: {
    name: 'Business',
    monthlyPrice: 2499,
    monthlyCredits: 100000,
    endpoints: ['scan-listing', 'scan-seller', 'scan-document', 'bulk-scan'],
    features: ['Bulk processing', 'Custom webhooks', 'Dedicated support']
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 5000,
    monthlyCredits: -1, // Unlimited
    endpoints: ['scan-listing', 'scan-seller', 'scan-document', 'bulk-scan', 'custom'],
    features: ['Unlimited scans', 'Custom connectors', 'SLA', '24/7 support']
  }
}

export interface ScanListingRequest {
  url: string
  title?: string
  description?: string
  price?: number
  location?: string
  sellerName?: string
  sellerContact?: string
  // NEW: Image analysis fields
  imageUrls?: string[]
  imageCount?: number
}

export interface ScanSellerRequest {
  name?: string
  email?: string
  phone?: string
  profileUrl?: string
  listingHistory?: string[]
}

export interface ScanDocumentRequest {
  documentType: 'deed' | 'title' | 'contract' | 'other'
  documentUrl?: string
  documentText?: string
  propertyAddress?: string
}

export interface BulkScanRequest {
  listings: ScanListingRequest[]
  webhookUrl?: string
}

export interface RiskFlag {
  id: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  weight: number
  evidence?: string
}

// NEW: Image Analysis Result
export interface ImageAnalysisData {
  imageCount: number
  stockImageDetected: boolean
  score: number
}

// NEW: Template Analysis Result
export interface TemplateAnalysisData {
  isTemplateText: boolean
  genericPhraseCount: number
  score: number
}

export interface ScanResult {
  scanId: string
  status: 'completed' | 'pending' | 'failed'
  score: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  flags: RiskFlag[]
  recommendations: string[]
  metadata: {
    url?: string
    scannedAt: string
    processingTime: number
    apiVersion: string
  }
  // NEW: Enhanced analysis results
  analysis?: {
    imageAnalysis?: ImageAnalysisData
    templateAnalysis?: TemplateAnalysisData
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: string
  }
  meta: {
    requestId: string
    timestamp: string
    creditsUsed: number
    creditsRemaining: number
  }
}

// NEW: Report Export Types
export interface ScanReport {
  reportId: string
  scanId: string
  generatedAt: string
  format: 'pdf' | 'json'
  scanResult: ScanResult
  additionalInfo?: {
    userEmail?: string
    propertyAddress?: string
    notes?: string
  }
}
