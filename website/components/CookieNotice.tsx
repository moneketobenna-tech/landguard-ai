'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieNotice() {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('lg_cookie_consent')
    if (!cookieConsent) {
      // Show notice after a short delay
      setTimeout(() => setShowNotice(true), 1000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('lg_cookie_consent', 'accepted')
    setShowNotice(false)
  }

  const declineCookies = () => {
    localStorage.setItem('lg_cookie_consent', 'declined')
    setShowNotice(false)
  }

  if (!showNotice) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-6xl mx-auto bg-white border border-lg-gray-200 rounded-2xl shadow-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍪</span>
              <h3 className="font-semibold text-lg-dark text-lg">We Value Your Privacy</h3>
            </div>
            <p className="text-lg-gray-600 text-sm">
              We use cookies to enhance your browsing experience, analyze site traffic, and provide personalized content. 
              By clicking "Accept All", you consent to our use of cookies. 
              <Link href="/privacy" className="text-lg-green-600 hover:text-lg-green-700 ml-1 underline">
                Learn more
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-lg-gray-600 hover:text-lg-dark border border-lg-gray-300 rounded-lg font-medium transition text-sm"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-6 py-2 bg-lg-green-600 text-white rounded-lg font-semibold hover:bg-lg-green-700 transition text-sm shadow-lg"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

