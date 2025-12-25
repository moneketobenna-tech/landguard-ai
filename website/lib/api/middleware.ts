/**
 * LandGuard AI - API Middleware
 * Common utilities for API authentication and response handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, recordApiUsage, getApiKeyStats } from './keys'
import { ApiResponse, API_TIERS } from './types'

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  // Try Bearer token first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  
  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }
  
  // Try query parameter (not recommended but supported)
  const apiKeyParam = request.nextUrl.searchParams.get('api_key')
  if (apiKeyParam) {
    return apiKeyParam
  }
  
  return null
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  requestId: string = generateRequestId(),
  details?: string
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      creditsUsed: 0,
      creditsRemaining: -1
    }
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create a success response
 */
export async function successResponse<T>(
  data: T,
  apiKey: string,
  requestId: string = generateRequestId(),
  creditsUsed: number = 1
): Promise<NextResponse> {
  // Record usage
  await recordApiUsage(apiKey, creditsUsed)
  
  // Get remaining credits
  const stats = await getApiKeyStats(apiKey)
  const creditsRemaining = stats?.remainingCredits ?? -1
  
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      creditsUsed,
      creditsRemaining
    }
  }
  
  return NextResponse.json(response)
}

/**
 * Authenticate API request
 */
export async function authenticateRequest(
  request: NextRequest,
  endpoint: string
): Promise<{
  authenticated: boolean
  apiKey?: string
  response?: NextResponse
  requestId: string
}> {
  const requestId = generateRequestId()
  
  // Extract API key
  const apiKey = extractApiKey(request)
  
  if (!apiKey) {
    return {
      authenticated: false,
      requestId,
      response: errorResponse(
        'MISSING_API_KEY',
        'API key is required. Provide via Authorization header (Bearer <key>) or X-API-Key header.',
        401,
        requestId
      )
    }
  }
  
  // Validate API key
  const validation = await validateApiKey(apiKey, endpoint)
  
  if (!validation.valid) {
    const status = validation.errorCode === 'RATE_LIMIT_EXCEEDED' ? 429 
      : validation.errorCode === 'ENDPOINT_NOT_ALLOWED' ? 403
      : 401
    
    return {
      authenticated: false,
      requestId,
      response: errorResponse(
        validation.errorCode || 'INVALID_KEY',
        validation.error || 'Invalid API key',
        status,
        requestId
      )
    }
  }
  
  return {
    authenticated: true,
    apiKey,
    requestId
  }
}

/**
 * Get tier info for documentation
 */
export function getTierInfo() {
  return Object.entries(API_TIERS).map(([key, config]) => ({
    tier: key,
    ...config,
    monthlyCredits: config.monthlyCredits === -1 ? 'Unlimited' : config.monthlyCredits.toLocaleString()
  }))
}

