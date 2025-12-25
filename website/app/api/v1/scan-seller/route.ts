/**
 * LandGuard AI - Scan Seller API
 * POST /api/v1/scan-seller
 * 
 * Analyzes seller profiles for potential scam indicators
 * Available: All tiers (Starter, Growth, Business, Enterprise)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api/middleware'
import { scanSeller } from '@/lib/api/riskEngine'
import { ScanSellerRequest } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request, 'scan-seller')
  
  if (!auth.authenticated || !auth.apiKey) {
    return auth.response!
  }
  
  try {
    const body: ScanSellerRequest = await request.json()
    
    // Validate at least one field is provided
    if (!body.name && !body.email && !body.phone && !body.profileUrl) {
      return errorResponse(
        'MISSING_FIELD',
        'At least one of name, email, phone, or profileUrl is required',
        400,
        auth.requestId
      )
    }
    
    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return errorResponse(
        'INVALID_EMAIL',
        'Invalid email format provided',
        400,
        auth.requestId
      )
    }
    
    // Perform scan
    const result = scanSeller(body)
    
    return await successResponse(result, auth.apiKey, auth.requestId, 1)
    
  } catch (error) {
    console.error('[API] scan-seller error:', error)
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
    endpoint: '/api/v1/scan-seller',
    method: 'POST',
    description: 'Analyze a seller profile for scam risk indicators',
    authentication: 'Bearer token or X-API-Key header',
    availableTiers: ['starter', 'growth', 'business', 'enterprise'],
    creditsPerRequest: 1,
    requestBody: {
      name: { type: 'string', required: false, description: 'Seller name' },
      email: { type: 'string', required: false, description: 'Seller email' },
      phone: { type: 'string', required: false, description: 'Seller phone number' },
      profileUrl: { type: 'string', required: false, description: 'URL to seller profile' },
      listingHistory: { type: 'string[]', required: false, description: 'Array of past listing titles/descriptions' }
    },
    note: 'At least one field must be provided',
    exampleRequest: {
      name: 'John Smith',
      email: 'john.seller@example.com',
      phone: '+1-555-123-4567',
      profileUrl: 'https://marketplace.com/sellers/john123'
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

