/**
 * LandGuard AI - Scan Document API
 * POST /api/v1/scan-document
 * 
 * Analyzes property documents (deeds, titles, contracts) for issues
 * Available: Growth, Business, Enterprise tiers only
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api/middleware'
import { scanDocument } from '@/lib/api/riskEngine'
import { ScanDocumentRequest } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request, 'scan-document')
  
  if (!auth.authenticated || !auth.apiKey) {
    return auth.response!
  }
  
  try {
    const body: ScanDocumentRequest = await request.json()
    
    // Validate required fields
    if (!body.documentType) {
      return errorResponse(
        'MISSING_FIELD',
        'documentType is required (deed, title, contract, or other)',
        400,
        auth.requestId
      )
    }
    
    // Validate document type
    const validTypes = ['deed', 'title', 'contract', 'other']
    if (!validTypes.includes(body.documentType)) {
      return errorResponse(
        'INVALID_DOCUMENT_TYPE',
        `documentType must be one of: ${validTypes.join(', ')}`,
        400,
        auth.requestId
      )
    }
    
    // Validate at least one content source
    if (!body.documentUrl && !body.documentText) {
      return errorResponse(
        'MISSING_FIELD',
        'Either documentUrl or documentText is required',
        400,
        auth.requestId
      )
    }
    
    // Perform scan
    const result = scanDocument(body)
    
    // Document scans cost 2 credits
    return await successResponse(result, auth.apiKey, auth.requestId, 2)
    
  } catch (error) {
    console.error('[API] scan-document error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to process document scan request',
      500,
      auth.requestId
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/scan-document',
    method: 'POST',
    description: 'Analyze property documents for potential issues and red flags',
    authentication: 'Bearer token or X-API-Key header',
    availableTiers: ['growth', 'business', 'enterprise'],
    note: 'Not available on Starter tier',
    creditsPerRequest: 2,
    requestBody: {
      documentType: { 
        type: 'string', 
        required: true, 
        description: 'Type of document',
        enum: ['deed', 'title', 'contract', 'other']
      },
      documentUrl: { type: 'string', required: false, description: 'URL to the document (PDF, image)' },
      documentText: { type: 'string', required: false, description: 'Extracted text from document' },
      propertyAddress: { type: 'string', required: false, description: 'Expected property address for verification' }
    },
    note2: 'Either documentUrl or documentText is required',
    exampleRequest: {
      documentType: 'deed',
      documentText: 'WARRANTY DEED... This deed made between GRANTOR John Doe...',
      propertyAddress: '123 Main St, Austin, TX 78701'
    },
    responseFields: {
      scanId: 'Unique scan identifier',
      status: 'completed | pending | failed',
      score: 'Risk score 0-100',
      riskLevel: 'safe | low | medium | high | critical',
      flags: 'Array of detected document issues',
      recommendations: 'Array of suggested actions'
    }
  })
}

