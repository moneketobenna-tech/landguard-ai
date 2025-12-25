'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
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
              <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-lg prose-green max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to LandGuard AI ("we," "our," or "us"). We are committed to protecting your privacy 
                and ensuring the security of your personal information. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our website 
                (landguardai.co), Chrome extension, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-600">
                By using our Service, you agree to the collection and use of information in accordance 
                with this Privacy Policy. If you do not agree with our policies and practices, please do 
                not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-700 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Account Information:</strong> When you create an account, we collect your email address and password.</li>
                <li><strong>Payment Information:</strong> When you subscribe to our paid plans, payment processing is handled by Stripe. We do not store your full credit card details.</li>
                <li><strong>Support Communications:</strong> When you contact us at support@landguardai.co, we collect the information you provide in your messages.</li>
                <li><strong>Listing Data:</strong> URLs and content of property listings you choose to scan through our Service.</li>
                <li><strong>Seller Information:</strong> Names, email addresses, phone numbers, or profile URLs you submit for seller verification.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Usage Data:</strong> Information about how you use our Service, including scan history, feature usage, and interaction patterns.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
                <li><strong>Cookies and Similar Technologies:</strong> We use cookies to maintain your session, remember your preferences, and improve our Service.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3">2.3 Chrome Extension Data</h3>
              <p className="text-gray-600">
                Our Chrome extension accesses page content only on supported real estate websites to analyze 
                listings for potential scam indicators. This data is processed locally when possible and 
                transmitted securely to our servers only when using API-powered features. We do not access 
                or collect data from websites outside our supported platforms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To analyze property listings and detect potential scam indicators</li>
                <li>To process your payments and manage your subscription</li>
                <li>To send you important service-related communications</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To detect, prevent, and address technical issues or fraudulent activity</li>
                <li>To comply with legal obligations</li>
                <li>To improve our scam detection algorithms (using anonymized, aggregated data)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> We share data with third-party vendors who assist in providing our Service (e.g., Stripe for payments, hosting providers).</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental authority.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.</li>
                <li><strong>With Your Consent:</strong> We may share information for other purposes with your explicit consent.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as your account is active or as needed to 
                provide you with our Service. Scan history is retained for up to 90 days for free users 
                and indefinitely for Pro users (unless deleted). We may retain certain information as 
                required by law or for legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Security</h2>
              <p className="text-gray-600">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-4 space-y-2">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure password hashing</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
              </ul>
              <p className="text-gray-600 mt-4">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
                absolute security of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us at <a href="mailto:support@landguardai.co" className="text-green-600 hover:underline">support@landguardai.co</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-600">
                Our Service is not intended for children under 18 years of age. We do not knowingly collect 
                personal information from children. If you are a parent or guardian and believe your child 
                has provided us with personal information, please contact us at support@landguardai.co.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your country 
                of residence. These countries may have different data protection laws. By using our Service, 
                you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Third-Party Links</h2>
              <p className="text-gray-600">
                Our Service may contain links to third-party websites or services. We are not responsible 
                for the privacy practices of these third parties. We encourage you to read their privacy 
                policies before providing any personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                Your continued use of the Service after any changes constitutes acceptance of the new 
                Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
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

