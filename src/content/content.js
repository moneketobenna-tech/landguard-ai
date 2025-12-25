/**
 * LandGuard AI v2.0 - Content Script
 * Enhanced Property Scam Detection Banner with API Integration
 */

(function() {
  'use strict';

  // Constants
  const VERSION = '2.0.0';
  const API_BASE = 'https://landguardai.co/api/v1';
  const BRAND = {
    name: 'LandGuard AI',
    disclaimer: '⚠️ This is a risk analysis tool, not legal advice or ownership verification.'
  };

  const COLORS = {
    safe: '#22c55e',
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#991b1b'
  };

  // Supported sites configuration
  const SITE_CONFIG = {
    'facebook.com': { name: 'Facebook Marketplace', selectors: { 
      title: '[data-testid="listing-title"], h1', 
      description: '[data-testid="listing-description"]',
      price: '[data-testid="listing-price"], .x1xmf6yo'
    }},
    'kijiji.ca': { name: 'Kijiji', selectors: {
      title: 'h1, .title-2323565163',
      description: '[itemprop="description"], .descriptionContainer-1885731498',
      price: '[itemprop="price"], .priceWrapper-1165386740'
    }},
    'craigslist.org': { name: 'Craigslist', selectors: {
      title: '#titletextonly, .postingtitle',
      description: '#postingbody',
      price: '.price'
    }},
    'zillow.com': { name: 'Zillow', selectors: {
      title: 'h1[data-testid="bdp-address-title"]',
      description: '[data-testid="listing-details"]',
      price: '[data-testid="price"]'
    }},
    'realtor.com': { name: 'Realtor.com', selectors: {
      title: 'h1',
      description: '.listing-description',
      price: '[data-testid="list-price"]'
    }},
    'trulia.com': { name: 'Trulia', selectors: {
      title: 'h1',
      description: '[data-testid="property-description"]',
      price: '[data-testid="on-market-price-details"]'
    }},
    'redfin.com': { name: 'Redfin', selectors: {
      title: '.address',
      description: '.remarks',
      price: '.price'
    }},
    'rightmove.co.uk': { name: 'Rightmove', selectors: {
      title: 'h1',
      description: '[data-testid="property-description"]',
      price: '[data-testid="price"]'
    }},
    'zoopla.co.uk': { name: 'Zoopla', selectors: {
      title: 'h1',
      description: '[data-testid="description"]',
      price: '[data-testid="price"]'
    }}
  };

  // State
  let bannerElement = null;
  let currentScan = null;
  let settings = { autoScan: true, showBanner: true, useApiScans: true };
  let apiKey = '';

  // Get current site config
  function getCurrentSite() {
    const hostname = window.location.hostname;
    for (const [domain, config] of Object.entries(SITE_CONFIG)) {
      if (hostname.includes(domain)) {
        return { domain, ...config };
      }
    }
    return null;
  }

  // Extract listing data from page
  function extractListingData() {
    const site = getCurrentSite();
    const data = {
      url: window.location.href,
      title: '',
      description: '',
      price: null,
      imageCount: 0
    };

    if (site) {
      // Title
      const titleEl = document.querySelector(site.selectors.title);
      if (titleEl) data.title = titleEl.textContent.trim();

      // Description
      const descEl = document.querySelector(site.selectors.description);
      if (descEl) data.description = descEl.textContent.trim().substring(0, 3000);

      // Price
      const priceEl = document.querySelector(site.selectors.price);
      if (priceEl) {
        const priceMatch = priceEl.textContent.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          data.price = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }
    } else {
      // Fallback selectors
      const titleEl = document.querySelector('h1');
      if (titleEl) data.title = titleEl.textContent.trim();

      const bodyText = document.body.innerText.substring(0, 5000);
      data.description = bodyText;
    }

    // Count images
    const images = document.querySelectorAll('img[src*="scontent"], img[src*="image"], .gallery img');
    data.imageCount = images.length;

    return data;
  }

  // Scan listing via API
  async function scanListingAPI(data) {
    if (!apiKey) throw new Error('No API key');

    const response = await fetch(`${API_BASE}/scan-listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data;
  }

  // Local scan (fallback)
  function scanListingLocal(data) {
    let score = 0;
    const flags = [];
    const recommendations = [];
    const text = `${data.title} ${data.description}`.toLowerCase();

    // Price analysis
    if (data.price) {
      if (data.price < 5000) {
        score += 25;
        flags.push({ severity: 'high', description: 'Unrealistically low price' });
      } else if (data.price < 20000) {
        score += 12;
        flags.push({ severity: 'medium', description: 'Suspicious pricing' });
      }
    }

    // Risk patterns
    const patterns = [
      { pattern: /urgent|urgently/i, weight: 15, desc: 'Urgency language' },
      { pattern: /wire transfer/i, weight: 25, desc: 'Wire transfer requested' },
      { pattern: /gift card/i, weight: 30, desc: 'Gift card payment' },
      { pattern: /bitcoin|crypto/i, weight: 22, desc: 'Cryptocurrency payment' },
      { pattern: /deposit today|immediate deposit/i, weight: 22, desc: 'Immediate deposit' },
      { pattern: /overseas|abroad|out of country/i, weight: 18, desc: 'Seller overseas' },
      { pattern: /cannot meet|can't meet/i, weight: 15, desc: 'No in-person meeting' },
      { pattern: /whatsapp only|text only/i, weight: 12, desc: 'Unusual contact method' }
    ];

    patterns.forEach(({ pattern, weight, desc }) => {
      if (pattern.test(text)) {
        score += weight;
        flags.push({ 
          severity: weight >= 20 ? 'high' : 'medium', 
          description: desc 
        });
      }
    });

    // Image count
    if (data.imageCount === 0) {
      score += 18;
      flags.push({ severity: 'high', description: 'No images provided' });
    } else if (data.imageCount < 3) {
      score += 8;
      flags.push({ severity: 'low', description: 'Very few images' });
    }

    score = Math.min(100, Math.max(0, score));

    let riskLevel;
    if (score >= 70) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';
    else if (score >= 10) riskLevel = 'low';
    else riskLevel = 'safe';

    // Recommendations
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('⛔ Do NOT send any money or deposit');
      recommendations.push('🔍 Verify ownership through county records');
    } else if (riskLevel === 'medium') {
      recommendations.push('⚠️ Proceed with caution');
      recommendations.push('🔍 Verify seller identity');
    } else {
      recommendations.push('✅ Listing appears legitimate');
    }
    recommendations.push('Always verify property ownership independently');

    return { score, riskLevel, flags, recommendations };
  }

  // Create banner
  function createBanner() {
    if (bannerElement) return;

    bannerElement = document.createElement('div');
    bannerElement.id = 'landguard-banner';
    bannerElement.innerHTML = `
      <div class="lg-content">
        <div class="lg-logo">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI" class="lg-logo-img">
          <span class="lg-logo-text">LandGuard AI</span>
          <span class="lg-version">v${VERSION}</span>
        </div>
        <div class="lg-loading">
          <div class="lg-spinner"></div>
          <span>Analyzing listing...</span>
        </div>
      </div>
    `;

    document.body.insertBefore(bannerElement, document.body.firstChild);
    document.body.style.marginTop = bannerElement.offsetHeight + 'px';
  }

  // Update banner with results
  function updateBanner(result) {
    if (!bannerElement) return;

    currentScan = result;
    const { score, riskLevel, flags, recommendations } = result;
    const color = COLORS[riskLevel] || COLORS.medium;

    const riskLabels = {
      safe: '✅ Safe',
      low: '✓ Low Risk',
      medium: '⚠️ Medium Risk',
      high: '🚨 High Risk',
      critical: '⛔ Critical Risk'
    };

    const displayFlags = flags.slice(0, 4);

    bannerElement.innerHTML = `
      <div class="lg-content">
        <div class="lg-logo">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI" class="lg-logo-img">
          <span class="lg-logo-text">LandGuard AI</span>
        </div>
        
        <div class="lg-score-section">
          <div class="lg-score-display">
            <span class="lg-score-value" style="color: ${color}">${score}</span>
            <span class="lg-score-max">/ 100</span>
          </div>
          <div class="lg-risk-pill lg-risk-${riskLevel}">
            ${riskLabels[riskLevel] || riskLevel}
          </div>
        </div>
        
        <div class="lg-flags">
          ${displayFlags.length > 0 ? displayFlags.map(flag => `
            <div class="lg-flag-chip lg-flag-${flag.severity || 'medium'}">
              <span class="lg-flag-icon">${flag.severity === 'high' ? '🚨' : '⚠️'}</span>
              <span>${flag.description}</span>
            </div>
          `).join('') : `
            <div class="lg-flag-chip lg-flag-low">
              <span class="lg-flag-icon">✅</span>
              <span>No red flags detected</span>
            </div>
          `}
        </div>
        
        <div class="lg-actions">
          <button class="lg-btn lg-btn-secondary" id="lg-rescan">🔄 Re-scan</button>
          <button class="lg-btn lg-btn-primary" id="lg-details">📋 Details</button>
          <button class="lg-btn lg-btn-close" id="lg-close">✕</button>
        </div>
      </div>
      <div class="lg-disclaimer">${BRAND.disclaimer}</div>
    `;

    // Event listeners
    document.getElementById('lg-rescan')?.addEventListener('click', performScan);
    document.getElementById('lg-details')?.addEventListener('click', showDetailsModal);
    document.getElementById('lg-close')?.addEventListener('click', closeBanner);

    document.body.style.marginTop = bannerElement.offsetHeight + 'px';
  }

  // Show details modal
  function showDetailsModal() {
    if (!currentScan) return;

    const { score, riskLevel, flags, recommendations } = currentScan;
    const color = COLORS[riskLevel] || COLORS.medium;

    const overlay = document.createElement('div');
    overlay.id = 'lg-modal-overlay';
    overlay.innerHTML = `
      <div class="lg-modal">
        <div class="lg-modal-header">
          <h2>
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="" style="width: 28px; height: 28px; border-radius: 6px; margin-right: 10px;">
            LandGuard AI Analysis
          </h2>
          <button class="lg-btn lg-btn-close" id="lg-modal-close">✕</button>
        </div>
        <div class="lg-modal-body">
          <div class="lg-modal-score">
            <div class="lg-modal-score-circle" style="border-color: ${color}">
              <span class="lg-modal-score-value" style="color: ${color}">${score}</span>
            </div>
            <div class="lg-risk-pill lg-risk-${riskLevel}" style="font-size: 14px; padding: 10px 20px;">
              ${riskLevel.toUpperCase()} RISK
            </div>
          </div>
          
          <div class="lg-modal-section">
            <h3>🚩 Risk Flags (${flags.length})</h3>
            <ul class="lg-modal-flags">
              ${flags.length > 0 ? flags.map(f => `
                <li class="lg-modal-flag-${f.severity || 'medium'}">
                  <span>${f.severity === 'high' ? '🚨' : '⚠️'}</span>
                  ${f.description}
                </li>
              `).join('') : '<li class="lg-modal-flag-low"><span>✅</span> No significant red flags</li>'}
            </ul>
          </div>
          
          <div class="lg-modal-section">
            <h3>💡 Recommendations</h3>
            <ul class="lg-modal-recommendations">
              ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('lg-modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  // Close banner
  function closeBanner() {
    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
      document.body.style.marginTop = '0';
    }
  }

  // Perform scan
  async function performScan() {
    const data = extractListingData();
    let result;

    try {
      if (settings.useApiScans && apiKey) {
        result = await scanListingAPI(data);
      } else {
        result = scanListingLocal(data);
      }
    } catch (e) {
      console.log('API scan failed, using local:', e.message);
      result = scanListingLocal(data);
    }

    updateBanner(result);

    // Save to history
    try {
      chrome.runtime.sendMessage({
        action: 'saveScan',
        scan: {
          ...result,
          url: data.url,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      console.log('Could not save scan');
    }
  }

  // Message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      sendResponse(extractListingData());
    }
    return true;
  });

  // Initialize
  async function init() {
    const site = getCurrentSite();
    if (!site) return;

    console.log(`LandGuard AI v${VERSION}: Detected ${site.name}`);

    // Load settings
    try {
      const result = await chrome.storage.local.get(['lg_settings', 'lg_api_key']);
      if (result.lg_settings) {
        settings = { ...settings, ...result.lg_settings };
      }
      if (result.lg_api_key) {
        apiKey = result.lg_api_key;
      }
    } catch (e) {
      console.log('Could not load settings');
    }

    // Auto-scan if enabled
    if (settings.autoScan && settings.showBanner) {
      setTimeout(() => {
        createBanner();
        performScan();
      }, 1500);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

