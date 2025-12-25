/**
 * LandGuard AI v2.0 - Popup Script
 * Enhanced Property Scam Detection with API Integration
 * Free users: 3 scans per month
 * Pro users: Unlimited scans + Auto-rescan every 300 seconds
 */

// Constants
const API_BASE = 'https://landguardai.co/api/v1';
const VERSION = '2.0.0';
const FREE_SCAN_LIMIT = 3;
const AUTO_RESCAN_INTERVAL = 300000; // 5 minutes (300 seconds)

// Supported sites with their icons
const SUPPORTED_SITES = [
  { hostname: 'facebook.com', name: 'Facebook Marketplace', icon: '📘' },
  { hostname: 'kijiji.ca', name: 'Kijiji', icon: '🟢' },
  { hostname: 'craigslist.org', name: 'Craigslist', icon: '📋' },
  { hostname: 'zillow.com', name: 'Zillow', icon: '🏠' },
  { hostname: 'realtor.com', name: 'Realtor.com', icon: '🏡' },
  { hostname: 'trulia.com', name: 'Trulia', icon: '🔑' },
  { hostname: 'redfin.com', name: 'Redfin', icon: '🔴' },
  { hostname: 'rightmove.co.uk', name: 'Rightmove', icon: '🇬🇧' },
  { hostname: 'zoopla.co.uk', name: 'Zoopla', icon: '🏘️' }
];

// State
let currentTab = null;
let settings = {
  apiKey: '',
  tier: 'free',
  autoScan: true,
  autoRescan: true // Auto-rescan setting for PRO users
};
let scanUsage = {
  used: 0,
  limit: FREE_SCAN_LIMIT,
  remaining: FREE_SCAN_LIMIT,
  lastReset: null
};
let autoRescanTimer = null;
let countdownTimer = null;
let lastScanTime = null;
let isScanning = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[LandGuard AI] Popup initialized v' + VERSION);
  
  try {
    await loadSettings();
    await loadScanUsage();
    await loadCurrentTab();
    setupEventListeners();
    setupTabs();
    loadHistory();
    updateCreditsDisplay();
    updateAutoRescanUI();
    
    // Auto-scan on popup open if on supported site and auto-scan is enabled
    if (settings.autoScan && isSupportedSite()) {
      console.log('[LandGuard AI] Auto-scanning on popup open...');
      setTimeout(() => scanListing(), 500);
    }
    
    // Start auto-rescan timer for PRO users
    startAutoRescanTimer();
  } catch (e) {
    console.error('[LandGuard AI] Init error:', e);
  }
});

// Check if current site is supported
function isSupportedSite() {
  if (!currentTab?.url) return false;
  try {
    const url = new URL(currentTab.url);
    return SUPPORTED_SITES.some(site => url.hostname.includes(site.hostname));
  } catch {
    return false;
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['lg_settings', 'lg_api_key', 'lg_tier', 'lg_auto_rescan']);
    if (result.lg_settings) {
      settings = { ...settings, ...result.lg_settings };
    }
    if (result.lg_api_key) {
      settings.apiKey = result.lg_api_key;
    }
    if (result.lg_tier) {
      settings.tier = result.lg_tier;
    }
    if (result.lg_auto_rescan !== undefined) {
      settings.autoRescan = result.lg_auto_rescan;
    }
    
    // Update tier badge
    updateTierBadge();
    
    console.log('[LandGuard AI] Settings loaded:', { tier: settings.tier, autoRescan: settings.autoRescan, hasApiKey: !!settings.apiKey });
  } catch (e) {
    console.error('[LandGuard AI] Error loading settings:', e);
  }
}

// Update tier badge
function updateTierBadge() {
  const tierBadge = document.getElementById('tierBadge');
  if (tierBadge) {
    if (settings.tier === 'pro') {
      tierBadge.textContent = '⚡ PRO';
      tierBadge.classList.add('pro');
      tierBadge.classList.remove('exhausted');
    } else {
      tierBadge.textContent = `${scanUsage.remaining}/${scanUsage.limit} FREE`;
      tierBadge.classList.remove('pro');
      if (scanUsage.remaining <= 0) {
        tierBadge.classList.add('exhausted');
      } else {
        tierBadge.classList.remove('exhausted');
      }
    }
  }
}

// Load scan usage from storage
async function loadScanUsage() {
  try {
    const result = await chrome.storage.local.get(['lg_scan_usage']);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    if (result.lg_scan_usage) {
      // Check if we need to reset for new month
      if (result.lg_scan_usage.monthKey !== currentMonth) {
        // New month - reset usage
        scanUsage = {
          used: 0,
          limit: FREE_SCAN_LIMIT,
          remaining: FREE_SCAN_LIMIT,
          monthKey: currentMonth
        };
        await chrome.storage.local.set({ lg_scan_usage: scanUsage });
        console.log('[LandGuard AI] New month - scan usage reset');
      } else {
        scanUsage = result.lg_scan_usage;
      }
    } else {
      // First time - initialize usage
      scanUsage = {
        used: 0,
        limit: FREE_SCAN_LIMIT,
        remaining: FREE_SCAN_LIMIT,
        monthKey: currentMonth
      };
      await chrome.storage.local.set({ lg_scan_usage: scanUsage });
    }
    
    updateScanUsageDisplay();
  } catch (e) {
    console.error('[LandGuard AI] Error loading scan usage:', e);
  }
}

// Update scan usage display
function updateScanUsageDisplay() {
  updateTierBadge();
}

// Increment scan usage
async function incrementScanUsage() {
  if (settings.tier === 'pro') return; // Pro users have unlimited
  
  scanUsage.used++;
  scanUsage.remaining = Math.max(0, scanUsage.limit - scanUsage.used);
  
  await chrome.storage.local.set({ lg_scan_usage: scanUsage });
  updateScanUsageDisplay();
  console.log('[LandGuard AI] Scan usage updated:', scanUsage);
}

// Check if user can scan
function canScan() {
  if (settings.tier === 'pro') return true;
  return scanUsage.remaining > 0;
}

// Update auto-rescan UI
function updateAutoRescanUI() {
  const autoRescanToggle = document.getElementById('autoRescanToggle');
  const autoRescanSection = document.getElementById('autoRescanSection');
  
  // Only show auto-rescan for PRO users
  if (autoRescanSection) {
    autoRescanSection.style.display = settings.tier === 'pro' ? 'flex' : 'none';
  }
  
  if (autoRescanToggle) {
    autoRescanToggle.checked = settings.autoRescan;
  }
  
  // Update countdown display
  updateAutoRescanCountdown();
}

// Update auto-rescan countdown
function updateAutoRescanCountdown() {
  const countdownEl = document.getElementById('autoRescanCountdown');
  if (!countdownEl) return;
  
  if (settings.tier !== 'pro' || !settings.autoRescan || !lastScanTime) {
    countdownEl.textContent = '';
    return;
  }
  
  const elapsed = Date.now() - lastScanTime;
  const remaining = Math.max(0, AUTO_RESCAN_INTERVAL - elapsed);
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (remaining > 0) {
    countdownEl.textContent = `Next scan in ${minutes}:${secs.toString().padStart(2, '0')}`;
  } else {
    countdownEl.textContent = 'Scanning...';
  }
}

// Start auto-rescan timer for PRO users
function startAutoRescanTimer() {
  // Clear existing timers
  if (autoRescanTimer) {
    clearInterval(autoRescanTimer);
    autoRescanTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  
  // Only auto-rescan for PRO users with setting enabled
  if (settings.tier !== 'pro' || !settings.autoRescan) {
    console.log('[LandGuard AI] Auto-rescan disabled (tier=' + settings.tier + ', autoRescan=' + settings.autoRescan + ')');
    return;
  }
  
  console.log('[LandGuard AI] Starting auto-rescan timer (300 seconds)');
  
  // Update countdown every second
  countdownTimer = setInterval(() => {
    updateAutoRescanCountdown();
  }, 1000);
  
  // Check for auto-rescan every 5 seconds
  autoRescanTimer = setInterval(() => {
    if (lastScanTime && Date.now() - lastScanTime >= AUTO_RESCAN_INTERVAL && !isScanning) {
      console.log('[LandGuard AI] Auto-rescan triggered!');
      scanListing();
    }
  }, 5000);
}

// Toggle auto-rescan
async function toggleAutoRescan() {
  settings.autoRescan = !settings.autoRescan;
  await chrome.storage.local.set({ lg_auto_rescan: settings.autoRescan });
  
  console.log('[LandGuard AI] Auto-rescan toggled:', settings.autoRescan);
  
  updateAutoRescanUI();
  
  if (settings.autoRescan) {
    startAutoRescanTimer();
  } else {
    if (autoRescanTimer) {
      clearInterval(autoRescanTimer);
      autoRescanTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }
}

// Show upgrade modal
function showUpgradeModal() {
  // Remove any existing modal
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) existingModal.remove();
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="upgrade-modal">
      <div class="modal-icon">🔒</div>
      <h2>Free Scans Exhausted</h2>
      <p>You've used all <strong>${scanUsage.limit} free scans</strong> this month.</p>
      <p class="modal-subtext">Upgrade to PRO for unlimited property scans and auto-rescan!</p>
      
      <div class="pro-features">
        <div class="feature-item">✅ Unlimited property scans</div>
        <div class="feature-item">✅ Auto-rescan every 5 minutes</div>
        <div class="feature-item">✅ Seller verification</div>
        <div class="feature-item">✅ PDF Report Export</div>
        <div class="feature-item">✅ Priority support</div>
      </div>
      
      <button class="upgrade-btn" id="modalUpgradeBtn">
        Upgrade to PRO - $9.99/mo
      </button>
      <button class="close-modal-btn" id="closeModalBtn">
        Maybe Later
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Event listeners
  document.getElementById('modalUpgradeBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://landguardai.co/pricing' });
    overlay.remove();
  });
  
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    overlay.remove();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Load current tab URL
async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab && tab.url) {
      const url = new URL(tab.url);
      const urlDisplay = document.getElementById('currentUrl');
      const siteBadge = document.getElementById('siteBadge');
      
      // Truncate URL for display
      if (urlDisplay) {
        urlDisplay.textContent = tab.url.length > 80 
          ? tab.url.substring(0, 80) + '...' 
          : tab.url;
      }
      
      // Check if supported site
      const supportedSite = SUPPORTED_SITES.find(site => 
        url.hostname.includes(site.hostname)
      );
      
      if (siteBadge) {
        if (supportedSite) {
          siteBadge.innerHTML = `${supportedSite.icon} ${supportedSite.name}`;
          siteBadge.classList.remove('unsupported');
        } else {
          siteBadge.innerHTML = '⚠️ Unknown Site';
          siteBadge.classList.add('unsupported');
        }
      }
    }
  } catch (e) {
    console.error('[LandGuard AI] Error loading tab:', e);
    const urlDisplay = document.getElementById('currentUrl');
    if (urlDisplay) {
      urlDisplay.textContent = 'Unable to detect URL';
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Scan buttons
  const scanListingBtn = document.getElementById('scanListingBtn');
  const scanSellerBtn = document.getElementById('scanSellerBtn');
  
  if (scanListingBtn) {
    scanListingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[LandGuard AI] Scan Listing button clicked');
      scanListing();
    });
  }
  
  if (scanSellerBtn) {
    scanSellerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[LandGuard AI] Scan Seller button clicked');
      scanSeller();
    });
  }
  
  // Toggle details
  const toggleDetails = document.getElementById('toggleDetails');
  if (toggleDetails) {
    toggleDetails.addEventListener('click', () => {
      const section = document.getElementById('detailsSection');
      const toggle = document.getElementById('toggleDetails');
      if (section) {
        section.classList.toggle('open');
        toggle.querySelector('span').textContent = section.classList.contains('open') 
          ? '➖ Hide Listing Details' 
          : '➕ Add Listing Details (Optional)';
      }
    });
  }
  
  // Settings link
  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
  
  // Result actions
  const saveToHistory = document.getElementById('saveToHistory');
  const clearHistory = document.getElementById('clearHistory');
  
  if (saveToHistory) {
    saveToHistory.addEventListener('click', saveCurrentScan);
  }
  if (clearHistory) {
    clearHistory.addEventListener('click', clearHistoryFn);
  }
  
  // Auto-rescan toggle
  const autoRescanToggle = document.getElementById('autoRescanToggle');
  if (autoRescanToggle) {
    autoRescanToggle.addEventListener('change', toggleAutoRescan);
  }
}

// Setup tab navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activate clicked tab
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      const tabContent = document.getElementById(`tab-${tabId}`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
}

// Scan Listing - MAIN SCAN FUNCTION
async function scanListing() {
  console.log('[LandGuard AI] scanListing() called');
  
  // Prevent concurrent scans
  if (isScanning) {
    console.log('[LandGuard AI] Scan already in progress, skipping');
    return;
  }
  
  // Check scan limit
  if (!canScan()) {
    console.log('[LandGuard AI] Scan limit reached');
    showUpgradeModal();
    return;
  }
  
  isScanning = true;
  
  const btn = document.getElementById('scanListingBtn');
  const resultsSection = document.getElementById('listingResults');
  const useApiCheckbox = document.getElementById('useApi');
  const useApi = useApiCheckbox ? useApiCheckbox.checked : true;
  
  // Update button state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div><span>Analyzing...</span>';
  }
  
  try {
    // Gather listing data
    const listingData = {
      url: currentTab?.url || window.location.href || '',
      title: document.getElementById('listingTitle')?.value?.trim() || '',
      description: document.getElementById('listingDesc')?.value?.trim() || '',
      price: parsePrice(document.getElementById('listingPrice')?.value || ''),
      location: document.getElementById('listingLocation')?.value?.trim() || ''
    };
    
    console.log('[LandGuard AI] Listing data:', listingData);
    
    // Try to get page data from content script
    try {
      if (currentTab?.id) {
        const pageData = await chrome.tabs.sendMessage(currentTab.id, { action: 'getPageData' });
        if (pageData) {
          console.log('[LandGuard AI] Got page data from content script:', pageData);
          listingData.title = listingData.title || pageData.title;
          listingData.description = listingData.description || pageData.description;
          listingData.price = listingData.price || parsePrice(pageData.price);
          listingData.imageUrls = pageData.imageUrls || [];
          listingData.imageCount = pageData.imageCount || 0;
        }
      }
    } catch (e) {
      console.log('[LandGuard AI] Content script not available (this is OK):', e.message);
    }
    
    let result;
    
    // Use API if we have an API key, otherwise use local scanning
    if (useApi && settings.apiKey) {
      console.log('[LandGuard AI] Using API for scan...');
      try {
        result = await scanListingAPI(listingData);
      } catch (apiError) {
        console.log('[LandGuard AI] API scan failed, falling back to local:', apiError.message);
        result = scanListingLocal(listingData);
      }
    } else {
      console.log('[LandGuard AI] Using local scan (no API key or API disabled)...');
      result = scanListingLocal(listingData);
    }
    
    console.log('[LandGuard AI] Scan result:', result);
    
    // Increment scan usage for free users
    await incrementScanUsage();
    
    // Update last scan time for auto-rescan
    lastScanTime = Date.now();
    updateAutoRescanUI();
    
    // Display results
    displayListingResults(result);
    if (resultsSection) {
      resultsSection.style.display = 'block';
    }
    
    // Store for saving
    if (resultsSection) {
      resultsSection.dataset.result = JSON.stringify({
        ...result,
        url: listingData.url,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('[LandGuard AI] Scan error:', error);
    
    // Check if it's a scan limit error from the API
    if (error.message === 'SCAN_LIMIT_REACHED') {
      showUpgradeModal();
      return;
    }
    
    // Show error in results section
    if (resultsSection) {
      resultsSection.innerHTML = `
        <div class="scan-error">
          <span class="error-icon">❌</span>
          <span>Scan failed: ${error.message || 'Please try again'}</span>
        </div>
      `;
      resultsSection.style.display = 'block';
    }
  } finally {
    isScanning = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Scan Listing</span>';
    }
  }
}

// Scan Listing via API
async function scanListingAPI(data) {
  console.log('[LandGuard AI] API request to:', `${API_BASE}/scan-listing`);
  
  const response = await fetch(`${API_BASE}/scan-listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  const json = await response.json();
  console.log('[LandGuard AI] API response:', json);
  
  // Check for scan limit error
  if (json.error === 'SCAN_LIMIT_REACHED') {
    throw new Error('SCAN_LIMIT_REACHED');
  }
  
  if (!json.success && !json.scanId && json.score === undefined) {
    throw new Error(json.error?.message || json.error || json.message || 'API error');
  }
  
  // Update credits display
  if (json.meta?.creditsRemaining !== undefined) {
    updateCreditsDisplay(json.meta.creditsRemaining);
  }
  
  // Update scan usage from API response
  if (json.scanUsage) {
    scanUsage = {
      ...scanUsage,
      used: json.scanUsage.used,
      remaining: json.scanUsage.remaining,
      limit: json.scanUsage.limit
    };
    await chrome.storage.local.set({ lg_scan_usage: scanUsage });
    updateScanUsageDisplay();
  }
  
  return json.data || json;
}

// Local Listing Scan (Fallback)
function scanListingLocal(data) {
  console.log('[LandGuard AI] Running local scan...');
  
  let score = 0;
  const flags = [];
  const recommendations = [];
  
  const text = `${data.title || ''} ${data.description || ''} ${data.location || ''}`.toLowerCase();
  
  // Price analysis
  if (data.price) {
    if (data.price < 5000) {
      score += 25;
      flags.push({ severity: 'high', description: 'Unrealistically low price detected' });
    } else if (data.price < 20000) {
      score += 12;
      flags.push({ severity: 'medium', description: 'Suspiciously low pricing' });
    }
  }
  
  // Urgency patterns
  const urgencyPatterns = [
    { pattern: /urgent|urgently/i, weight: 15, text: 'Urgency language detected' },
    { pattern: /quick sale|fast sale/i, weight: 15, text: 'Pressure to sell quickly' },
    { pattern: /wire transfer/i, weight: 25, text: 'Wire transfer requested' },
    { pattern: /gift card/i, weight: 30, text: 'Gift card payment requested' },
    { pattern: /bitcoin|crypto/i, weight: 20, text: 'Cryptocurrency payment' },
    { pattern: /deposit today|immediate deposit/i, weight: 22, text: 'Immediate deposit requested' },
    { pattern: /overseas|abroad|out of country/i, weight: 18, text: 'Seller claims overseas' },
    { pattern: /cannot meet|can't meet/i, weight: 15, text: 'Refuses in-person meeting' },
    { pattern: /whatsapp only|text only/i, weight: 12, text: 'Unusual contact method' }
  ];
  
  urgencyPatterns.forEach(({ pattern, weight, text: flagText }) => {
    if (pattern.test(text)) {
      score += weight;
      flags.push({ 
        severity: weight >= 20 ? 'high' : 'medium', 
        description: flagText 
      });
    }
  });
  
  // Image analysis (local)
  const imageAnalysis = {
    imageCount: data.imageCount || 0,
    stockImageDetected: false,
    score: 0
  };
  
  if (imageAnalysis.imageCount === 0) {
    score += 18;
    flags.push({ severity: 'high', description: 'No images provided' });
    imageAnalysis.score = 18;
  } else if (imageAnalysis.imageCount < 3) {
    score += 8;
    flags.push({ severity: 'medium', description: 'Few images provided' });
    imageAnalysis.score = 8;
  }
  
  // Template detection (local)
  const templatePhrases = ['beautiful property', 'great investment', 'won\'t last', 'serious inquiries only', 'motivated seller'];
  let genericCount = 0;
  templatePhrases.forEach(phrase => {
    if (text.includes(phrase)) genericCount++;
  });
  
  const templateAnalysis = {
    isTemplateText: genericCount >= 3,
    genericPhraseCount: genericCount,
    score: genericCount >= 3 ? 15 : genericCount >= 2 ? 8 : 0
  };
  
  if (templateAnalysis.score > 0) {
    score += templateAnalysis.score;
    flags.push({ severity: genericCount >= 3 ? 'high' : 'medium', description: `Generic phrases detected (${genericCount})` });
  }
  
  // Cap score
  score = Math.min(100, Math.max(0, score));
  
  // Determine risk level
  let riskLevel;
  if (score >= 70) riskLevel = 'critical';
  else if (score >= 50) riskLevel = 'high';
  else if (score >= 30) riskLevel = 'medium';
  else if (score >= 10) riskLevel = 'low';
  else riskLevel = 'safe';
  
  // Generate recommendations
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('⛔ Do NOT send any money or deposit');
    recommendations.push('🔍 Verify property ownership independently');
    recommendations.push('📞 Report this listing to the platform');
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ Proceed with extreme caution');
    recommendations.push('🔍 Verify seller identity');
    recommendations.push('🏛️ Check county property records');
  } else {
    recommendations.push('✅ Listing appears legitimate');
    recommendations.push('📋 Standard due diligence recommended');
  }
  
  console.log('[LandGuard AI] Local scan complete - Score:', score, 'Risk:', riskLevel);
  
  return {
    scanId: `local_${Date.now()}`,
    score,
    riskLevel,
    flags,
    recommendations,
    analysis: {
      imageAnalysis,
      templateAnalysis
    },
    metadata: {
      scannedAt: new Date().toISOString(),
      apiVersion: 'local'
    }
  };
}

// Display Listing Results
function displayListingResults(result) {
  const { score, riskLevel, flags, recommendations, analysis } = result;
  
  // Score circle
  const scoreCircle = document.getElementById('scoreCircle');
  const scoreValue = document.getElementById('scoreValue');
  if (scoreCircle) scoreCircle.className = `score-circle ${riskLevel}`;
  if (scoreValue) scoreValue.textContent = score;
  
  // Risk badge
  const riskBadge = document.getElementById('riskBadge');
  const riskLabels = {
    safe: '✅ Safe',
    low: '✓ Low Risk',
    medium: '⚠️ Medium Risk',
    high: '🚨 High Risk',
    critical: '⛔ Critical Risk'
  };
  if (riskBadge) {
    riskBadge.textContent = riskLabels[riskLevel] || riskLevel;
    riskBadge.className = `risk-badge ${riskLevel}`;
  }
  
  // Scan time
  const scanTime = document.getElementById('scanTime');
  if (scanTime) {
    scanTime.textContent = `Scanned ${new Date().toLocaleTimeString()}`;
  }
  
  // Analysis summary (Image & Template)
  const analysisSection = document.getElementById('analysisSection');
  if (analysisSection && analysis) {
    let analysisHTML = '<div class="analysis-grid">';
    
    if (analysis.imageAnalysis) {
      const imgStatus = analysis.imageAnalysis.stockImageDetected ? 'warning' : 'ok';
      analysisHTML += `
        <div class="analysis-card ${imgStatus}">
          <span class="analysis-icon">📸</span>
          <div class="analysis-content">
            <div class="analysis-title">Image Analysis</div>
            <div class="analysis-value">${analysis.imageAnalysis.imageCount} photos</div>
            ${analysis.imageAnalysis.stockImageDetected 
              ? '<div class="analysis-warning">⚠️ Stock photo detected</div>'
              : '<div class="analysis-ok">✓ Original photos</div>'
            }
          </div>
        </div>
      `;
    }
    
    if (analysis.templateAnalysis) {
      const tmpStatus = analysis.templateAnalysis.isTemplateText ? 'warning' : 'ok';
      analysisHTML += `
        <div class="analysis-card ${tmpStatus}">
          <span class="analysis-icon">📝</span>
          <div class="analysis-content">
            <div class="analysis-title">Template Detection</div>
            <div class="analysis-value">${analysis.templateAnalysis.genericPhraseCount} generic phrases</div>
            ${analysis.templateAnalysis.isTemplateText
              ? '<div class="analysis-warning">⚠️ Template text detected</div>'
              : '<div class="analysis-ok">✓ Unique content</div>'
            }
          </div>
        </div>
      `;
    }
    
    analysisHTML += '</div>';
    analysisSection.innerHTML = analysisHTML;
    analysisSection.style.display = 'block';
  }
  
  // Flags
  const flagsList = document.getElementById('flagsList');
  const flagsCount = document.getElementById('flagsCount');
  if (flagsCount) flagsCount.textContent = flags?.length || 0;
  
  if (flagsList) {
    flagsList.innerHTML = flags && flags.length > 0 
      ? flags.map(flag => `
          <li class="${flag.severity || 'medium'}">
            <span class="flag-icon">${flag.severity === 'high' || flag.severity === 'critical' ? '🚨' : '⚠️'}</span>
            <span>${flag.description}</span>
          </li>
        `).join('')
      : '<li class="low"><span class="flag-icon">✅</span><span>No significant red flags detected</span></li>';
  }
  
  // Recommendations
  const recList = document.getElementById('recommendationsList');
  if (recList && recommendations) {
    recList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
  }
  
  // Show export button
  const exportBtn = document.getElementById('exportReportBtn');
  if (exportBtn) {
    exportBtn.style.display = 'flex';
  }
}

// Export report as PDF
async function exportReport() {
  const resultsSection = document.getElementById('listingResults');
  if (!resultsSection?.dataset?.result) {
    alert('No scan result to export');
    return;
  }
  
  try {
    const result = JSON.parse(resultsSection.dataset.result);
    
    const response = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanResult: result,
        propertyInfo: {
          url: result.url || currentTab?.url,
          title: document.getElementById('listingTitle')?.value || undefined,
          price: document.getElementById('listingPrice')?.value || undefined,
          location: document.getElementById('listingLocation')?.value || undefined
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.html) {
      // Open report in new tab
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      chrome.tabs.create({ url });
    } else {
      alert('Failed to generate report');
    }
  } catch (error) {
    console.error('[LandGuard AI] Export error:', error);
    alert('Failed to generate report');
  }
}

// Scan Seller
async function scanSeller() {
  console.log('[LandGuard AI] scanSeller() called');
  
  // Check scan limit
  if (!canScan()) {
    showUpgradeModal();
    return;
  }
  
  const btn = document.getElementById('scanSellerBtn');
  const resultsSection = document.getElementById('sellerResults');
  
  // Gather seller data
  const sellerData = {
    name: document.getElementById('sellerName')?.value?.trim() || '',
    email: document.getElementById('sellerEmail')?.value?.trim() || '',
    phone: document.getElementById('sellerPhone')?.value?.trim() || '',
    profileUrl: document.getElementById('sellerProfile')?.value?.trim() || ''
  };
  
  // Validate at least one field
  if (!sellerData.name && !sellerData.email && !sellerData.phone && !sellerData.profileUrl) {
    alert('Please enter at least one seller detail');
    return;
  }
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div><span>Verifying...</span>';
  }
  
  try {
    let result;
    
    if (settings.apiKey) {
      // Use API
      try {
        const response = await fetch(`${API_BASE}/scan-seller`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify(sellerData)
        });
        
        const json = await response.json();
        
        // Check for scan limit error
        if (json.error === 'SCAN_LIMIT_REACHED') {
          showUpgradeModal();
          return;
        }
        
        if (json.success || json.scanId || json.score !== undefined) {
          result = json.data || json;
          if (json.meta?.creditsRemaining !== undefined) {
            updateCreditsDisplay(json.meta.creditsRemaining);
          }
          // Update scan usage from API response
          if (json.scanUsage) {
            scanUsage = {
              ...scanUsage,
              used: json.scanUsage.used,
              remaining: json.scanUsage.remaining,
              limit: json.scanUsage.limit
            };
            await chrome.storage.local.set({ lg_scan_usage: scanUsage });
            updateScanUsageDisplay();
          }
        } else {
          throw new Error(json.error?.message || json.error || 'API error');
        }
      } catch (apiError) {
        console.log('[LandGuard AI] Seller API scan failed, using local:', apiError.message);
        result = scanSellerLocal(sellerData);
      }
    } else {
      // Local scan
      result = scanSellerLocal(sellerData);
    }
    
    // Increment scan usage for free users
    await incrementScanUsage();
    
    displaySellerResults(result);
    if (resultsSection) {
      resultsSection.style.display = 'block';
    }
    
  } catch (error) {
    console.error('[LandGuard AI] Seller scan error:', error);
    alert('Error verifying seller. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">👤</span><span class="btn-text">Verify Seller</span>';
    }
  }
}

// Local Seller Scan
function scanSellerLocal(data) {
  let score = 0;
  const flags = [];
  const recommendations = [];
  
  // Email analysis
  if (data.email) {
    if (/temp|fake|trash|guerrilla/i.test(data.email)) {
      score += 20;
      flags.push({ severity: 'high', description: 'Disposable email detected' });
    }
    if (/\d{4,}/.test(data.email)) {
      score += 8;
      flags.push({ severity: 'medium', description: 'Email contains many numbers' });
    }
  }
  
  // Phone analysis
  if (data.phone) {
    const cleaned = data.phone.replace(/\D/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) {
      score += 10;
      flags.push({ severity: 'medium', description: 'Invalid phone format' });
    }
  }
  
  score = Math.min(100, score);
  
  let riskLevel;
  if (score >= 50) riskLevel = 'high';
  else if (score >= 25) riskLevel = 'medium';
  else if (score >= 10) riskLevel = 'low';
  else riskLevel = 'safe';
  
  recommendations.push('🔍 Search seller name online');
  recommendations.push('📞 Verify phone number is active');
  if (riskLevel !== 'safe') {
    recommendations.push('⚠️ Request video call verification');
  }
  
  return {
    scanId: `seller_${Date.now()}`,
    score,
    riskLevel,
    flags,
    recommendations
  };
}

// Display Seller Results
function displaySellerResults(result) {
  const { score, riskLevel, flags, recommendations } = result;
  
  const scoreCircle = document.getElementById('sellerScoreCircle');
  const scoreValue = document.getElementById('sellerScoreValue');
  if (scoreCircle) scoreCircle.className = `score-circle ${riskLevel}`;
  if (scoreValue) scoreValue.textContent = score;
  
  const riskBadge = document.getElementById('sellerRiskBadge');
  const riskLabels = {
    safe: '✅ Verified',
    low: '✓ Low Risk',
    medium: '⚠️ Caution',
    high: '🚨 High Risk'
  };
  if (riskBadge) {
    riskBadge.textContent = riskLabels[riskLevel] || riskLevel;
    riskBadge.className = `risk-badge ${riskLevel}`;
  }
  
  const flagsList = document.getElementById('sellerFlagsList');
  if (flagsList) {
    flagsList.innerHTML = flags && flags.length > 0
      ? flags.map(f => `
          <li class="${f.severity}">
            <span class="flag-icon">${f.severity === 'high' ? '🚨' : '⚠️'}</span>
            <span>${f.description}</span>
          </li>
        `).join('')
      : '<li class="low"><span class="flag-icon">✅</span><span>No red flags found</span></li>';
  }
  
  const recList = document.getElementById('sellerRecommendationsList');
  if (recList && recommendations) {
    recList.innerHTML = recommendations.map(r => `<li>${r}</li>`).join('');
  }
}

// Parse price string to number
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.toString().match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return null;
}

// Save current scan to history
async function saveCurrentScan() {
  const resultsSection = document.getElementById('listingResults');
  if (!resultsSection?.dataset?.result) return;
  
  try {
    const result = JSON.parse(resultsSection.dataset.result);
    const storage = await chrome.storage.local.get('lg_scan_history');
    let history = storage.lg_scan_history || [];
    
    history.unshift(result);
    if (history.length > 50) history = history.slice(0, 50);
    
    await chrome.storage.local.set({ lg_scan_history: history });
    
    // Update button
    const btn = document.getElementById('saveToHistory');
    if (btn) {
      btn.innerHTML = '<span>✓</span> Saved!';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.innerHTML = '<span>💾</span> Save';
        btn.disabled = false;
      }, 2000);
    }
    
    loadHistory();
  } catch (e) {
    console.error('[LandGuard AI] Error saving:', e);
  }
}

// Load history
async function loadHistory() {
  try {
    const storage = await chrome.storage.local.get('lg_scan_history');
    const history = storage.lg_scan_history || [];
    const historyList = document.getElementById('historyList');
    
    if (!historyList) return;
    
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <span class="empty-text">No scans yet</span>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = history.slice(0, 20).map(item => {
      const date = new Date(item.timestamp);
      const riskClass = item.riskLevel || (item.score >= 60 ? 'high' : item.score >= 30 ? 'medium' : 'low');
      const url = item.url || 'Unknown URL';
      
      return `
        <div class="history-item" data-url="${url}">
          <div class="history-info">
            <div class="history-url">${url.length > 40 ? url.substring(0, 40) + '...' : url}</div>
            <div class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
          </div>
          <div class="history-score">
            <span class="history-score-value ${riskClass}">${item.score}</span>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (e) {
    console.error('[LandGuard AI] Error loading history:', e);
  }
}

// Clear history
async function clearHistoryFn() {
  if (confirm('Clear all scan history?')) {
    await chrome.storage.local.set({ lg_scan_history: [] });
    loadHistory();
  }
}

// Update credits display
async function updateCreditsDisplay(credits) {
  const display = document.getElementById('creditsDisplay');
  if (!display) return;
  
  if (settings.tier === 'pro') {
    display.textContent = '∞ Unlimited';
    return;
  }
  
  if (credits !== undefined) {
    display.textContent = credits === -1 ? '∞ Unlimited' : `${credits} credits`;
    return;
  }
  
  // For free users, show scan usage
  display.textContent = `${scanUsage.remaining}/${scanUsage.limit} scans`;
}

// Make exportReport available globally
window.exportReport = exportReport;
