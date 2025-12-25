/**
 * LandGuard AI - Scan Listing API
 * POST /api/v1/scan-listing
 * 
 * Analyzes property listings for potential scam indicators
 * 
 * For Web App Users:
 * - Free users: 3 scans per month
 * - Pro users: Unlimited scans
 * 
 * For API Users:
 * - Requires API key
 * - Credits based on tier
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, successResponse, errorResponse, generateRequestId } from '@/lib/api/middleware'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import { getUserById, canUserScan, incrementScanCount, getUserScanUsage, FREE_SCAN_LIMIT } from '@/lib/db/users'
import { scanListing } from '@/lib/api/riskEngine'
import { ScanListingRequest } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  
  // First, check for web app user authentication
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  const userToken = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
  
  // Check if this is a web app user (not an API key user)
  const apiKeyHeader = request.headers.get('x-api-key')
  const isApiUser = apiKeyHeader || (authHeader && authHeader.startsWith('Bearer lgai_'))
  
  if (userToken && !isApiUser) {
    // Web app user authentication
    const payload = await verifyToken(userToken)
    if (payload) {
      const user = await getUserById(payload.userId)
      if (user) {
        const isPro = user.planType === 'pro'
        
        // Check scan limit for free users
        if (!isPro) {
          const canScanResult = await canUserScan(payload.userId)
          if (!canScanResult.allowed) {
            return NextResponse.json({
              success: false,
              error: 'SCAN_LIMIT_REACHED',
              message: `You've used all ${FREE_SCAN_LIMIT} free scans this month. Upgrade to Pro for unlimited scans!`,
              scanUsage: await getUserScanUsage(payload.userId),
              upgradeUrl: '/pricing'
            }, { status: 403 })
          }
        }
        
        // Parse request body
        try {
          const body: ScanListingRequest = await request.json()
          
          if (!body.url) {
            return NextResponse.json({
              success: false,
              error: 'MISSING_FIELD',
              message: 'url is required'
            }, { status: 400 })
          }
          
          // Validate URL format
          try {
            new URL(body.url)
          } catch {
            return NextResponse.json({
              success: false,
              error: 'INVALID_URL',
              message: 'Invalid URL format provided'
            }, { status: 400 })
          }
          
          // Perform scan
          const result = scanListing(body)
          
          // Increment scan count for free users
          if (!isPro) {
            await incrementScanCount(payload.userId)
          }
          
          const scanUsage = await getUserScanUsage(payload.userId)
          
          return NextResponse.json({
            success: true,
            ...result,
            scanUsage,
            meta: {
              requestId,
              timestamp: new Date().toISOString(),
              userType: 'webapp'
            }
          })
          
        } catch (error) {
          console.error('[API] scan-listing error:', error)
          return NextResponse.json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to process scan request'
          }, { status: 500 })
        }
      }
    }
  }
  
  // Fall back to API key authentication
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
    authentication: 'Bearer token (web app) or X-API-Key header (API)',
    limits: {
      webApp: {
        free: `${FREE_SCAN_LIMIT} scans per month`,
        pro: 'Unlimited scans'
      },
      api: 'Based on tier credits'
    },
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
      recommendations: 'Array of suggested actions',
      scanUsage: '(Web app only) Current scan usage'
    }
  })
}
