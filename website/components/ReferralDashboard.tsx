'use client'

/**
 * Referral Dashboard Component - LandGuard AI
 * Displays referral progress, link sharing, and rewards
 */

import { useState, useEffect } from 'react'
import { ReferralStatus, REFERRAL_CONFIG } from '@/lib/referral/types'

interface Props {
  token?: string
  compact?: boolean
}

export default function ReferralDashboard({ token, compact = false }: Props) {
  const [stats, setStats] = useState<ReferralStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [token])

  const fetchStats = async () => {
    try {
      const authToken = token || localStorage.getItem('lg_token')
      if (!authToken) {
        setError('Please log in to view referrals')
        setLoading(false)
        return
      }

      const res = await fetch('/api/referrals/status', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await res.json()

      if (data.success) {
        setStats(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (stats?.referralLink) {
      await navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOnPlatform = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    if (!stats?.referralLink) return

    const message = encodeURIComponent(
      `🏠 I use LandGuard AI to scan property listings for scams. Get 7 days Pro FREE with my link: ${stats.referralLink}`
    )

    const urls = {
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${message}`,
      twitter: `https://twitter.com/intent/tweet?text=${message}`
    }

    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-2xl p-6 ${compact ? '' : 'max-w-2xl mx-auto'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-slate-700 rounded w-full" />
          <div className="h-12 bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-slate-800/50 rounded-2xl p-6 text-center ${compact ? '' : 'max-w-2xl mx-auto'}`}>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  const progress = Math.min((stats.completed % REFERRAL_CONFIG.REFERRALS_FOR_REWARD) / REFERRAL_CONFIG.REFERRALS_FOR_REWARD * 100, 100)
  const atMaxRewards = stats.totalDaysEarned >= REFERRAL_CONFIG.MAX_FREE_DAYS

  // Compact version for dashboard
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎁</span>
              Invite Friends, Earn Pro
            </h3>
            <p className="text-slate-300 text-sm mt-1">
              {atMaxRewards 
                ? 'You\'ve earned the maximum free Pro!' 
                : `Invite ${stats.nextRewardAt} more friends to unlock 30 days Pro FREE`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{stats.completed}/{REFERRAL_CONFIG.REFERRALS_FOR_REWARD}</div>
            <div className="text-xs text-slate-400">for next reward</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Share buttons row */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            onClick={() => shareOnPlatform('whatsapp')}
            className="w-10 h-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            title="Share on WhatsApp"
          >
            <span className="text-lg">📱</span>
          </button>
          <button
            onClick={() => shareOnPlatform('telegram')}
            className="w-10 h-10 flex items-center justify-center bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
            title="Share on Telegram"
          >
            <span className="text-lg">✈️</span>
          </button>
          <button
            onClick={() => shareOnPlatform('twitter')}
            className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Share on X"
          >
            <span className="text-lg">𝕏</span>
          </button>
        </div>

        {stats.freeMonthsEarned > 0 && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              <span>🎉</span>
              <span>You&apos;ve earned {stats.freeMonthsEarned} month{stats.freeMonthsEarned > 1 ? 's' : ''} Pro FREE!</span>
            </span>
          </div>
        )}
      </div>
    )
  }

  // Full page version
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-3xl font-bold text-white mb-2">Invite Friends, Earn Pro</h1>
          <p className="text-green-100 text-lg">
            Invite 3 friends → Get 1 month Pro FREE
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-slate-400 text-sm">Friends Joined</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
          <div className="text-3xl font-bold text-emerald-400">{stats.freeMonthsEarned}</div>
          <div className="text-slate-400 text-sm">Months Earned</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
          <div className="text-3xl font-bold text-teal-400">{stats.maxFreeMonths - stats.freeMonthsEarned}</div>
          <div className="text-slate-400 text-sm">Months Left</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Progress to Next Reward</h2>
          <span className="text-slate-400">
            {stats.completed % REFERRAL_CONFIG.REFERRALS_FOR_REWARD}/{REFERRAL_CONFIG.REFERRALS_FOR_REWARD}
          </span>
        </div>
        
        <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-slate-400 text-center">
          {atMaxRewards 
            ? 'You\'ve earned the maximum 6 months of free Pro!' 
            : `Invite ${stats.nextRewardAt} more friend${stats.nextRewardAt > 1 ? 's' : ''} to unlock 30 days Pro FREE`
          }
        </p>
      </div>

      {/* Share Section */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Your Referral Link</h2>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 truncate">
            {stats.referralLink}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">Share via:</span>
          <button
            onClick={() => shareOnPlatform('whatsapp')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            WhatsApp
          </button>
          <button
            onClick={() => shareOnPlatform('telegram')}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
          >
            Telegram
          </button>
          <button
            onClick={() => shareOnPlatform('twitter')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            X (Twitter)
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            { icon: '📤', title: 'Share your link', desc: 'Send your unique referral link to friends' },
            { icon: '👤', title: 'Friend signs up', desc: 'They create an account and run their first scan' },
            { icon: '🎁', title: 'Both get rewarded', desc: 'They get 7 days Pro, you get progress toward 30 days' },
            { icon: '🚀', title: 'Unlock Pro', desc: 'After 3 friends join, you get 30 days Pro FREE!' }
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-white font-medium">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

