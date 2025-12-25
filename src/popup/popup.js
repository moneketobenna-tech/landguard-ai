/**
 * LandGuard AI v2.0 - Popup Script
 * Enhanced Property Scam Detection with API Integration
 */

// Constants
const API_BASE = 'https://landguardai.co/api/v1';
const VERSION = '2.0.0';

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
  autoScan: true
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadCurrentTab();
  setupEventListeners();
  setupTabs();
  loadHistory();
  updateCreditsDisplay();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['lg_settings', 'lg_api_key']);
    if (result.lg_settings) {
      settings = { ...settings, ...result.lg_settings };
    }
    if (result.lg_api_key) {
      settings.apiKey = result.lg_api_key;
    }
    
    // Update tier badge
    const tierBadge = document.getElementById('tierBadge');
    if (settings.tier === 'pro') {
      tierBadge.textContent = 'PRO';
      tierBadge.classList.add('pro');
    } else {
      tierBadge.textContent = 'FREE';
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
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
      urlDisplay.textContent = tab.url.length > 80 
        ? tab.url.substring(0, 80) + '...' 
        : tab.url;
      
      // Check if supported site
      const supportedSite = SUPPORTED_SITES.find(site => 
        url.hostname.includes(site.hostname)
      );
      
      if (supportedSite) {
        siteBadge.innerHTML = `${supportedSite.icon} ${supportedSite.name}`;
        siteBadge.classList.remove('unsupported');
      } else {
        siteBadge.innerHTML = '⚠️ Unknown Site';
        siteBadge.classList.add('unsupported');
      }
    }
  } catch (e) {
    console.error('Error loading tab:', e);
    document.getElementById('currentUrl').textContent = 'Unable to detect URL';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Scan buttons
  document.getElementById('scanListingBtn').addEventListener('click', scanListing);
  document.getElementById('scanSellerBtn').addEventListener('click', scanSeller);
  
  // Toggle details
  document.getElementById('toggleDetails').addEventListener('click', () => {
    const section = document.getElementById('detailsSection');
    const toggle = document.getElementById('toggleDetails');
    section.classList.toggle('open');
    toggle.querySelector('span').textContent = section.classList.contains('open') 
      ? '➖ Hide Listing Details' 
      : '➕ Add Listing Details (Optional)';
  });
  
  // Settings link
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Result actions
  document.getElementById('saveToHistory')?.addEventListener('click', saveCurrentScan);
  document.getElementById('clearHistory')?.addEventListener('click', clearHistory);
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
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// Scan Listing
async function scanListing() {
  const btn = document.getElementById('scanListingBtn');
  const resultsSection = document.getElementById('listingResults');
  const useApi = document.getElementById('useApi').checked;
  
  // Update button state
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>Analyzing...</span>';
  
  try {
    // Gather listing data
    const listingData = {
      url: currentTab?.url || '',
      title: document.getElementById('listingTitle').value.trim(),
      description: document.getElementById('listingDesc').value.trim(),
      price: parsePrice(document.getElementById('listingPrice').value),
      location: document.getElementById('listingLocation').value.trim()
    };
    
    // Try to get page data from content script
    try {
      const pageData = await chrome.tabs.sendMessage(currentTab.id, { action: 'getPageData' });
      if (pageData) {
        listingData.title = listingData.title || pageData.title;
        listingData.description = listingData.description || pageData.description;
        listingData.price = listingData.price || parsePrice(pageData.price);
      }
    } catch (e) {
      console.log('Content script not available');
    }
    
    let result;
    
    if (useApi && settings.apiKey) {
      // Use API for scanning
      result = await scanListingAPI(listingData);
    } else {
      // Use local scanning
      result = scanListingLocal(listingData);
    }
    
    // Display results
    displayListingResults(result);
    resultsSection.style.display = 'block';
    
    // Store for saving
    resultsSection.dataset.result = JSON.stringify({
      ...result,
      url: listingData.url,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    alert('Error scanning listing. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Scan Listing</span>';
  }
}

// Scan Listing via API
async function scanListingAPI(data) {
  const response = await fetch(`${API_BASE}/scan-listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || 'API error');
  }
  
  // Update credits display
  if (json.meta?.creditsRemaining !== undefined) {
    updateCreditsDisplay(json.meta.creditsRemaining);
  }
  
  return json.data;
}

// Local Listing Scan (Fallback)
function scanListingLocal(data) {
  let score = 0;
  const flags = [];
  const recommendations = [];
  
  const text = `${data.title} ${data.description} ${data.location}`.toLowerCase();
  
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
  
  urgencyPatterns.forEach(({ pattern, weight, text }) => {
    if (pattern.test(text)) {
      score += weight;
      flags.push({ 
        severity: weight >= 20 ? 'high' : 'medium', 
        description: text 
      });
    }
  });
  
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
  
  return {
    scanId: `local_${Date.now()}`,
    score,
    riskLevel,
    flags,
    recommendations,
    metadata: {
      scannedAt: new Date().toISOString(),
      apiVersion: 'local'
    }
  };
}

// Display Listing Results
function displayListingResults(result) {
  const { score, riskLevel, flags, recommendations } = result;
  
  // Score circle
  const scoreCircle = document.getElementById('scoreCircle');
  const scoreValue = document.getElementById('scoreValue');
  scoreCircle.className = `score-circle ${riskLevel}`;
  scoreValue.textContent = score;
  
  // Risk badge
  const riskBadge = document.getElementById('riskBadge');
  const riskLabels = {
    safe: '✅ Safe',
    low: '✓ Low Risk',
    medium: '⚠️ Medium Risk',
    high: '🚨 High Risk',
    critical: '⛔ Critical Risk'
  };
  riskBadge.textContent = riskLabels[riskLevel] || riskLevel;
  riskBadge.className = `risk-badge ${riskLevel}`;
  
  // Scan time
  document.getElementById('scanTime').textContent = 
    `Scanned ${new Date().toLocaleTimeString()}`;
  
  // Flags
  const flagsList = document.getElementById('flagsList');
  const flagsCount = document.getElementById('flagsCount');
  flagsCount.textContent = flags.length;
  
  flagsList.innerHTML = flags.length > 0 
    ? flags.map(flag => `
        <li class="${flag.severity || 'medium'}">
          <span class="flag-icon">${flag.severity === 'high' ? '🚨' : '⚠️'}</span>
          <span>${flag.description}</span>
        </li>
      `).join('')
    : '<li class="low"><span class="flag-icon">✅</span><span>No significant red flags detected</span></li>';
  
  // Recommendations
  const recList = document.getElementById('recommendationsList');
  recList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
}

// Scan Seller
async function scanSeller() {
  const btn = document.getElementById('scanSellerBtn');
  const resultsSection = document.getElementById('sellerResults');
  
  // Gather seller data
  const sellerData = {
    name: document.getElementById('sellerName').value.trim(),
    email: document.getElementById('sellerEmail').value.trim(),
    phone: document.getElementById('sellerPhone').value.trim(),
    profileUrl: document.getElementById('sellerProfile').value.trim()
  };
  
  // Validate at least one field
  if (!sellerData.name && !sellerData.email && !sellerData.phone && !sellerData.profileUrl) {
    alert('Please enter at least one seller detail');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>Verifying...</span>';
  
  try {
    let result;
    
    if (settings.apiKey) {
      // Use API
      const response = await fetch(`${API_BASE}/scan-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(sellerData)
      });
      
      const json = await response.json();
      if (json.success) {
        result = json.data;
        if (json.meta?.creditsRemaining !== undefined) {
          updateCreditsDisplay(json.meta.creditsRemaining);
        }
      } else {
        throw new Error(json.error?.message || 'API error');
      }
    } else {
      // Local scan
      result = scanSellerLocal(sellerData);
    }
    
    displaySellerResults(result);
    resultsSection.style.display = 'block';
    
  } catch (error) {
    console.error('Seller scan error:', error);
    alert('Error verifying seller. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">👤</span><span class="btn-text">Verify Seller</span>';
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
  scoreCircle.className = `score-circle ${riskLevel}`;
  scoreValue.textContent = score;
  
  const riskBadge = document.getElementById('sellerRiskBadge');
  const riskLabels = {
    safe: '✅ Verified',
    low: '✓ Low Risk',
    medium: '⚠️ Caution',
    high: '🚨 High Risk'
  };
  riskBadge.textContent = riskLabels[riskLevel] || riskLevel;
  riskBadge.className = `risk-badge ${riskLevel}`;
  
  const flagsList = document.getElementById('sellerFlagsList');
  flagsList.innerHTML = flags.length > 0
    ? flags.map(f => `
        <li class="${f.severity}">
          <span class="flag-icon">${f.severity === 'high' ? '🚨' : '⚠️'}</span>
          <span>${f.description}</span>
        </li>
      `).join('')
    : '<li class="low"><span class="flag-icon">✅</span><span>No red flags found</span></li>';
  
  const recList = document.getElementById('sellerRecommendationsList');
  recList.innerHTML = recommendations.map(r => `<li>${r}</li>`).join('');
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
  if (!resultsSection.dataset.result) return;
  
  try {
    const result = JSON.parse(resultsSection.dataset.result);
    const storage = await chrome.storage.local.get('lg_scan_history');
    let history = storage.lg_scan_history || [];
    
    history.unshift(result);
    if (history.length > 50) history = history.slice(0, 50);
    
    await chrome.storage.local.set({ lg_scan_history: history });
    
    // Update button
    const btn = document.getElementById('saveToHistory');
    btn.innerHTML = '<span>✓</span> Saved!';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = '<span>💾</span> Save';
      btn.disabled = false;
    }, 2000);
    
    loadHistory();
  } catch (e) {
    console.error('Error saving:', e);
  }
}

// Load history
async function loadHistory() {
  try {
    const storage = await chrome.storage.local.get('lg_scan_history');
    const history = storage.lg_scan_history || [];
    const historyList = document.getElementById('historyList');
    
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
    console.error('Error loading history:', e);
  }
}

// Clear history
async function clearHistory() {
  if (confirm('Clear all scan history?')) {
    await chrome.storage.local.set({ lg_scan_history: [] });
    loadHistory();
  }
}

// Update credits display
async function updateCreditsDisplay(credits) {
  const display = document.getElementById('creditsDisplay');
  
  if (credits !== undefined) {
    display.textContent = credits === -1 ? '∞ Unlimited' : `${credits} credits`;
    return;
  }
  
  if (settings.apiKey) {
    try {
      const response = await fetch(`${API_BASE}/usage`, {
        headers: { 'Authorization': `Bearer ${settings.apiKey}` }
      });
      const json = await response.json();
      if (json.success && json.data?.usage) {
        const remaining = json.data.usage.remaining;
        display.textContent = remaining === 'Unlimited' ? '∞ Unlimited' : `${remaining} credits`;
      }
    } catch (e) {
      display.textContent = 'Credits: -';
    }
  } else {
    display.textContent = 'Free mode (limited)';
  }
}
