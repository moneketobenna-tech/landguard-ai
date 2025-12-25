/**
 * LandGuard AI - API Usage Stats
 * GET /api/v1/usage
 * 
 * Returns current API usage statistics for the authenticated key
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, errorResponse, generateRequestId } from '@/lib/api/middleware'
import { getApiKey, getApiKeyStats } from '@/lib/api/keys'
import { API_TIERS } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  
  // Extract API key
  const apiKeyStr = extractApiKey(request)
  
  if (!apiKeyStr) {
    return errorResponse(
      'MISSING_API_KEY',
      'API key is required',
      401,
      requestId
    )
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

