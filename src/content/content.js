// LandGuard AI - Content Script
// Professional Property Scam Detection Banner

(function() {
  'use strict';

  // Constants
  const BRAND = {
    name: 'LandGuard AI',
    version: '1.0.0',
    disclaimer: '⚠️ This is a risk analysis tool, not legal advice or ownership verification.'
  };

  const COLORS = {
    low: '#22C55E',
    medium: '#F59E0B',
    high: '#EF4444'
  };

  // State
  let bannerElement = null;
  let currentScan = null;

  // Check if we're on a supported site
  function isSupportedSite() {
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    // Facebook Marketplace
    if (hostname.includes('facebook.com') && path.includes('/marketplace')) {
      return { site: 'Facebook Marketplace', icon: '📘' };
    }

    // Kijiji
    if (hostname.includes('kijiji.ca')) {
      return { site: 'Kijiji', icon: '🟢' };
    }

    // Craigslist
    if (hostname.includes('craigslist.org')) {
      return { site: 'Craigslist', icon: '📋' };
    }

    return null;
  }

  // Extract listing data from page
  function extractListingData() {
    const data = {
      title: '',
      description: '',
      price: '',
      imageCount: 0
    };

    // Get title
    const titleSelectors = [
      'h1', '[data-testid="listing-title"]', '.listing-title',
      '#titletextonly', '.postingtitle'
    ];
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        data.title = el.textContent.trim();
        break;
      }
    }

    // Get description
    const descSelectors = [
      '[data-testid="listing-description"]', '.listing-description',
      '#postingbody', '.body', 'article'
    ];
    for (const selector of descSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        data.description = el.textContent.trim().substring(0, 2000);
        break;
      }
    }

    // Get price
    const priceSelectors = [
      '[data-testid="listing-price"]', '.price', '.amount',
      '[class*="price"]', '.postingtitle'
    ];
    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent;
        const priceMatch = text.match(/\$[\d,]+\.?\d*/);
        if (priceMatch) {
          data.price = priceMatch[0];
          break;
        }
      }
    }

    // Count images
    const images = document.querySelectorAll('img[src*="scontent"], img[data-testid*="image"], .gallery img, .swipe img');
    data.imageCount = images.length;

    return data;
  }

  // Risk engine (simplified version for content script)
  function scanListing(pageData) {
    let score = 0;
    const flags = [];
    const recommendations = [];
    const description = (pageData.title + ' ' + pageData.description).toLowerCase();

    // Price analysis
    if (pageData.price) {
      const priceMatch = pageData.price.match(/(\d[\d,\.]*)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (price < 5000) {
          score += 25;
          flags.push('Unrealistically low price');
        } else if (price < 20000) {
          score += 12;
          flags.push('Suspicious pricing');
        }
      }
    }

    // Urgency patterns
    const urgencyPatterns = [
      { pattern: /urgent|urgently/, text: 'Urgency language', weight: 15 },
      { pattern: /wire transfer/, text: 'Wire transfer mentioned', weight: 25 },
      { pattern: /gift card/, text: 'Gift card payment', weight: 30 },
      { pattern: /deposit today|immediate deposit/, text: 'Immediate deposit', weight: 20 },
      { pattern: /overseas|abroad|out of country/, text: 'Seller overseas', weight: 18 },
      { pattern: /cannot meet|can't meet/, text: 'No in-person meeting', weight: 15 }
    ];

    urgencyPatterns.forEach(({ pattern, text, weight }) => {
      if (pattern.test(description)) {
        score += weight;
        flags.push(text);
      }
    });

    // Image analysis
    if (pageData.imageCount === 0) {
      score += 20;
      flags.push('No images');
    } else if (pageData.imageCount < 3) {
      score += 10;
      flags.push('Very few images');
    }

    // Cap and determine level
    score = Math.min(100, Math.max(0, score));
    
    let riskLevel;
    if (score >= 60) riskLevel = 'HIGH';
    else if (score >= 30) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Recommendations
    if (score >= 60) {
      recommendations.push('Exercise extreme caution with this listing');
    }
    if (flags.some(f => f.includes('Wire') || f.includes('Gift'))) {
      recommendations.push('Never use untraceable payment methods');
    }
    recommendations.push('Always verify property ownership independently');

    return { score, riskLevel, flags, recommendations };
  }

  // Create banner element
  function createBanner() {
    if (bannerElement) return;

    bannerElement = document.createElement('div');
    bannerElement.id = 'landguard-banner';
    bannerElement.innerHTML = `
      <div class="landguard-content">
        <div class="landguard-logo">
          <div class="landguard-logo-icon">
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI">
          </div>
          <span class="landguard-logo-text">LandGuard AI</span>
        </div>
        <div class="landguard-loading">
          <div class="landguard-spinner"></div>
          <span>Analyzing listing...</span>
        </div>
      </div>
      <div class="landguard-disclaimer">
        <p class="landguard-disclaimer-text">${BRAND.disclaimer}</p>
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
    const levelClass = riskLevel.toLowerCase();

    const riskLabels = {
      'LOW': '✓ Low Risk',
      'MEDIUM': '⚠️ Medium Risk',
      'HIGH': '🚨 High Risk'
    };

    const displayFlags = flags.slice(0, 4);
    const flagIcon = riskLevel === 'HIGH' ? '🚨' : '⚠️';

    bannerElement.innerHTML = `
      <div class="landguard-content">
        <div class="landguard-logo">
          <div class="landguard-logo-icon">
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="LandGuard AI">
          </div>
          <span class="landguard-logo-text">LandGuard AI</span>
        </div>
        
        <div class="landguard-score-section">
          <div class="landguard-score-display">
            <span class="landguard-score-label">Risk Score</span>
            <span class="landguard-score-value" style="color: ${COLORS[levelClass]}">${score}</span>
            <span class="landguard-score-max">/ 100</span>
          </div>
          <div class="landguard-risk-pill landguard-risk-${levelClass}">
            ${riskLabels[riskLevel]}
          </div>
        </div>
        
        <div class="landguard-flags">
          <ul class="landguard-flags-list">
            ${displayFlags.length > 0 ? displayFlags.map(flag => `
              <li class="landguard-flag-item">
                <span class="landguard-flag-icon ${riskLevel === 'HIGH' ? 'high' : ''}">${flagIcon}</span>
                <span>${flag}</span>
              </li>
            `).join('') : `
              <li class="landguard-flag-item">
                <span class="landguard-flag-icon" style="color: #27AE60">✓</span>
                <span>No major red flags detected</span>
              </li>
            `}
          </ul>
        </div>
        
        <div class="landguard-actions">
          <button class="landguard-btn landguard-btn-secondary" id="landguard-rescan">
            🔄 Re-scan
          </button>
          <button class="landguard-btn landguard-btn-primary" id="landguard-details">
            📋 Details
          </button>
          <button class="landguard-btn landguard-btn-close" id="landguard-close">
            ✕
          </button>
        </div>
      </div>
      <div class="landguard-disclaimer">
        <p class="landguard-disclaimer-text">${BRAND.disclaimer}</p>
      </div>
    `;

    // Add event listeners
    document.getElementById('landguard-rescan')?.addEventListener('click', performScan);
    document.getElementById('landguard-details')?.addEventListener('click', showDetails);
    document.getElementById('landguard-close')?.addEventListener('click', closeBanner);

    // Update margin
    document.body.style.marginTop = bannerElement.offsetHeight + 'px';
  }

  // Show details modal
  function showDetails() {
    if (!currentScan) return;

    const { score, riskLevel, flags, recommendations } = currentScan;
    const levelClass = riskLevel.toLowerCase();

    const overlay = document.createElement('div');
    overlay.id = 'landguard-modal-overlay';
    overlay.innerHTML = `
      <div id="landguard-modal">
        <div class="landguard-modal-header">
          <h2 class="landguard-modal-title">
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="" style="width: 24px; height: 24px; border-radius: 6px;">
            LandGuard AI Analysis
          </h2>
          <button class="landguard-btn landguard-btn-close" id="landguard-modal-close">✕</button>
        </div>
        <div class="landguard-modal-body">
          <div class="landguard-modal-section">
            <div class="landguard-modal-section-title">📊 Risk Assessment</div>
            <div class="landguard-modal-score">
              <div>
                <div class="landguard-modal-score-value" style="color: ${COLORS[levelClass]}">${score}</div>
                <div style="font-size: 12px; color: #8a9aaa; margin-top: 4px;">out of 100</div>
              </div>
              <div class="landguard-risk-pill landguard-risk-${levelClass}" style="font-size: 14px; padding: 12px 24px;">
                ${riskLevel} RISK
              </div>
            </div>
          </div>
          
          <div class="landguard-modal-section">
            <div class="landguard-modal-section-title">🚩 Risk Flags Detected (${flags.length})</div>
            <ul class="landguard-modal-flags">
              ${flags.length > 0 ? flags.map(flag => `
                <li>
                  <span style="color: ${riskLevel === 'HIGH' ? '#E74C3C' : '#F39C12'}">⚠️</span>
                  ${flag}
                </li>
              `).join('') : `
                <li>
                  <span style="color: #27AE60">✓</span>
                  No significant red flags detected
                </li>
              `}
            </ul>
          </div>
          
          <div class="landguard-modal-section">
            <div class="landguard-modal-section-title">💡 Recommendations</div>
            <ul class="landguard-modal-recommendations">
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('landguard-modal-close')?.addEventListener('click', () => overlay.remove());
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
  function performScan() {
    const pageData = extractListingData();
    const result = scanListing(pageData);
    updateBanner(result);
  }

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      sendResponse(extractListingData());
    }
    return true;
  });

  // Initialize
  async function init() {
    const site = isSupportedSite();
    if (!site) return;

    // Check settings
    try {
      const result = await chrome.storage.local.get('landguard_settings');
      const settings = result.landguard_settings || { autoScan: true };
      
      if (settings.autoScan) {
        // Wait for page to load
        setTimeout(() => {
          createBanner();
          performScan();
        }, 1500);
      }
    } catch (e) {
      console.error('LandGuard AI: Error loading settings', e);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
