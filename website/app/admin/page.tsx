'use client'

/**
 * Admin Dashboard - LandGuard AI
 * Clean, well-formatted admin panel with green theme
 */

import { useState } from 'react'

interface User {
  id: string
  email: string
  planType: string
  createdAt: string
  licenseKey?: string
  isBanned?: boolean
}

interface Stats {
  totalUsers: number
  proUsers: number
  freeUsers: number
  totalApiRequests: number
  todayApiRequests: number
  totalExtensions: number
  activeExtensions: number
  totalMobileUsers: number
  activeMobileUsers: number
  iosMobileUsers: number
  androidMobileUsers: number
  scansByPlatform: {
    web: number
    extension: number
    mobile: number
    api: number
  }
}

interface Extension {
  id: string
  licenseKey?: string
  version: string
  activatedAt: string
  lastSeenAt: string
  scansCount: number
}

interface MobileUser {
  id: string
  deviceId: string
  platform: 'ios' | 'android'
  version: string
  registeredAt: string
  lastActiveAt: string
  isPro: boolean
}

type TabType = 'overview' | 'users' | 'extensions' | 'mobile' | 'api'

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'delete' | 'ban' | 'unban'; email: string } | null>(null)

  const ADMIN_PASSWORD = 'LandGuardAdmin2025!'

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      fetchAllData()
    } else {
      setError('Invalid password')
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      if (usersData.success) {
        setUsers(usersData.users || [])
      }

      const statsRes = await fetch('/api/admin/stats')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
        setExtensions(statsData.extensions || [])
        setMobileUsers(statsData.mobileUsers || [])
      }
    } catch {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'delete' | 'ban' | 'unban', reason?: string) => {
    setActionLoading(userId)
    setConfirmAction(null)
    
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-auth': ADMIN_PASSWORD
          }
        })
        const data = await response.json()
        
        if (data.success) {
          setUsers(users.filter(u => u.id !== userId))
          alert(`✅ User deleted successfully`)
        } else {
          alert(`❌ Error: ${data.error}`)
        }
      } else {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-auth': ADMIN_PASSWORD
          },
          body: JSON.stringify({ action, reason })
        })
        const data = await response.json()
        
        if (data.success) {
          // Update local state
          setUsers(users.map(u => 
            u.id === userId 
              ? { ...u, planType: action === 'ban' ? 'banned' : 'free' }
              : u
          ))
          alert(`✅ ${data.message}`)
        } else {
          alert(`❌ Error: ${data.error}`)
        }
      }
    } catch (err) {
      alert('❌ Network error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Login Screen
  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'rgba(20, 83, 45, 0.9)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '12px', 
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              🏠
            </div>
            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              LandGuard Admin
            </h1>
            <p style={{ color: '#86EFAC', fontSize: '14px', margin: 0 }}>
              Enter password to access dashboard
            </p>
          </div>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '16px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Access Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #14532D 0%, #166534 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(20, 83, 45, 0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🏠
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                LandGuard Admin
              </h1>
              <p style={{ color: '#86EFAC', fontSize: '12px', margin: 0 }}>
                Multi-Platform Dashboard
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchAllData}
              style={{
                padding: '10px 16px',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔄 Refresh
            </button>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              💳 Stripe
            </a>
            <button
              onClick={() => setAuthenticated(false)}
              style={{
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Web Users', icon: '👥' },
            { id: 'extensions', label: 'Extension', icon: '🧩' },
            { id: 'mobile', label: 'Mobile', icon: '📱' },
            { id: 'api', label: 'API', icon: '🔌' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' 
                  : 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#86EFAC' }}>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <StatCard icon="👥" label="Total Users" value={stats?.totalUsers || users.length} color="#22C55E" />
                  <StatCard icon="⭐" label="PRO Users" value={stats?.proUsers || 0} color="#4ADE80" />
                  <StatCard icon="🧩" label="Extensions" value={stats?.totalExtensions || 0} color="#86EFAC" />
                  <StatCard icon="📱" label="Mobile Users" value={stats?.totalMobileUsers || 0} color="#BBF7D0" />
                </div>

                {/* Platform Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  <PlatformCard
                    icon="🏠"
                    title="Website"
                    subtitle="landguardai.co"
                    stats={[
                      { label: 'Registered Users', value: users.length },
                      { label: 'PRO Subscribers', value: stats?.proUsers || 0, color: '#4ADE80' },
                      { label: 'Web Scans', value: stats?.scansByPlatform?.web || 0, color: '#22C55E' }
                    ]}
                  />
                  <PlatformCard
                    icon="🧩"
                    title="Chrome Extension"
                    subtitle="v1.0"
                    stats={[
                      { label: 'Total Installs', value: stats?.totalExtensions || 0 },
                      { label: 'Active (24h)', value: stats?.activeExtensions || 0, color: '#4ADE80' },
                      { label: 'Extension Scans', value: stats?.scansByPlatform?.extension || 0, color: '#86EFAC' }
                    ]}
                  />
                  <PlatformCard
                    icon="📱"
                    title="Mobile App"
                    subtitle="iOS & Android"
                    stats={[
                      { label: 'Total Users', value: stats?.totalMobileUsers || 0 },
                      { label: 'iOS Users', value: stats?.iosMobileUsers || 0 },
                      { label: 'Android Users', value: stats?.androidMobileUsers || 0, color: '#4ADE80' }
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div style={{
                background: 'rgba(20, 83, 45, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    👥 Website Users
                  </h2>
                  <span style={{ color: '#86EFAC', fontSize: '14px' }}>{users.length} users</span>
                </div>
                
                {users.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#86EFAC' }}>
                    No users registered yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Plan</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>License Key</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Registered</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', color: '#86EFAC', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.1)' }}>
                            <td style={{ padding: '14px 16px', color: '#fff', fontSize: '14px' }}>{user.email}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: user.planType === 'pro' 
                                  ? 'rgba(34, 197, 94, 0.3)' 
                                  : user.planType === 'banned' 
                                    ? 'rgba(239, 68, 68, 0.2)' 
                                    : 'rgba(100, 116, 139, 0.2)',
                                color: user.planType === 'pro' 
                                  ? '#4ade80' 
                                  : user.planType === 'banned' 
                                    ? '#f87171' 
                                    : '#94a3b8'
                              }}>
                                {user.planType?.toUpperCase() || 'FREE'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '13px', fontFamily: 'monospace' }}>
                              {user.licenseKey || 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '14px' }}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {user.planType === 'banned' ? (
                                  <button
                                    onClick={() => setConfirmAction({ userId: user.id, action: 'unban', email: user.email })}
                                    disabled={actionLoading === user.id}
                                    style={{
                                      padding: '6px 12px',
                                      background: 'rgba(34, 197, 94, 0.2)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
                                      borderRadius: '6px',
                                      color: '#4ade80',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      opacity: actionLoading === user.id ? 0.5 : 1
                                    }}
                                  >
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmAction({ userId: user.id, action: 'ban', email: user.email })}
                                    disabled={actionLoading === user.id}
                                    style={{
                                      padding: '6px 12px',
                                      background: 'rgba(251, 191, 36, 0.2)',
                                      border: '1px solid rgba(251, 191, 36, 0.3)',
                                      borderRadius: '6px',
                                      color: '#fbbf24',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      opacity: actionLoading === user.id ? 0.5 : 1
                                    }}
                                  >
                                    Ban
                                  </button>
                                )}
                                <button
                                  onClick={() => setConfirmAction({ userId: user.id, action: 'delete', email: user.email })}
                                  disabled={actionLoading === user.id}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    color: '#f87171',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    opacity: actionLoading === user.id ? 0.5 : 1
                                  }}
                                >
                                  {actionLoading === user.id ? '...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Extensions Tab */}
            {activeTab === 'extensions' && (
              <div style={{
                background: 'rgba(20, 83, 45, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    🧩 Chrome Extension Users
                  </h2>
                  <span style={{ color: '#86EFAC', fontSize: '14px' }}>{extensions.length} installs</span>
                </div>
                
                {extensions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#86EFAC' }}>
                    No extension users tracked yet. Users appear when they perform scans.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>ID</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Version</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>License</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Scans</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extensions.map((ext) => (
                          <tr key={ext.id} style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.1)' }}>
                            <td style={{ padding: '14px 16px', color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{ext.id.substring(0, 12)}...</td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '14px' }}>v{ext.version}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: ext.licenseKey ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)',
                                color: ext.licenseKey ? '#4ade80' : '#94a3b8'
                              }}>
                                {ext.licenseKey ? 'PRO' : 'FREE'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#22C55E', fontSize: '14px', fontWeight: '600' }}>{ext.scansCount}</td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '14px' }}>
                              {new Date(ext.lastSeenAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Tab */}
            {activeTab === 'mobile' && (
              <div style={{
                background: 'rgba(20, 83, 45, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    📱 Mobile App Users
                  </h2>
                  <span style={{ color: '#86EFAC', fontSize: '14px' }}>{mobileUsers.length} users</span>
                </div>
                
                {mobileUsers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#86EFAC' }}>
                    No mobile app users yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Device</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Platform</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Version</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Plan</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#86EFAC', fontSize: '12px', fontWeight: '600' }}>Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mobileUsers.map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.1)' }}>
                            <td style={{ padding: '14px 16px', color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{user.deviceId.substring(0, 12)}...</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: user.platform === 'ios' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(34, 197, 94, 0.3)',
                                color: user.platform === 'ios' ? '#94a3b8' : '#4ade80'
                              }}>
                                {user.platform.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '14px' }}>v{user.version}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: user.isPro ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)',
                                color: user.isPro ? '#4ade80' : '#94a3b8'
                              }}>
                                {user.isPro ? 'PRO' : 'FREE'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#86EFAC', fontSize: '14px' }}>
                              {new Date(user.lastActiveAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <StatCard icon="📊" label="Total Requests" value={stats?.totalApiRequests || 0} color="#22C55E" />
                  <StatCard icon="📅" label="Today" value={stats?.todayApiRequests || 0} color="#4ADE80" />
                  <StatCard icon="🔍" label="Total Scans" value={
                    (stats?.scansByPlatform?.web || 0) + 
                    (stats?.scansByPlatform?.extension || 0) + 
                    (stats?.scansByPlatform?.mobile || 0) + 
                    (stats?.scansByPlatform?.api || 0)
                  } color="#86EFAC" />
                  <StatCard icon="⚡" label="API Scans" value={stats?.scansByPlatform?.api || 0} color="#BBF7D0" />
                </div>

                <div style={{
                  background: 'rgba(20, 83, 45, 0.5)',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  padding: '20px'
                }}>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                    📡 API Endpoints
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <EndpointRow method="POST" endpoint="/api/v1/scan" description="Scan property listing" />
                    <EndpointRow method="POST" endpoint="/api/auth/register" description="Register user" />
                    <EndpointRow method="POST" endpoint="/api/auth/login" description="User login" />
                    <EndpointRow method="POST" endpoint="/api/create-checkout-session" description="Stripe checkout" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#4ADE80', fontSize: '14px', margin: 0 }}>
            💡 <strong>Tip:</strong> For payment data and revenue, check{' '}
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: '#86EFAC', textDecoration: 'underline' }}>
              Stripe Dashboard
            </a>
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 83, 45, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '450px',
            width: '100%',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ 
              fontSize: '48px', 
              textAlign: 'center', 
              marginBottom: '16px' 
            }}>
              {confirmAction.action === 'delete' ? '🗑️' : confirmAction.action === 'ban' ? '🚫' : '✅'}
            </div>
            
            <h3 style={{ 
              color: '#fff', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              margin: '0 0 12px 0'
            }}>
              {confirmAction.action === 'delete' 
                ? 'Delete User?' 
                : confirmAction.action === 'ban' 
                  ? 'Ban User?' 
                  : 'Unban User?'}
            </h3>
            
            <p style={{ 
              color: '#86EFAC', 
              textAlign: 'center', 
              margin: '0 0 8px 0',
              fontSize: '15px'
            }}>
              {confirmAction.action === 'delete' 
                ? 'This action cannot be undone. The user and all their data will be permanently removed.'
                : confirmAction.action === 'ban'
                  ? 'This will suspend the user\'s account and prevent them from accessing services.'
                  : 'This will restore the user\'s account access.'}
            </p>
            
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ 
                color: '#fff', 
                fontSize: '14px', 
                margin: 0,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {confirmAction.email}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(confirmAction.userId, confirmAction.action)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: confirmAction.action === 'delete' 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : confirmAction.action === 'ban'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {confirmAction.action === 'delete' 
                  ? '🗑️ Delete Permanently' 
                  : confirmAction.action === 'ban'
                    ? '🚫 Ban User'
                    : '✅ Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(20, 83, 45, 0.5)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ color: '#86EFAC', fontSize: '14px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}

// Platform Card Component
function PlatformCard({ icon, title, subtitle, stats }: { 
  icon: string; 
  title: string; 
  subtitle: string; 
  stats: { label: string; value: number; color?: string }[] 
}) {
  return (
    <div style={{
      background: 'rgba(20, 83, 45, 0.5)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px'
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>{title}</h3>
          <p style={{ color: '#86EFAC', fontSize: '12px', margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#86EFAC', fontSize: '14px' }}>{stat.label}</span>
            <span style={{ color: stat.color || '#fff', fontSize: '14px', fontWeight: '600' }}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Endpoint Row Component
function EndpointRow({ method, endpoint, description }: { method: string; endpoint: string; description: string }) {
  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
    POST: { bg: 'rgba(34, 197, 94, 0.3)', text: '#22C55E' },
  }
  const colors = methodColors[method] || methodColors.POST
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      background: 'rgba(34, 197, 94, 0.1)',
      borderRadius: '8px'
    }}>
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: 'monospace',
        background: colors.bg,
        color: colors.text
      }}>
        {method}
      </span>
      <code style={{ color: '#DCFCE7', fontSize: '13px', flex: 1 }}>{endpoint}</code>
      <span style={{ color: '#86EFAC', fontSize: '13px' }}>{description}</span>
    </div>
  )
}

