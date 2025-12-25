/**
 * LandGuard AI - Scan Seller API
 * POST /api/v1/scan-seller
 * 
 * Analyzes seller profiles for potential scam indicators
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
import { scanSeller } from '@/lib/api/riskEngine'
import { ScanSellerRequest } from '@/lib/api/types'

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
          const body: ScanSellerRequest = await request.json()
          
          // Validate at least one field is provided
          if (!body.name && !body.email && !body.phone && !body.profileUrl) {
            return NextResponse.json({
              success: false,
              error: 'MISSING_FIELD',
              message: 'At least one of name, email, phone, or profileUrl is required'
            }, { status: 400 })
          }
          
          // Validate email format if provided
          if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            return NextResponse.json({
              success: false,
              error: 'INVALID_EMAIL',
              message: 'Invalid email format provided'
            }, { status: 400 })
          }
          
          // Perform scan
          const result = scanSeller(body)
          
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
          console.error('[API] scan-seller error:', error)
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
      recommendations: 'Array of suggested actions',
      scanUsage: '(Web app only) Current scan usage'
    }
  })
}
