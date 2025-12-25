/**
 * LandGuard AI - API Usage Stats
 * GET /api/v1/usage
 * 
 * Returns current usage statistics for:
 * - Authenticated users (web app) - scan usage
 * - API keys (developers) - API credits
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import { getUserById, getUserScanUsage, FREE_SCAN_LIMIT } from '@/lib/db/users'
import { extractApiKey, errorResponse, generateRequestId } from '@/lib/api/middleware'
import { getApiKey, getApiKeyStats } from '@/lib/api/keys'
import { API_TIERS } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  // First, try to authenticate as a web app user
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  const userToken = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
  
  if (userToken) {
    const payload = await verifyToken(userToken)
    if (payload) {
      const user = await getUserById(payload.userId)
      if (user) {
        const scanUsage = await getUserScanUsage(payload.userId)
        
        return NextResponse.json({
          success: true,
          scanUsage,
          user: {
            email: user.email,
            planType: user.planType,
            isPro: user.planType === 'pro'
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  }
  
  // Fall back to API key authentication
  const apiKeyStr = extractApiKey(request)
  
  if (!apiKeyStr) {
    return NextResponse.json({
      success: false,
      error: 'NOT_AUTHENTICATED',
      message: 'Please log in or provide an API key',
      scanUsage: {
        used: 0,
        remaining: FREE_SCAN_LIMIT,
        limit: FREE_SCAN_LIMIT,
        isPro: false
      }
    }, { status: 401 })
  }
  
  // Get API key details
  const apiKey = await getApiKey(apiKeyStr)
  
  if (!apiKey) {
    return errorResponse(
      'INVALID_KEY',
      'Invalid API key',
      401,
      requestId
    )
  }
  
  const stats = await getApiKeyStats(apiKeyStr)
  const tierConfig = API_TIERS[apiKey.tier]
  
  // Calculate days until reset
  const now = new Date()
  const resetDate = new Date(apiKey.monthlyReset)
  const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return NextResponse.json({
    success: true,
    data: {
      keyId: apiKey.id,
      keyName: apiKey.name,
      tier: {
        name: tierConfig.name,
        monthlyCredits: tierConfig.monthlyCredits === -1 ? 'Unlimited' : tierConfig.monthlyCredits,
        availableEndpoints: tierConfig.endpoints,
        features: tierConfig.features
      },
      usage: {
        totalAllTime: stats?.totalUsage || 0,
        currentMonth: stats?.monthlyUsage || 0,
        monthlyLimit: stats?.monthlyLimit === -1 ? 'Unlimited' : stats?.monthlyLimit,
        remaining: stats?.remainingCredits === -1 ? 'Unlimited' : stats?.remainingCredits,
        percentUsed: stats?.monthlyLimit === -1 
          ? 0 
          : Math.round(((stats?.monthlyUsage || 0) / (stats?.monthlyLimit || 1)) * 100)
      },
      billing: {
        periodStart: new Date(new Date(apiKey.monthlyReset).setMonth(new Date(apiKey.monthlyReset).getMonth() - 1)).toISOString().split('T')[0],
        periodEnd: apiKey.monthlyReset.split('T')[0],
        daysUntilReset,
        nextResetDate: apiKey.monthlyReset
      },
      keyInfo: {
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt || 'Never',
        isActive: apiKey.isActive
      }
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    }
  })
}
