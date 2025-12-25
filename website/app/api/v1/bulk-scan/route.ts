/**
 * LandGuard AI - Bulk Scan API
 * POST /api/v1/bulk-scan
 * 
 * Scan multiple listings in a single request
 * Available: Business, Enterprise tiers only
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, successResponse, errorResponse } from '@/lib/api/middleware'
import { scanListing } from '@/lib/api/riskEngine'
import { BulkScanRequest, ScanResult } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

const MAX_LISTINGS_PER_REQUEST = 100

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request, 'bulk-scan')
  
  if (!auth.authenticated || !auth.apiKey) {
    return auth.response!
  }
  
  try {
    const body: BulkScanRequest = await request.json()
    
    // Validate listings array
    if (!body.listings || !Array.isArray(body.listings)) {
      return errorResponse(
        'MISSING_FIELD',
        'listings array is required',
        400,
        auth.requestId
      )
    }
    
    if (body.listings.length === 0) {
      return errorResponse(
        'EMPTY_ARRAY',
        'listings array cannot be empty',
        400,
        auth.requestId
      )
    }
    
    if (body.listings.length > MAX_LISTINGS_PER_REQUEST) {
      return errorResponse(
        'TOO_MANY_ITEMS',
        `Maximum ${MAX_LISTINGS_PER_REQUEST} listings per request`,
        400,
        auth.requestId
      )
    }
    
    // Validate each listing has a URL
    for (let i = 0; i < body.listings.length; i++) {
      if (!body.listings[i].url) {
        return errorResponse(
          'MISSING_FIELD',
          `listings[${i}].url is required`,
          400,
          auth.requestId
        )
      }
    }
    
    // Process all listings
    const startTime = Date.now()
    const results: ScanResult[] = []
    const errors: { index: number; error: string }[] = []
    
    for (let i = 0; i < body.listings.length; i++) {
      try {
        const result = scanListing(body.listings[i])
        results.push(result)
      } catch (e) {
        errors.push({
          index: i,
          error: e instanceof Error ? e.message : 'Unknown error'
        })
      }
    }
    
    const bulkResult = {
      batchId: `batch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      totalRequested: body.listings.length,
      totalProcessed: results.length,
      totalErrors: errors.length,
      processingTime: Date.now() - startTime,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        safe: results.filter(r => r.riskLevel === 'safe').length,
        low: results.filter(r => r.riskLevel === 'low').length,
        medium: results.filter(r => r.riskLevel === 'medium').length,
        high: results.filter(r => r.riskLevel === 'high').length,
        critical: results.filter(r => r.riskLevel === 'critical').length
      }
    }
    
    // Bulk scans cost 1 credit per listing (no discount)
    return await successResponse(bulkResult, auth.apiKey, auth.requestId, body.listings.length)
    
  } catch (error) {
    console.error('[API] bulk-scan error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to process bulk scan request',
      500,
      auth.requestId
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/bulk-scan',
    method: 'POST',
    description: 'Scan multiple property listings in a single API call',
    authentication: 'Bearer token or X-API-Key header',
    availableTiers: ['business', 'enterprise'],
    note: 'Not available on Starter or Growth tiers',
    creditsPerRequest: '1 credit per listing',
    maxListingsPerRequest: MAX_LISTINGS_PER_REQUEST,
    requestBody: {
      listings: { 
        type: 'array', 
        required: true, 
        description: 'Array of listing objects to scan',
        items: {
          url: { type: 'string', required: true },
          title: { type: 'string', required: false },
          description: { type: 'string', required: false },
          price: { type: 'number', required: false },
          location: { type: 'string', required: false }
        }
      },
      webhookUrl: { 
        type: 'string', 
        required: false, 
        description: 'URL to receive results via POST (for large batches)' 
      }
    },
    exampleRequest: {
      listings: [
        { url: 'https://example.com/listing/1', title: 'Property 1' },
        { url: 'https://example.com/listing/2', title: 'Property 2' }
      ]
    },
    responseFields: {
      batchId: 'Unique batch identifier',
      totalRequested: 'Number of listings submitted',
      totalProcessed: 'Number successfully processed',
      totalErrors: 'Number of processing errors',
      processingTime: 'Total processing time in ms',
      results: 'Array of scan results',
      summary: 'Aggregated risk level counts'
    }
  })
}

