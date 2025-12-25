/**
 * LandGuard AI - API Documentation Root v2.0
 * GET /api/v1
 * 
 * Returns API documentation and available endpoints
 * Now includes Image Analysis, Template Detection, and Report Export
 */

import { NextResponse } from 'next/server'
import { API_TIERS } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    name: 'LandGuard AI Property Scam Detection API',
    version: '2.0.0',
    baseUrl: 'https://landguardai.co/api/v1',
    documentation: 'https://landguardai.co/api-docs',
    
    features: {
      imageAnalysis: 'Detects stock photos, placeholder images, and suspicious image patterns',
      templateDetection: 'Identifies generic/copy-paste text common in scam listings',
      reportExport: 'Generate professional PDF reports of scan results'
    },
    
    authentication: {
      methods: [
        'Authorization: Bearer <api_key>',
        'X-API-Key: <api_key>'
      ],
      note: 'Get your API key at https://landguardai.co/app/api-keys'
    },
    
    endpoints: {
      'GET /api/v1': {
        description: 'API documentation (this endpoint)',
        authentication: false,
        tiers: 'All'
      },
      'GET /api/v1/usage': {
        description: 'Get API usage statistics for your key',
        authentication: true,
        tiers: 'All'
      },
      'POST /api/v1/scan-listing': {
        description: 'Scan a property listing for scam indicators (includes Image & Template Analysis)',
        authentication: true,
        tiers: 'Starter, Growth, Business, Enterprise',
        creditsPerRequest: 1,
        newInV2: ['imageUrls parameter for image analysis', 'analysis.imageAnalysis in response', 'analysis.templateAnalysis in response']
      },
      'POST /api/v1/scan-seller': {
        description: 'Analyze a seller profile for risk indicators',
        authentication: true,
        tiers: 'Starter, Growth, Business, Enterprise',
        creditsPerRequest: 1
      },
      'POST /api/v1/scan-document': {
        description: 'Analyze property documents for issues',
        authentication: true,
        tiers: 'Growth, Business, Enterprise',
        creditsPerRequest: 2
      },
      'POST /api/v1/bulk-scan': {
        description: 'Scan multiple listings in one request',
        authentication: true,
        tiers: 'Business, Enterprise',
        creditsPerRequest: '1 per listing (max 100)'
      },
      'POST /api/v1/report': {
        description: 'Generate HTML report for PDF export',
        authentication: false,
        tiers: 'All',
        newInV2: true
      }
    },
    
    pricingTiers: Object.entries(API_TIERS).map(([key, tier]) => ({
      tier: key,
      name: tier.name,
      price: tier.monthlyPrice === 5000 ? 'Custom ($5,000+)' : `$${tier.monthlyPrice}/mo`,
      monthlyCredits: tier.monthlyCredits === -1 ? 'Unlimited' : tier.monthlyCredits.toLocaleString(),
      endpoints: tier.endpoints,
      features: tier.features
    })),
    
    requestExamples: {
      'scan-listing': {
        url: 'https://facebook.com/marketplace/listing/123',
        title: 'Beautiful 5 Acre Land - URGENT SALE',
        description: 'Must sell today, wire transfer only...',
        price: 5000,
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ],
        imageCount: 2
      }
    },
    
    responseFormat: {
      success: {
        success: true,
        data: {
          scanId: 'scan_xxxxx',
          score: 75,
          riskLevel: 'high',
          flags: [
            { category: 'Payment', severity: 'high', description: 'Wire transfer requested' }
          ],
          recommendations: ['Do NOT send money...'],
          analysis: {
            imageAnalysis: {
              imageCount: 2,
              stockImageDetected: false,
              score: 0
            },
            templateAnalysis: {
              isTemplateText: true,
              genericPhraseCount: 5,
              score: 15
            }
          }
        },
        meta: {
          requestId: 'Unique request identifier',
          timestamp: 'ISO timestamp',
          creditsUsed: 'Number of credits consumed',
          creditsRemaining: 'Remaining credits this month'
        }
      },
      error: {
        success: false,
        error: {
          code: 'Error code',
          message: 'Human-readable error message',
          details: 'Optional additional details'
        },
        meta: { '...': '...' }
      }
    },
    
    errorCodes: {
      MISSING_API_KEY: 'No API key provided',
      INVALID_KEY: 'API key is invalid or revoked',
      KEY_DISABLED: 'API key has been disabled',
      RATE_LIMIT_EXCEEDED: 'Monthly credit limit exceeded',
      ENDPOINT_NOT_ALLOWED: 'Endpoint not available on your tier',
      MISSING_FIELD: 'Required field missing in request',
      INVALID_URL: 'Invalid URL format',
      INVALID_EMAIL: 'Invalid email format',
      SCAN_LIMIT_REACHED: 'Free scan limit reached (web app users)',
      INTERNAL_ERROR: 'Server error - contact support'
    },
    
    riskLevels: {
      safe: 'No significant risk indicators (score 0-9)',
      low: 'Minor concerns, proceed with normal caution (score 10-29)',
      medium: 'Notable concerns, verify details carefully (score 30-49)',
      high: 'Significant red flags, proceed with extreme caution (score 50-69)',
      critical: 'Major scam indicators detected, avoid (score 70-100)'
    },
    
    analysisTypes: {
      imageAnalysis: {
        description: 'Analyzes listing images for authenticity',
        detects: [
          'Stock photos from known image sites',
          'Placeholder/default images',
          'Suspicious filename patterns',
          'Missing or too few images'
        ]
      },
      templateAnalysis: {
        description: 'Detects generic/copy-paste text patterns',
        detects: [
          'Common scam template phrases',
          'Generic listing language',
          'Excessive capitalization',
          'Very short descriptions'
        ]
      }
    },
    
    support: {
      email: 'api@landguardai.co',
      documentation: 'https://landguardai.co/api-docs',
      status: 'https://status.landguardai.co'
    }
  })
}
