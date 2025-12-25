/**
 * Admin API - Get Platform Statistics
 * Returns analytics across all platforms
 */

import { NextResponse } from 'next/server'
import { 
  getAnalytics, 
  getRecentRequests, 
  getExtensionActivations,
  getMobileUsers,
  getActiveExtensions,
  getActiveMobileUsers
} from '@/lib/db/analytics'
import { getAllUsers } from '@/lib/db/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const analytics = getAnalytics()
    const recentRequests = getRecentRequests(50)
    const extensions = getExtensionActivations()
    const mobileUsers = getMobileUsers()
    const users = await getAllUsers()
    
    return NextResponse.json({
      success: true,
      stats: {
        // User stats
        totalUsers: users.length,
        proUsers: users.filter(u => u.planType === 'pro').length,
        freeUsers: users.filter(u => u.planType === 'free').length,
        
        // API stats
        totalApiRequests: analytics.totalApiRequests,
        todayApiRequests: analytics.todayApiRequests,
        
        // Extension stats
        totalExtensions: analytics.extensionActivations,
        activeExtensions: getActiveExtensions(),
        
        // Mobile stats
        totalMobileUsers: analytics.mobileUsers,
        activeMobileUsers: getActiveMobileUsers(),
        iosMobileUsers: mobileUsers.filter(u => u.platform === 'ios').length,
        androidMobileUsers: mobileUsers.filter(u => u.platform === 'android').length,
        
        // Scans by platform
        scansByPlatform: analytics.scansByPlatform
      },
      recentRequests,
      extensions,
      mobileUsers
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 })
  }
}

