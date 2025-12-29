/**
 * Auto-Scan Saved Listings API - LandGuard AI
 * GET/POST/DELETE /api/autoscan/saved
 * Pro users only
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getKVClient } from '@/lib/kv/client'
import { 
  getSavedListings, 
  addSavedListing, 
  removeSavedListing 
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

// GET - Get saved listings
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
    const saved = await getSavedListings(userId)

    return NextResponse.json({
      success: true,
      listings: saved,
      count: saved.length,
      limit: 50,
    })
  } catch (error) {
    console.error('[Saved Listings API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get saved listings' },
      { status: 500 }
    )
  }
}

// POST - Add listing to saved
export async function POST(request: Request) {
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
    
    const { url, title, platform, price, location } = body
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 }
      )
    }

    const listing = await addSavedListing(userId, {
      url,
      title,
      platform,
      price,
      location,
    })

    return NextResponse.json({
      success: true,
      listing,
      message: 'Listing saved for monitoring',
    })
  } catch (error: any) {
    console.error('[Saved Listings API] POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save listing' },
      { status: 500 }
    )
  }
}

// DELETE - Remove listing from saved
export async function DELETE(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('id')
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    const removed = await removeSavedListing(userId, listingId)

    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Listing removed from monitoring',
    })
  } catch (error) {
    console.error('[Saved Listings API] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove listing' },
      { status: 500 }
    )
  }
}

