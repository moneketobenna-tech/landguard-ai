/**
 * Property Watch API - LandGuard AI v8
 * POST /api/property/watch - Watch/unwatch a property
 * GET /api/property/watch - Get user's watchlist
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import { addPropertyWatch, getUserWatchedProperties, getProperty } from '@/lib/db/property-scams'
import type { WatchPropertyRequest, WatchPropertyResponse } from '@/types/property-scam'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const token = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const watches = await getUserWatchedProperties(payload.userId)
    
    // Get full property details
    const propertiesPromises = watches.map(w => getProperty(w.propertyId))
    const properties = await Promise.all(propertiesPromises)
    
    return NextResponse.json({
      success: true,
      watches,
      properties: properties.filter(Boolean)
    })
    
  } catch (error) {
    console.error('[Property Watch API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const token = extractBearerToken(authHeader) || extractCookieToken(cookieHeader)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const body: WatchPropertyRequest = await request.json()
    const { propertyId, notificationsEnabled } = body
    
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'Property ID required' },
        { status: 400 }
      )
    }
    
    // Add to watchlist
    await addPropertyWatch(payload.userId, {
      userId: payload.userId,
      propertyId,
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      notificationsEnabled: notificationsEnabled !== false,
      alertTypes: ['price_change', 'new_listing', 'scam_report', 'community_alert']
    })
    
    const response: WatchPropertyResponse = {
      success: true,
      message: 'Property added to watchlist'
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Property Watch API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update watchlist' },
      { status: 500 }
    )
  }
}

