/**
 * Property Demo Data API - LandGuard AI v8
 * POST /api/property/demo - Initialize demo property scam data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import {
  upsertProperty,
  addPropertyListing,
  createScamReport,
  createCommunityAlert
} from '@/lib/db/property-scams'

export const dynamic = 'force-dynamic'

// Demo properties with scam history
const DEMO_PROPERTIES = [
  {
    address: '123 Scam Street',
    city: 'Miami',
    state: 'FL',
    country: 'US',
    zipCode: '33101',
    status: 'verified_scam' as const,
    totalFlags: 15,
    verifiedScam: true,
    platforms: ['craigslist', 'facebook', 'zillow'],
    priceRange: [250000, 150000, 180000]
  },
  {
    address: '456 Fake Ave',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    zipCode: '90001',
    status: 'flagged' as const,
    totalFlags: 8,
    verifiedScam: false,
    platforms: ['facebook', 'rightmove'],
    priceRange: [450000, 320000]
  },
  {
    address: '789 Fraud Lane',
    city: 'New York',
    state: 'NY',
    country: 'US',
    zipCode: '10001',
    status: 'flagged' as const,
    totalFlags: 12,
    verifiedScam: false,
    platforms: ['craigslist', 'zillow', 'realtor'],
    priceRange: [650000, 400000, 500000]
  },
  {
    address: '321 Rental Scam Rd',
    city: 'Chicago',
    state: 'IL',
    country: 'US',
    zipCode: '60601',
    status: 'verified_scam' as const,
    totalFlags: 20,
    verifiedScam: true,
    platforms: ['craigslist', 'facebook'],
    priceRange: [1800, 1200]
  },
  {
    address: '555 Legit Street',
    city: 'Austin',
    state: 'TX',
    country: 'US',
    zipCode: '73301',
    status: 'active' as const,
    totalFlags: 0,
    verifiedScam: false,
    platforms: ['zillow'],
    priceRange: [380000]
  }
]

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
    
    console.log('[Property Demo] Initializing demo property scam data...')
    
    for (const demoProperty of DEMO_PROPERTIES) {
      // Create property
      const property = await upsertProperty({
        address: demoProperty.address,
        city: demoProperty.city,
        state: demoProperty.state,
        country: demoProperty.country,
        zipCode: demoProperty.zipCode,
        status: demoProperty.status,
        lastChecked: new Date().toISOString(),
        totalFlags: demoProperty.totalFlags,
        verifiedScam: demoProperty.verifiedScam,
        firstFlagged: demoProperty.totalFlags > 0 ? new Date(Date.now() - 30 * 24 * 3600000).toISOString() : undefined
      })
      
      // Create listings
      for (let i = 0; i < demoProperty.platforms.length; i++) {
        const platform = demoProperty.platforms[i]
        const price = demoProperty.priceRange[i] || demoProperty.priceRange[0]
        
        await addPropertyListing({
          propertyId: property.id,
          platform: platform as any,
          listingUrl: `https://${platform}.com/listing/${property.id}`,
          sellerName: `Seller ${i + 1}`,
          sellerPhone: `555-0${i}0${i}-${Math.floor(Math.random() * 10000)}`,
          sellerEmail: `seller${i}@${platform}.com`,
          price,
          currency: 'USD',
          description: `Amazing property! Don't miss this opportunity!`,
          photoUrls: [],
          listedDate: new Date(Date.now() - (i + 1) * 7 * 24 * 3600000).toISOString(),
          isActive: true,
          isFlagged: demoProperty.totalFlags > 0,
          scamTypes: demoProperty.verifiedScam ? ['fake_listing'] : [],
          flagCount: demoProperty.totalFlags > 0 ? Math.floor(demoProperty.totalFlags / demoProperty.platforms.length) : 0
        })
      }
      
      // Create scam reports for flagged properties
      if (demoProperty.totalFlags > 0) {
        await createScamReport({
          propertyId: property.id,
          reportedBy: payload.userId,
          reporterType: 'user',
          scamType: demoProperty.verifiedScam ? 'fake_listing' : 'price_manipulation',
          severity: demoProperty.verifiedScam ? 'critical' : 'high',
          description: demoProperty.verifiedScam 
            ? 'This property does not exist. Photos were stolen from another listing.'
            : 'Price keeps changing dramatically across platforms. Suspicious seller behavior.',
          evidence: [],
          timestamp: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
          verified: demoProperty.verifiedScam
        })
        
        // Create community alert
        if (demoProperty.verifiedScam) {
          await createCommunityAlert({
            propertyId: property.id,
            title: '🚨 VERIFIED SCAM - Do Not Contact',
            message: `This property has been verified as a scam. Multiple users reported sending deposits and never hearing back from the "seller".`,
            alertType: 'danger',
            severity: 'critical',
            createdBy: payload.userId,
            createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
            upvotes: Math.floor(Math.random() * 50) + 10,
            downvotes: 0,
            scanCount: Math.floor(Math.random() * 200) + 50,
            isActive: true
          })
        }
      }
    }
    
    console.log('[Property Demo] Demo data initialized successfully!')
    
    return NextResponse.json({
      success: true,
      message: `Initialized ${DEMO_PROPERTIES.length} demo properties with scam history`
    })
    
  } catch (error) {
    console.error('[Property Demo API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize demo data' },
      { status: 500 }
    )
  }
}

