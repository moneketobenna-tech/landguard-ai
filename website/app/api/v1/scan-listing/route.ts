/**
 * LandGuard AI - Scan Listing API
 * POST /api/v1/scan-listing
 * 
 * Analyzes property listings for potential scam indicators
 * Available: All tiers (Starter, Growth, Business, Enterprise)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, successResponse, errorResponse, generateRequestId } from '@/lib/api/middleware'
import { scanListing } from '@/lib/api/riskEngine'
import { ScanListingRequest } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request, 'scan-listing')
  
  if (!auth.authenticated || !auth.apiKey) {
    return auth.response!
  }
  
  try {
    const body: ScanListingRequest = await request.json()
    
    // Validate required fields
    if (!body.url) {
      return errorResponse(
        'MISSING_FIELD',
        'url is required',
        400,
        auth.requestId
      )
    }
    
    // Validate URL format
    try {
      new URL(body.url)
    } catch {
      return errorResponse(
        'INVALID_URL',
        'Invalid URL format provided',
        400,
        auth.requestId
      )
    }
    
    // Perform scan
    const result = scanListing(body)
    
    return await successResponse(result, auth.apiKey, auth.requestId, 1)
    
  } catch (error) {
    console.error('[API] scan-listing error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to process scan request',
      500,
      auth.requestId
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/scan-listing',
    method: 'POST',
    description: 'Scan a property listing URL for scam indicators',
    authentication: 'Bearer token or X-API-Key header',
    availableTiers: ['starter', 'growth', 'business', 'enterprise'],
    creditsPerRequest: 1,
    requestBody: {
      url: { type: 'string', required: true, description: 'The listing URL to scan' },
      title: { type: 'string', required: false, description: 'Listing title' },
      description: { type: 'string', required: false, description: 'Listing description text' },
      price: { type: 'number', required: false, description: 'Listed price' },
      location: { type: 'string', required: false, description: 'Property location' },
      sellerName: { type: 'string', required: false, description: 'Seller name' },
      sellerContact: { type: 'string', required: false, description: 'Seller contact info' }
    },
    exampleRequest: {
      url: 'https://example.com/listing/123',
      title: 'Beautiful 5 Acre Property - MUST SELL TODAY',
      description: 'Motivated seller, wire transfer only...',
      price: 5000,
      location: 'Texas'
    },
    responseFields: {
      scanId: 'Unique scan identifier',
      status: 'completed | pending | failed',
      score: 'Risk score 0-100',
      riskLevel: 'safe | low | medium | high | critical',
      flags: 'Array of detected risk indicators',
      recommendations: 'Array of suggested actions'
    }
  })
}

