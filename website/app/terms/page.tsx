'use client'

import Link from 'next/link'

export default function TermsOfService() {
  const lastUpdated = 'December 25, 2024'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏠</span>
              </div>
              <span className="text-xl font-bold text-gray-800">LandGuard AI</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-lg prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using LandGuard AI's website (landguardai.co), Chrome extension, API, 
                or any related services (collectively, the "Service"), you agree to be bound by these 
                Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Service.
              </p>
              <p className="text-gray-600">
                These Terms constitute a legally binding agreement between you and LandGuard AI ("we," 
                "our," or "us"). Please read them carefully.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                LandGuard AI provides AI-powered tools designed to help users identify potential scam 
                indicators in property and real estate listings. Our Service includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Property listing risk analysis</li>
                <li>Seller verification tools</li>
                <li>Chrome browser extension for real-time analysis</li>
                <li>Web application dashboard</li>
                <li>API access for developers (paid plans)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Important Disclaimer</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-4">
                <p className="text-amber-800 font-semibold mb-2">⚠️ READ CAREFULLY</p>
                <p className="text-amber-700">
                  LandGuard AI is a risk analysis tool only. Our Service does NOT:
                </p>
                <ul className="list-disc pl-6 text-amber-700 mt-2 space-y-1">
                  <li>Verify property ownership or title</li>
                  <li>Provide legal advice</li>
                  <li>Guarantee the legitimacy of any listing</li>
                  <li>Replace professional due diligence</li>
                  <li>Serve as a substitute for real estate attorneys, title companies, or licensed professionals</li>
                </ul>
              </div>
              <p className="text-gray-600">
                Our risk scores and analysis are based on pattern recognition and heuristics. A low-risk 
                score does not guarantee a listing is legitimate, and a high-risk score does not definitively 
                prove fraud. Always conduct independent verification before making any financial decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">4.1 Account Creation</h3>
              <p className="text-gray-600 mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be at least 18 years old</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3">4.2 Account Responsibility</h3>
              <p className="text-gray-600">
                You are responsible for all activities that occur under your account. We reserve the right 
                to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Subscription Plans and Payment</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">5.1 Free Plan</h3>
              <p className="text-gray-600 mb-4">
                Free users receive 3 property scans per month. Free plan features may be limited compared 
                to paid plans.
              </p>

              <h3 className="text-xl font-medium text-gray-700 mb-3">5.2 Paid Plans (Pro)</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Paid subscriptions are billed monthly or annually</li>
                <li>Payment is processed securely through Stripe</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3">5.3 Refund Policy</h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee for new Pro subscriptions. Refund requests must be 
                submitted to support@landguardai.co within 7 days of initial purchase. After this period, 
                subscriptions are non-refundable but can be cancelled to prevent future charges.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Acceptable Use</h2>
              <p className="text-gray-600 mb-4">You agree NOT to use our Service to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm others</li>
                <li>Attempt to reverse engineer, decompile, or hack our Service</li>
                <li>Use automated systems to access our Service without permission</li>
                <li>Resell or redistribute our Service without authorization</li>
                <li>Submit false or misleading information</li>
                <li>Interfere with or disrupt our Service or servers</li>
                <li>Use our Service for competitive intelligence against us</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. API Usage</h2>
              <p className="text-gray-600 mb-4">
                If you use our API, you additionally agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use API keys only for authorized purposes</li>
                <li>Not share your API keys with unauthorized parties</li>
                <li>Respect rate limits and usage quotas</li>
                <li>Not use the API to build a competing service</li>
                <li>Properly attribute LandGuard AI when displaying our data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                All content, features, and functionality of our Service—including but not limited to 
                text, graphics, logos, software, algorithms, and data—are owned by LandGuard AI and 
                protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-600">
                You may not copy, modify, distribute, sell, or lease any part of our Service without 
                our written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. User Content</h2>
              <p className="text-gray-600 mb-4">
                By submitting listing URLs, seller information, or other content to our Service, you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Grant us a license to process and analyze the content</li>
                <li>Represent that you have the right to submit such content</li>
                <li>Agree that we may use anonymized, aggregated data to improve our Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Limitation of Liability</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, LANDGUARD AI AND ITS OFFICERS, DIRECTORS, 
                  EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, data, use, or goodwill</li>
                  <li>Any damages resulting from reliance on our risk analysis</li>
                  <li>Financial losses from property transactions</li>
                  <li>Any damages exceeding the amount you paid us in the past 12 months</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  This limitation applies regardless of the legal theory (contract, tort, negligence, 
                  strict liability, or otherwise).
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Disclaimer of Warranties</h2>
              <p className="text-gray-600 mb-4">
                OUR SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Implied warranties of merchantability</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Accuracy or reliability of any analysis or information</li>
                <li>Uninterrupted or error-free operation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify, defend, and hold harmless LandGuard AI and its officers, directors, 
                employees, and agents from any claims, damages, losses, liabilities, costs, and expenses 
                (including attorney fees) arising from your use of the Service, violation of these Terms, 
                or infringement of any third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Termination</h2>
              <p className="text-gray-600 mb-4">
                We may suspend or terminate your access to our Service at any time, with or without cause, 
                and with or without notice. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your right to use the Service immediately ceases</li>
                <li>We may delete your account and data</li>
                <li>Provisions that should survive termination will remain in effect</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You may terminate your account at any time by contacting support@landguardai.co.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Governing Law</h2>
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which LandGuard AI operates, without regard to conflict of law principles. 
                Any disputes arising from these Terms or your use of the Service shall be resolved in the 
                courts of that jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">15. Dispute Resolution</h2>
              <p className="text-gray-600 mb-4">
                Before filing a formal legal claim, you agree to first contact us at support@landguardai.co 
                to attempt to resolve the dispute informally. We will attempt to resolve disputes within 
                30 days of receiving your complaint.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">16. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these Terms at any time. We will notify you of material 
                changes by posting the updated Terms on our website and updating the "Last updated" date. 
                Your continued use of the Service after changes take effect constitutes acceptance of the 
                new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">17. Severability</h2>
              <p className="text-gray-600">
                If any provision of these Terms is found to be unenforceable or invalid, that provision 
                shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
                shall remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">18. Entire Agreement</h2>
              <p className="text-gray-600">
                These Terms, together with our Privacy Policy and any other legal notices published on our 
                website, constitute the entire agreement between you and LandGuard AI regarding the use 
                of our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">19. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <p className="text-gray-700 mb-2"><strong>LandGuard AI</strong></p>
                <p className="text-gray-600">
                  Email: <a href="mailto:support@landguardai.co" className="text-green-600 hover:underline">support@landguardai.co</a>
                </p>
                <p className="text-gray-600">
                  Website: <a href="https://landguardai.co" className="text-green-600 hover:underline">landguardai.co</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white">🏠</span>
              </div>
              <span className="font-bold">LandGuard AI</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:support@landguardai.co" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} LandGuard AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

