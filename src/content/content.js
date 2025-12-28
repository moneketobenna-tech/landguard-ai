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
    }},
    'propertypro.ng': { name: 'Property Pro Nigeria', selectors: {
      title: 'h1, .property-title',
      description: '.property-description, .description',
      price: '.property-price, .price'
    }},
    'jumia.com.ng': { name: 'Jumia House', selectors: {
      title: 'h1, .product-title',
      description: '.product-description, .description',
      price: '.product-price, .price'
    }}
  };

  // State
  let bannerElement = null;
  let currentScan = null;
  let settings = { autoScan: true, showBanner: true, useApiScans: true };
  let apiKey = '';
  let isScanning = false;

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
    const images = document.querySelectorAll('img[src*="scontent"], img[src*="image"], .gallery img, img');
    data.imageCount = Math.min(images.length, 50);

    console.log('[LandGuard AI] Extracted data:', data.title?.substring(0, 50), 'Price:', data.price, 'Images:', data.imageCount);
    return data;
  }

  // Scan listing via API
  async function scanListingAPI(data) {
    if (!apiKey) throw new Error('No API key');

    console.log('[LandGuard AI] Calling API...');
    const response = await fetch(`${API_BASE}/scan-listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });

    const json = await response.json();
    console.log('[LandGuard AI] API response:', json);
    
    if (!json.success && !json.scanId && json.score === undefined) {
      throw new Error(json.error?.message || json.error || 'API error');
    }
    return json.data || json;
  }

  // Local scan (fallback) - always works
  function scanListingLocal(data) {
    console.log('[LandGuard AI] Running local scan...');
    
    let score = 0;
    const flags = [];
    const recommendations = [];
    const text = `${data.title || ''} ${data.description || ''}`.toLowerCase();

    // Price analysis
    if (data.price) {
      if (data.price < 5000) {
        score += 25;
        flags.push({ severity: 'high', description: 'Unrealistically low price' });
      } else if (data.price < 20000) {
        score += 12;
        flags.push({ severity: 'medium', description: 'Suspiciously low pricing' });
      }
    }

    // Risk patterns
    const patterns = [
      { pattern: /urgent|urgently/i, weight: 15, desc: 'Urgency language detected' },
      { pattern: /wire transfer/i, weight: 25, desc: 'Wire transfer requested' },
      { pattern: /gift card/i, weight: 30, desc: 'Gift card payment' },
      { pattern: /bitcoin|crypto/i, weight: 22, desc: 'Cryptocurrency payment' },
      { pattern: /deposit today|immediate deposit/i, weight: 22, desc: 'Immediate deposit requested' },
      { pattern: /overseas|abroad|out of country/i, weight: 18, desc: 'Seller overseas' },
      { pattern: /cannot meet|can't meet|can not meet/i, weight: 15, desc: 'No in-person meeting' },
      { pattern: /whatsapp only|text only/i, weight: 12, desc: 'Unusual contact method' },
      { pattern: /too good to be true/i, weight: 20, desc: 'Too good to be true' },
      { pattern: /no viewing|no visits/i, weight: 18, desc: 'No property viewing allowed' }
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

    // Image count analysis
    if (data.imageCount === 0) {
      score += 18;
      flags.push({ severity: 'high', description: 'No images provided' });
    } else if (data.imageCount < 3) {
      score += 8;
      flags.push({ severity: 'medium', description: 'Very few images' });
    }

    // Missing title/description
    if (!data.title && !data.description) {
      score += 10;
      flags.push({ severity: 'medium', description: 'Limited listing information' });
    }

    score = Math.min(100, Math.max(0, score));

    let riskLevel;
    if (score >= 70) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';
    else if (score >= 10) riskLevel = 'low';
    else riskLevel = 'safe';

    // Recommendations based on risk
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('⛔ Do NOT send any money or deposit');
      recommendations.push('🔍 Verify ownership through county records');
      recommendations.push('📞 Report this listing to the platform');
    } else if (riskLevel === 'medium') {
      recommendations.push('⚠️ Proceed with caution');
      recommendations.push('🔍 Verify seller identity before meeting');
      recommendations.push('🏛️ Check county property records');
    } else {
      recommendations.push('✅ Listing appears legitimate');
      recommendations.push('📋 Standard due diligence recommended');
    }
    recommendations.push('Always verify property ownership independently');

    console.log('[LandGuard AI] Local scan result - Score:', score, 'Risk:', riskLevel, 'Flags:', flags.length);
    return { score, riskLevel, flags, recommendations };
  }

  // Create banner with scan button
  function createBanner() {
    if (bannerElement) return;

    console.log('[LandGuard AI] Creating banner...');
    
    bannerElement = document.createElement('div');
    bannerElement.id = 'landguard-banner';
    
    // Show banner with Scan button initially (not just loading)
    showInitialBanner();
    
    document.body.insertBefore(bannerElement, document.body.firstChild);
    document.body.style.marginTop = bannerElement.offsetHeight + 'px';
  }
  
  // Show initial banner with Scan button
  function showInitialBanner() {
    if (!bannerElement) return;
    
    const site = getCurrentSite();
    const siteName = site ? site.name : 'this page';
    
    bannerElement.innerHTML = `
      <div class="lg-content">
        <div class="lg-logo">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI" class="lg-logo-img">
          <span class="lg-logo-text">LandGuard AI</span>
          <span class="lg-version">v${VERSION}</span>
        </div>
        
        <div class="lg-status">
          <span class="lg-status-text">Ready to analyze ${siteName}</span>
        </div>
        
        <div class="lg-actions">
          <button class="lg-btn lg-btn-primary lg-scan-btn" id="lg-scan-now">
            🔍 Scan This Listing
          </button>
          <button class="lg-btn lg-btn-close" id="lg-close">✕</button>
        </div>
      </div>
      <div class="lg-disclaimer">${BRAND.disclaimer}</div>
    `;

    // Attach event listeners
    attachBannerEventListeners();
    
    // Update body margin
    requestAnimationFrame(() => {
      if (bannerElement) {
        document.body.style.marginTop = bannerElement.offsetHeight + 'px';
      }
    });
  }

  // Show loading state
  function showLoadingState() {
    if (!bannerElement) return;
    
    bannerElement.innerHTML = `
      <div class="lg-content">
        <div class="lg-logo">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI" class="lg-logo-img">
          <span class="lg-logo-text">LandGuard AI</span>
          <span class="lg-version">v${VERSION}</span>
        </div>
        <div class="lg-loading">
          <div class="lg-spinner"></div>
          <span>Analyzing listing for scam indicators...</span>
        </div>
        <div class="lg-actions">
          <button class="lg-btn lg-btn-close" id="lg-close">✕</button>
        </div>
      </div>
    `;
    
    // Re-attach close button listener
    const closeBtn = document.getElementById('lg-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeBanner);
    }
  }

  // Attach event listeners to banner buttons
  function attachBannerEventListeners() {
    console.log('[LandGuard AI] Attaching event listeners...');
    
    // Scan button
    const scanBtn = document.getElementById('lg-scan-now');
    if (scanBtn) {
      scanBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[LandGuard AI] Scan button clicked!');
        performScan();
      });
    }
    
    // Re-scan button
    const rescanBtn = document.getElementById('lg-rescan');
    if (rescanBtn) {
      rescanBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[LandGuard AI] Re-scan button clicked!');
        performScan();
      });
    }
    
    // Details button
    const detailsBtn = document.getElementById('lg-details');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[LandGuard AI] Details button clicked!');
        showDetailsModal();
      });
    }
    
    // Close button
    const closeBtn = document.getElementById('lg-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[LandGuard AI] Close button clicked!');
        closeBanner();
      });
    }
  }

  // Update banner with results
  function updateBanner(result) {
    if (!bannerElement) return;
    
    console.log('[LandGuard AI] Updating banner with results:', result);
    
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

    const displayFlags = (flags || []).slice(0, 4);
    
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
              <span class="lg-flag-icon">${flag.severity === 'high' || flag.severity === 'critical' ? '🚨' : '⚠️'}</span>
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

    // Attach event listeners
    attachBannerEventListeners();

    // Update body margin
    requestAnimationFrame(() => {
      if (bannerElement) {
        document.body.style.marginTop = bannerElement.offsetHeight + 'px';
      }
    });
  }

  // Show error in banner
  function showErrorInBanner(errorMessage) {
    if (!bannerElement) return;
    
    bannerElement.innerHTML = `
      <div class="lg-content">
        <div class="lg-logo">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI" class="lg-logo-img">
          <span class="lg-logo-text">LandGuard AI</span>
          <span class="lg-version">v${VERSION}</span>
        </div>
        
        <div class="lg-error">
          <span class="lg-error-icon">⚠️</span>
          <span class="lg-error-text">${errorMessage}</span>
        </div>
        
        <div class="lg-actions">
          <button class="lg-btn lg-btn-primary" id="lg-scan-now">🔄 Try Again</button>
          <button class="lg-btn lg-btn-close" id="lg-close">✕</button>
        </div>
      </div>
    `;
    
    attachBannerEventListeners();
  }

  // Show details modal
  function showDetailsModal() {
    if (!currentScan) {
      console.log('[LandGuard AI] No scan data for modal');
      return;
    }

    console.log('[LandGuard AI] Opening details modal');
    
    const { score, riskLevel, flags, recommendations } = currentScan;
    const color = COLORS[riskLevel] || COLORS.medium;

    // Remove any existing modal
    const existingModal = document.getElementById('lg-modal-overlay');
    if (existingModal) existingModal.remove();
    
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
            <h3>🚩 Risk Flags (${(flags || []).length})</h3>
            <ul class="lg-modal-flags">
              ${(flags || []).length > 0 ? flags.map(f => `
                <li class="lg-modal-flag-${f.severity || 'medium'}">
                  <span>${f.severity === 'high' || f.severity === 'critical' ? '🚨' : '⚠️'}</span>
                  ${f.description}
                </li>
              `).join('') : '<li class="lg-modal-flag-low"><span>✅</span> No significant red flags detected</li>'}
            </ul>
          </div>
          
          <div class="lg-modal-section">
            <h3>💡 Recommendations</h3>
            <ul class="lg-modal-recommendations">
              ${(recommendations || ['Always verify property ownership']).map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close button
    document.getElementById('lg-modal-close')?.addEventListener('click', () => {
      console.log('[LandGuard AI] Modal close clicked');
      overlay.remove();
    });
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('[LandGuard AI] Modal overlay clicked');
        overlay.remove();
      }
    });
  }
  
  // Close banner
  function closeBanner() {
    console.log('[LandGuard AI] Closing banner');
    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
      document.body.style.marginTop = '0';
    }
  }

  // Perform scan - main function
  async function performScan() {
    if (isScanning) {
      console.log('[LandGuard AI] Scan already in progress');
      return;
    }
    
    console.log('[LandGuard AI] Starting scan...');
    isScanning = true;
    
    // Show loading state
    showLoadingState();
    
    const data = extractListingData();
    let result;

    try {
      if (settings.useApiScans && apiKey) {
        console.log('[LandGuard AI] Attempting API scan...');
        try {
          result = await scanListingAPI(data);
        } catch (apiError) {
          console.log('[LandGuard AI] API failed, using local scan:', apiError.message);
          result = scanListingLocal(data);
        }
      } else {
        console.log('[LandGuard AI] Using local scan (no API key)');
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
        console.log('[LandGuard AI] Could not save scan to history');
      }
      
    } catch (error) {
      console.error('[LandGuard AI] Scan error:', error);
      showErrorInBanner('Scan failed. Click to try again.');
    } finally {
      isScanning = false;
    }
  }

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[LandGuard AI] Message received:', request.action);
    
    if (request.action === 'getPageData') {
      sendResponse(extractListingData());
    } else if (request.action === 'triggerScan') {
      performScan();
      sendResponse({ status: 'scanning' });
    }
    return true;
  });

  // Initialize
  async function init() {
    const site = getCurrentSite();
    if (!site) {
      console.log('[LandGuard AI] Not a supported site');
      return;
    }
    
    console.log(`[LandGuard AI] v${VERSION}: Detected ${site.name}`);

    // Load settings
    try {
      const result = await chrome.storage.local.get(['lg_settings', 'lg_api_key']);
      if (result.lg_settings) {
        settings = { ...settings, ...result.lg_settings };
      }
      if (result.lg_api_key) {
        apiKey = result.lg_api_key;
      }
      console.log('[LandGuard AI] Settings loaded, hasApiKey:', !!apiKey);
    } catch (e) {
      console.log('[LandGuard AI] Could not load settings:', e.message);
    }

    // Always show banner if enabled
    if (settings.showBanner) {
      // Wait for page to settle
      setTimeout(() => {
        createBanner();
        
        // Auto-scan if enabled
        if (settings.autoScan) {
          console.log('[LandGuard AI] Auto-scan enabled, starting scan...');
          setTimeout(performScan, 500);
        }
      }, 1000);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
