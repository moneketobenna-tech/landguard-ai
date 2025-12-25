/**
 * Admin API - Get All Users
 * Returns list of registered users for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, getDbDebugInfo } from '@/lib/db/users'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const debug = request.nextUrl.searchParams.get('debug') === 'true'
    
    console.log('[Admin] Fetching all users...')
    const users = await getAllUsers()
    console.log(`[Admin] Got ${users.length} users`)
    
    // Map users to safe format (exclude passwords)
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      planType: user.planType,
      createdAt: user.createdAt,
      licenseKey: user.licenseKey,
      isBanned: user.isBanned
    }))

    const response: Record<string, any> = {
      success: true,
      users: safeUsers,
      total: safeUsers.length
    }
    
    // Include debug info if requested
    if (debug) {
      response.debug = await getDbDebugInfo()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Admin users error:', error)
    const debugInfo = await getDbDebugInfo()
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      errorMessage: error instanceof Error ? error.message : String(error),
      debug: debugInfo
    }, { status: 500 })
  }
}

