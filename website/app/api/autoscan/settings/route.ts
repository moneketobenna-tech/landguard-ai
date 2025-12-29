/**
 * Auto-Scan Settings API - LandGuard AI
 * GET/PUT /api/autoscan/settings
 * Pro users only
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getKVClient } from '@/lib/kv/client'
import { 
  getAutoScanSettings, 
  updateAutoScanSettings 
} from '@/lib/autoscan'

// Verify user and check Pro status
async function verifyProUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  const kvClient = getKVClient()
  if (!kvClient) {
    return { error: 'Service unavailable', status: 503 }
  }

  const session = await kvClient.get(`session:${token}`)
  if (!session || typeof session !== 'object') {
    return { error: 'Invalid session', status: 401 }
  }

  const userId = (session as any).userId
  const user = await kvClient.get(`user:${userId}`)
  
  if (!user || typeof user !== 'object') {
    return { error: 'User not found', status: 404 }
  }

  const plan = (user as any).plan || 'free'
  
  if (plan !== 'pro') {
    return { error: 'Pro subscription required', status: 403 }
  }

  return { userId, user }
}

export async function GET() {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    const verification = await verifyProUser(authHeader)
    if ('error' in verification) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: verification.status }
      )
    }

    const { userId } = verification
    const settings = await getAutoScanSettings(userId)

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('[AutoScan Settings API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    const verification = await verifyProUser(authHeader)
    if ('error' in verification) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: verification.status }
      )
    }

    const { userId } = verification
    const body = await request.json()
    
    const allowedFields = ['enabled', 'interval', 'notifyOnRiskChange', 'notifyOnHighRisk', 'scanOnLogin']
    const updates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (updates.interval) {
      const validIntervals = ['30m', '1h', '6h', '12h', '24h']
      if (!validIntervals.includes(updates.interval)) {
        return NextResponse.json(
          { success: false, error: 'Invalid interval' },
          { status: 400 }
        )
      }
    }

    const settings = await updateAutoScanSettings(userId, updates)

    return NextResponse.json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('[AutoScan Settings API] PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

