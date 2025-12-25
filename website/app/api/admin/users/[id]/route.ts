/**
 * Admin User Management API
 * DELETE /api/admin/users/[id] - Delete a user
 * PUT /api/admin/users/[id] - Ban/update a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteUser, banUser, getUserById, updateUserPlan, unbanUser } from '@/lib/db/users'

export const dynamic = 'force-dynamic'

// Simple admin auth check - in production, use proper auth
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LandGuardAdmin2025!'

function isAdminAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth')
  return authHeader === ADMIN_PASSWORD
}

/**
 * DELETE /api/admin/users/[id]
 * Permanently delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin auth
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    // Get user info before deletion for logging
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const deleted = await deleteUser(id)
    
    if (deleted) {
      console.log(`[Admin] Deleted user: ${user.email} (${id})`)
      return NextResponse.json({
        success: true,
        message: `User ${user.email} has been permanently deleted`,
        deletedUser: {
          id: user.id,
          email: user.email,
          planType: user.planType
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Admin] Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user (ban, change plan, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin auth
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { action, reason } = body

    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let updatedUser = null
    let message = ''

    switch (action) {
      case 'ban':
        updatedUser = await banUser(id, reason)
        message = `User ${user.email} has been banned`
        break
      
      case 'unban':
        updatedUser = await unbanUser(id)
        message = `User ${user.email} has been unbanned (set to free plan)`
        break
      
      case 'downgrade':
        updatedUser = await updateUserPlan(id, 'free')
        message = `User ${user.email} has been downgraded to free`
        break
      
      case 'upgrade':
        updatedUser = await updateUserPlan(id, 'pro')
        message = `User ${user.email} has been upgraded to PRO`
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: ban, unban, downgrade, upgrade' },
          { status: 400 }
        )
    }

    if (updatedUser) {
      console.log(`[Admin] ${action} user: ${user.email} (${id}) - Reason: ${reason || 'N/A'}`)
      return NextResponse.json({
        success: true,
        message,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          planType: updatedUser.planType
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: `Failed to ${action} user` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Admin] Update user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

