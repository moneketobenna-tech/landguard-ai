/**
 * LandGuard AI - API Documentation Root
 * GET /api/v1
 * 
 * Returns API documentation and available endpoints
 */

import { NextResponse } from 'next/server'
import { API_TIERS } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    name: 'LandGuard AI Property Scam Detection API',
    version: '1.0.0',
    baseUrl: 'https://landguardai.co/api/v1',
    documentation: 'https://landguardai.co/api-docs',
    
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
        description: 'Scan a property listing for scam indicators',
        authentication: true,
        tiers: 'Starter, Growth, Business, Enterprise',
        creditsPerRequest: 1
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
    
    responseFormat: {
      success: {
        success: true,
        data: '{ ... response data ... }',
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
      INTERNAL_ERROR: 'Server error - contact support'
    },
    
    riskLevels: {
      safe: 'No significant risk indicators (score 0-9)',
      low: 'Minor concerns, proceed with normal caution (score 10-29)',
      medium: 'Notable concerns, verify details carefully (score 30-49)',
      high: 'Significant red flags, proceed with extreme caution (score 50-69)',
      critical: 'Major scam indicators detected, avoid (score 70-100)'
    },
    
    support: {
      email: 'api@landguardai.co',
      documentation: 'https://landguardai.co/api-docs',
      status: 'https://status.landguardai.co'
    }
  })
}

