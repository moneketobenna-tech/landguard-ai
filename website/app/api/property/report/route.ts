/**
 * Property Report API - LandGuard AI v8
 * POST /api/property/report - Report a property scam
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken, extractCookieToken } from '@/lib/auth/jwt'
import {
  findPropertyByAddress,
  upsertProperty,
  createScamReport,
  createCommunityAlert
} from '@/lib/db/property-scams'
import type { ReportScamRequest, ReportScamResponse } from '@/types/property-scam'

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
    
    const body: ReportScamRequest = await request.json()
    const { propertyId, address, scamType, description, evidence, listingUrl } = body
    
    if (!scamType || !description) {
      return NextResponse.json(
        { success: false, error: 'Scam type and description are required' },
        { status: 400 }
      )
    }
    
    let targetPropertyId = propertyId
    
    // If no propertyId, try to find by address
    if (!targetPropertyId && address) {
      const parts = address.split(',').map(s => s.trim())
      if (parts.length >= 3) {
        const [addr, city, state] = parts
        let property = await findPropertyByAddress(addr, city, state)
        
        if (!property) {
          // Create new property
          property = await upsertProperty({
            address: addr,
            city,
            state,
            country: 'US',
            zipCode: '',
            status: 'flagged',
            lastChecked: new Date().toISOString(),
            totalFlags: 1,
            verifiedScam: false,
            firstFlagged: new Date().toISOString()
          })
        }
        
        targetPropertyId = property.id
      }
    }
    
    if (!targetPropertyId) {
      return NextResponse.json(
        { success: false, error: 'Property ID or valid address required' },
        { status: 400 }
      )
    }
    
    // Determine severity
    const criticalTypes = ['wire_fraud', 'seller_fraud']
    const highTypes = ['fake_listing', 'rental_scam']
    const severity = criticalTypes.includes(scamType) ? 'critical' :
                    highTypes.includes(scamType) ? 'high' : 'medium'
    
    // Create scam report
    const report = await createScamReport({
      propertyId: targetPropertyId,
      reportedBy: payload.userId,
      reporterType: 'user',
      scamType,
      severity,
      description,
      evidence: evidence || [],
      timestamp: new Date().toISOString(),
      verified: false
    })
    
    // Create community alert if critical/high severity
    if (severity === 'critical' || severity === 'high') {
      await createCommunityAlert({
        propertyId: targetPropertyId,
        title: `${scamType.replace('_', ' ').toUpperCase()} Reported`,
        message: description.slice(0, 200),
        alertType: severity === 'critical' ? 'danger' : 'warning',
        severity,
        createdBy: payload.userId,
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        scanCount: 1,
        isActive: true
      })
    }
    
    const response: ReportScamResponse = {
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully. Thank you for helping keep the community safe!'
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Property Report API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

