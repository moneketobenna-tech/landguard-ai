/**
 * Property Check API - LandGuard AI v8
 * POST /api/property/check - Check a property for scams
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import {
  findPropertyByAddress,
  upsertProperty,
  getPropertyListings,
  getPropertyAlerts,
  getPropertyReports,
  incrementAlertScanCount
} from '@/lib/db/property-scams'
import type { CheckPropertyRequest, CheckPropertyResponse, ListingHistorySummary } from '@/types/property-scam'

export const dynamic = 'force-dynamic'

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
    
    const body: CheckPropertyRequest = await request.json()
    const { address, city, state, country, listingUrl } = body
    
    if (!address || !city || !state) {
      return NextResponse.json(
        { success: false, error: 'Address, city, and state are required' },
        { status: 400 }
      )
    }
    
    // Find or create property
    let property = await findPropertyByAddress(address, city, state)
    
    if (!property) {
      // Create new property record
      property = await upsertProperty({
        address,
        city,
        state,
        country: country || 'US',
        zipCode: '',
        status: 'active',
        lastChecked: new Date().toISOString(),
        totalFlags: 0,
        verifiedScam: false
      })
    } else {
      // Update last checked
      property = await upsertProperty({
        ...property,
        lastChecked: new Date().toISOString()
      })
    }
    
    // Get property data
    const listings = await getPropertyListings(property.id)
    const alerts = await getPropertyAlerts(property.id)
    const reports = await getPropertyReports(property.id)
    
    // Increment scan counts for alerts
    for (const alert of alerts) {
      await incrementAlertScanCount(alert.id)
    }
    
    // Calculate listing history summary
    const platformSet = new Set(listings.map(l => l.platform))
    const platforms = Array.from(platformSet)
    const prices = listings.map(l => l.price).filter(p => p > 0)
    const uniqueSellers = new Set(
      listings
        .flatMap(l => [l.sellerPhone, l.sellerEmail, l.sellerName])
        .filter(Boolean)
    ).size
    
    const history: ListingHistorySummary = {
      propertyId: property.id,
      totalListings: listings.length,
      platforms,
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 0 },
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      listingFrequency: 0, // Would need date range calculation
      uniqueSellers,
      suspiciousActivity: []
    }
    
    // Calculate nearby scams (simplified for now)
    const nearbyScams = 0
    
    const response: CheckPropertyResponse = {
      success: true,
      property,
      listings,
      alerts,
      history,
      nearbyScams
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Property Check API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check property' },
      { status: 500 }
    )
  }
}

