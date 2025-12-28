'use client'

import Link from 'next/link'
import LanguageSelector from '@/components/LanguageSelector'

export default function DownloadPage() {
  const chromeStoreUrl = 'https://chrome.google.com/webstore/detail/landguard-ai' // Update when published
  
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-lg-blue to-lg-green rounded-xl flex items-center justify-center text-xl">
              🛡️
            </div>
            <span className="text-xl font-bold text-lg-silver">LandGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Get <span className="gradient-text">LandGuard AI</span>
          </h1>
          <p className="text-xl text-lg-muted mb-12">
            Install the Chrome extension to protect yourself from property scams
          </p>

          {/* Chrome Extension */}
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-lg-blue to-lg-green rounded-2xl flex items-center justify-center text-3xl">
                🛡️
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold">Chrome Extension</h2>
                <p className="text-lg-muted">Version 1.0.0</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href={chromeStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.167-5.537A11.976 11.976 0 0 0 24 12c0-.749-.069-1.482-.2-2.195zM12 8.182a3.818 3.818 0 1 0 0 7.636 3.818 3.818 0 0 0 0-7.636z"/>
                </svg>
                Add to Chrome
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                { icon: '✅', text: 'Auto-scan on Facebook Marketplace' },
                { icon: '✅', text: 'Works on Kijiji & Craigslist' },
                { icon: '✅', text: 'Supports Property Pro Nigeria & Jumia House' },
                { icon: '✅', text: 'Instant risk analysis' },
                { icon: '✅', text: 'No account required' },
                { icon: '✅', text: '100% free basic plan' },
                { icon: '✅', text: 'Privacy-first design' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-lg-silver">
                  <span className="text-lg-safe">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Install */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Manual Installation (Developer Mode)</h3>
            <ol className="text-left text-lg-muted space-y-2">
              <li>1. Download the extension ZIP file</li>
              <li>2. Go to <code className="bg-lg-dark px-2 py-1 rounded">chrome://extensions/</code></li>
              <li>3. Enable "Developer mode" (top right)</li>
              <li>4. Click "Load unpacked" and select the folder</li>
            </ol>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <p className="text-lg-muted mb-4">Want advanced features?</p>
            <Link href="/pricing" className="btn-secondary">
              View Pro Plans →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-lg-muted text-sm">
        <p>© 2024 LandGuard AI. All rights reserved.</p>
      </footer>
    </main>
  )
}

