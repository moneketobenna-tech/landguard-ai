/**
 * LandGuard AI - Content Script
 * Injects security banner on supported listing pages
 */

(function() {
  'use strict';
  
  // ========== CONSTANTS ==========
  const LANDGUARD_COLORS = {
    primaryBlue: "#0A5CFF",
    secondaryGreen: "#2ECC71",
    dangerRed: "#E74C3C",
    warningAmber: "#F39C12",
    safeGreen: "#27AE60",
    darkBg: "#0B1220",
    lightBg: "#F5F7FA",
    silverText: "#C9D1D9"
  };
  
  const BRAND = {
    name: "LandGuard AI",
    version: "1.0.0",
    tagline: "LandGuard AI protects buyers from land and property scams before money changes hands.",
    disclaimer: "This is a risk analysis tool, not legal advice or ownership verification."
  };
  
  // ========== RISK ENGINE (Inline for content script) ==========
  
  const URGENCY_PATTERNS = [
    /urgent/i, /quick sale/i, /must sell/i, /deposit today/i, /wire transfer/i,
    /gift card/i, /immediate/i, /act fast/i, /won't last/i, /first come/i,
    /serious buyers only/i, /cash only/i, /no time wasters/i, /motivated seller/i,
    /below market/i, /distress sale/i, /western union/i, /moneygram/i,
    /bitcoin/i, /crypto/i, /zelle/i, /venmo/i, /paypal friends/i
  ];
  
  const SUSPICIOUS_CONTACT_PATTERNS = [
    /whatsapp only/i, /text only/i, /no calls/i, /telegram/i, /signal app/i,
    /overseas/i, /out of (the )?country/i, /abroad/i, /traveling/i, /international/i
  ];
  
  const GENERIC_PATTERNS = [
    /beautiful property/i, /amazing opportunity/i, /once in a lifetime/i,
    /dream home/i, /won't be disappointed/i, /perfect location/i,
    /prime location/i, /investment opportunity/i, /guaranteed return/i
  ];
  
  const SUSPICIOUS_CLAIMS = [
    /owner financing/i, /rent to own/i, /lease option/i, /no credit check/i,
    /bad credit ok/i, /no bank needed/i, /private sale/i, /off market/i,
    /exclusive deal/i, /special price/i
  ];
  
  const LOCATION_RED_FLAGS = [
    /exact location available/i, /address upon deposit/i, /viewing after payment/i,
    /keys upon transfer/i, /location disclosed/i
  ];
  
  function extractPageContent() {
    const title = document.title || '';
    const description = document.body?.innerText || '';
    const priceMatch = description.match(/\$[\d,]+(\.\d{2})?/);
    const images = document.querySelectorAll('img');
    
    return {
      title,
      description: description.substring(0, 10000),
      price: priceMatch ? priceMatch[0] : undefined,
      imageCount: images.length
    };
  }
  
  function analyzeContent(content) {
    const flags = [];
    const text = `${content.title} ${content.description}`.toLowerCase();
    
    // Check urgency language
    let urgencyCount = 0;
    URGENCY_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) urgencyCount++;
    });
    if (urgencyCount > 0) {
      flags.push({
        category: "Urgency Language",
        description: `${urgencyCount} pressure tactic${urgencyCount > 1 ? 's' : ''} detected`,
        weight: Math.min(urgencyCount * 8, 30)
      });
    }
    
    // Check suspicious contact patterns
    let contactFlags = 0;
    SUSPICIOUS_CONTACT_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) contactFlags++;
    });
    if (contactFlags > 0) {
      flags.push({
        category: "Suspicious Contact",
        description: "Unusual contact methods detected",
        weight: contactFlags * 10
      });
    }
    
    // Check for unrealistic pricing
    if (content.price) {
      const priceNum = parseFloat(content.price.replace(/[$,]/g, ''));
      if (priceNum > 0 && priceNum < 10000) {
        flags.push({
          category: "Unrealistic Price",
          description: `Price too low for real estate (${content.price})`,
          weight: 25
        });
      }
    }
    
    // Check image count
    if (content.imageCount < 3) {
      flags.push({
        category: "Low Images",
        description: `Only ${content.imageCount} image${content.imageCount !== 1 ? 's' : ''} found`,
        weight: 15
      });
    }
    
    // Check generic language
    let genericCount = 0;
    GENERIC_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) genericCount++;
    });
    if (genericCount >= 3) {
      flags.push({
        category: "Template Language",
        description: "Generic scam phrases detected",
        weight: 12
      });
    }
    
    // Check suspicious seller claims
    let claimCount = 0;
    SUSPICIOUS_CLAIMS.forEach(pattern => {
      if (pattern.test(text)) claimCount++;
    });
    if (claimCount > 0) {
      flags.push({
        category: "Suspicious Claims",
        description: "Unusual seller claims detected",
        weight: claimCount * 8
      });
    }
    
    // Check location red flags
    let locationFlags = 0;
    LOCATION_RED_FLAGS.forEach(pattern => {
      if (pattern.test(text)) locationFlags++;
    });
    if (locationFlags > 0) {
      flags.push({
        category: "Location Hidden",
        description: "Location withheld until payment",
        weight: 20
      });
    }
    
    // Payment method red flags
    if (/wire|western union|moneygram|gift card|bitcoin|crypto|zelle|venmo/i.test(text)) {
      flags.push({
        category: "Risky Payment",
        description: "Untraceable payment requested",
        weight: 25
      });
    }
    
    // Overseas seller
    if (/overseas|abroad|out of country|international|traveling|can't meet/i.test(text)) {
      flags.push({
        category: "Remote Seller",
        description: "Seller claims to be overseas",
        weight: 18
      });
    }
    
    // Deposit requests
    if (/deposit|advance|upfront|before viewing|to hold|secure it/i.test(text)) {
      flags.push({
        category: "Advance Payment",
        description: "Deposit requested before viewing",
        weight: 22
      });
    }
    
    return flags;
  }
  
  function calculateScore(flags) {
    const totalWeight = flags.reduce((sum, flag) => sum + flag.weight, 0);
    return Math.min(totalWeight, 100);
  }
  
  function getRiskLevel(score) {
    if (score >= 60) return "high";
    if (score >= 30) return "medium";
    return "low";
  }
  
  function generateRecommendations(flags, riskLevel) {
    const recommendations = [];
    
    if (riskLevel === "high") {
      recommendations.push("⛔ Do NOT send any money or deposit to this seller");
      recommendations.push("🚫 Do NOT share personal or financial information");
      recommendations.push("🔍 Verify property ownership through official land registry");
    }
    
    if (riskLevel === "medium") {
      recommendations.push("⚠️ Proceed with extreme caution");
      recommendations.push("🔍 Verify seller identity and property ownership independently");
    }
    
    const categories = flags.map(f => f.category);
    
    if (categories.includes("Risky Payment")) {
      recommendations.push("💳 Only use traceable payment methods");
    }
    if (categories.includes("Remote Seller")) {
      recommendations.push("🤝 Insist on meeting seller in person");
    }
    if (categories.includes("Advance Payment")) {
      recommendations.push("🚨 Never pay before viewing property");
    }
    
    if (riskLevel === "low") {
      recommendations.push("✅ Listing appears legitimate, but verify ownership");
      recommendations.push("📋 Use a licensed agent or attorney for transaction");
    }
    
    return [...new Set(recommendations)];
  }
  
  function scanPage() {
    const content = extractPageContent();
    const flags = analyzeContent(content);
    const score = calculateScore(flags);
    const riskLevel = getRiskLevel(score);
    const recommendations = generateRecommendations(flags, riskLevel);
    
    return {
      url: window.location.href,
      timestamp: Date.now(),
      score,
      riskLevel,
      flags: flags.map(f => `${f.category}: ${f.description}`),
      recommendations
    };
  }
  
  // ========== BANNER UI ==========
  
  let bannerElement = null;
  let currentScan = null;
  
  function createBanner() {
    if (bannerElement) return;
    
    bannerElement = document.createElement('div');
    bannerElement.id = 'landguard-banner';
    bannerElement.innerHTML = `
      <div class="landguard-content">
        <div class="landguard-logo">
          <div class="landguard-logo-icon">🛡️</div>
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
  
  function updateBanner(scanResult) {
    if (!bannerElement) return;
    
    currentScan = scanResult;
    const { score, riskLevel, flags, recommendations } = scanResult;
    
    const riskColors = {
      low: LANDGUARD_COLORS.safeGreen,
      medium: LANDGUARD_COLORS.warningAmber,
      high: LANDGUARD_COLORS.dangerRed
    };
    
    const riskLabels = {
      low: "LOW RISK",
      medium: "MEDIUM RISK",
      high: "HIGH RISK"
    };
    
    const displayFlags = flags.slice(0, 5);
    const flagIcon = riskLevel === 'high' ? '🚨' : '⚠️';
    
    bannerElement.innerHTML = `
      <div class="landguard-content">
        <div class="landguard-logo">
          <div class="landguard-logo-icon">🛡️</div>
          <span class="landguard-logo-text">LandGuard AI</span>
        </div>
        
        <div class="landguard-score-section">
          <div class="landguard-score-display">
            <span class="landguard-score-label">Risk Score</span>
            <span class="landguard-score-value" style="color: ${riskColors[riskLevel]}">${score}</span>
            <span class="landguard-score-max">/ 100</span>
          </div>
          <div class="landguard-risk-pill landguard-risk-${riskLevel}">
            ${riskLabels[riskLevel]}
          </div>
        </div>
        
        <div class="landguard-flags">
          <ul class="landguard-flags-list">
            ${displayFlags.map(flag => `
              <li class="landguard-flag-item">
                <span class="landguard-flag-icon ${riskLevel === 'high' ? 'high' : ''}">${flagIcon}</span>
                <span>${flag.split(': ')[1] || flag}</span>
              </li>
            `).join('')}
            ${flags.length === 0 ? '<li class="landguard-flag-item"><span class="landguard-flag-icon" style="color: #27AE60">✓</span><span>No major red flags detected</span></li>' : ''}
          </ul>
        </div>
        
        <div class="landguard-actions">
          <button class="landguard-btn landguard-btn-secondary" id="landguard-rescan">
            🔄 Re-scan
          </button>
          <button class="landguard-btn landguard-btn-primary" id="landguard-details">
            📋 View Details
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
    
    // Update body margin
    document.body.style.marginTop = bannerElement.offsetHeight + 'px';
    
    // Attach event listeners
    document.getElementById('landguard-rescan')?.addEventListener('click', runScan);
    document.getElementById('landguard-details')?.addEventListener('click', showDetails);
    document.getElementById('landguard-close')?.addEventListener('click', closeBanner);
  }
  
  function showDetails() {
    if (!currentScan) return;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('landguard-modal-overlay');
    if (existingModal) existingModal.remove();
    
    const { score, riskLevel, flags, recommendations } = currentScan;
    
    const riskLabels = {
      low: "LOW RISK",
      medium: "MEDIUM RISK",
      high: "HIGH RISK"
    };
    
    const overlay = document.createElement('div');
    overlay.id = 'landguard-modal-overlay';
    overlay.innerHTML = `
      <div id="landguard-modal">
        <div class="landguard-modal-header">
          <h2 class="landguard-modal-title">
            🛡️ LandGuard AI Analysis
          </h2>
          <button class="landguard-btn landguard-btn-close" id="landguard-modal-close">✕</button>
        </div>
        <div class="landguard-modal-body">
          <div class="landguard-detail-section">
            <div class="landguard-detail-title">📊 Risk Assessment</div>
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
              <div style="font-size: 48px; font-weight: 700; color: ${score >= 60 ? '#E74C3C' : score >= 30 ? '#F39C12' : '#27AE60'}">${score}</div>
              <div>
                <div style="font-size: 14px; color: #8b949e;">Risk Score out of 100</div>
                <div class="landguard-risk-pill landguard-risk-${riskLevel}" style="display: inline-block; margin-top: 4px;">
                  ${riskLabels[riskLevel]}
                </div>
              </div>
            </div>
          </div>
          
          ${flags.length > 0 ? `
          <div class="landguard-detail-section">
            <div class="landguard-detail-title">🚩 Risk Flags Detected</div>
            <ul class="landguard-flags-detail">
              ${flags.map(flag => `<li class="landguard-flag-detail-item">${flag}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="landguard-detail-section">
            <div class="landguard-detail-title">💡 Recommendations</div>
            <ul class="landguard-recommendations">
              ${recommendations.map(rec => `<li class="landguard-recommendation-item">${rec}</li>`).join('')}
            </ul>
          </div>
          
          <div class="landguard-detail-section">
            <div class="landguard-detail-title">ℹ️ About This Analysis</div>
            <p style="color: #8b949e; font-size: 12px; line-height: 1.6;">
              ${BRAND.tagline}<br><br>
              <strong style="color: #F39C12;">Disclaimer:</strong> ${BRAND.disclaimer}
            </p>
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
  
  function closeBanner() {
    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
      document.body.style.marginTop = '';
    }
  }
  
  function runScan() {
    createBanner();
    
    // Small delay to show loading state
    setTimeout(() => {
      const result = scanPage();
      updateBanner(result);
      
      // Save to history
      saveScanToHistory(result);
    }, 500);
  }
  
  function saveScanToHistory(scan) {
    try {
      chrome.storage.local.get(['lg_scan_history'], (result) => {
        const history = result.lg_scan_history || [];
        history.unshift(scan);
        const trimmed = history.slice(0, 50);
        chrome.storage.local.set({ lg_scan_history: trimmed });
      });
    } catch (e) {
      console.log('LandGuard AI: Could not save to history', e);
    }
  }
  
  // ========== INITIALIZATION ==========
  
  function isSupportedSite() {
    const url = window.location.href;
    return (
      /facebook\.com\/marketplace/i.test(url) ||
      /kijiji\.ca/i.test(url) ||
      /craigslist\.org/i.test(url)
    );
  }
  
  function init() {
    console.log('LandGuard AI v1.0: Content script loaded on', window.location.hostname);
    
    if (!isSupportedSite()) {
      console.log('LandGuard AI: Not a supported listing site');
      return;
    }
    
    // Check settings before auto-scanning
    chrome.storage.local.get(['lg_settings'], (result) => {
      const settings = result.lg_settings || { autoScan: true };
      
      if (settings.autoScan) {
        // Delay to let page content load
        setTimeout(runScan, 1500);
      }
    });
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scan') {
      const result = scanPage();
      updateBanner(result);
      saveScanToHistory(result);
      sendResponse(result);
    } else if (message.action === 'getScanResult') {
      sendResponse(currentScan);
    }
    return true;
  });
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
