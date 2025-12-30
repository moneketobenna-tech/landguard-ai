/**
 * Analytics API - Extension Tracking
 * Tracks extension installs, activations, and usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackExtensionActivation, logApiRequest } from '@/lib/db/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, instanceId, version, licenseKey, scanType } = body

    if (!instanceId) {
      return NextResponse.json({
        success: false,
        error: 'Instance ID required'
      }, { status: 400 })
    }

    // Track different actions
    switch (action) {
      case 'install':
      case 'activate':
        // Track extension installation/activation
        trackExtensionActivation(instanceId, version || '8.0', licenseKey)
        
        // Log the install event
        logApiRequest({
          endpoint: '/analytics/extension/install',
          method: 'POST',
          platform: 'extension',
          userAgent: request.headers.get('user-agent') || undefined,
          success: true
        })
        
        console.log(`[LandGuard Analytics] Extension ${action}: ${instanceId} v${version}`)
        
        return NextResponse.json({
          success: true,
          message: `Extension ${action} tracked`,
          instanceId
        })

      case 'scan':
        // Track scan usage
        trackExtensionActivation(instanceId, version || '8.0', licenseKey)
        
        // Log scan event
        logApiRequest({
          endpoint: `/analytics/extension/scan/${scanType || 'property'}`,
          method: 'POST',
          platform: 'extension',
          userAgent: request.headers.get('user-agent') || undefined,
          success: true
        })
        
        return NextResponse.json({
          success: true,
          message: 'Scan tracked'
        })

      case 'heartbeat':
        // Track extension activity
        trackExtensionActivation(instanceId, version || '8.0', licenseKey)
        
        return NextResponse.json({
          success: true,
          message: 'Heartbeat tracked'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('[LandGuard Analytics] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve extension stats (for admin dashboard)
export async function GET() {
  try {
    const { getExtensionActivations, getActiveExtensions } = await import('@/lib/db/analytics')
    
    const extensions = getExtensionActivations()
    const activeCount = getActiveExtensions()
    
    return NextResponse.json({
      success: true,
      data: {
        total: extensions.length,
        active: activeCount,
        extensions: extensions.slice(0, 100) // Return last 100
      }
    })
  } catch (error) {
    console.error('[LandGuard Analytics] Error fetching extensions:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

