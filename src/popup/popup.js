// LandGuard AI - Popup Script
// Professional Property Scam Detection

// Brand Constants
const BRAND = {
  name: 'LandGuard AI',
  version: '1.0.0',
  colors: {
    primaryBlue: '#0A5CFF',
    secondaryGreen: '#2ECC71',
    dangerRed: '#E74C3C',
    warningAmber: '#F39C12',
    safeGreen: '#27AE60'
  }
};

// Supported sites
const SUPPORTED_SITES = [
  { hostname: 'facebook.com', name: 'Facebook Marketplace', icon: '📘' },
  { hostname: 'kijiji.ca', name: 'Kijiji', icon: '🟢' },
  { hostname: 'craigslist.org', name: 'Craigslist', icon: '📋' }
];

// DOM Elements
const elements = {
  currentUrl: document.getElementById('currentUrl'),
  siteBadge: document.getElementById('siteBadge'),
  sellerPhone: document.getElementById('sellerPhone'),
  sellerEmail: document.getElementById('sellerEmail'),
  agentName: document.getElementById('agentName'),
  scanBtn: document.getElementById('scanBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  resultsSection: document.getElementById('resultsSection'),
  scoreValue: document.getElementById('scoreValue'),
  scorePercent: document.getElementById('scorePercent'),
  scoreBarFill: document.getElementById('scoreBarFill'),
  riskPill: document.getElementById('riskPill'),
  flagsList: document.getElementById('flagsList'),
  recommendationsList: document.getElementById('recommendationsList'),
  explanationText: document.getElementById('explanationText'),
  saveBtn: document.getElementById('saveBtn')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentTab();
  setupEventListeners();
});

// Load current tab URL
async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      elements.currentUrl.textContent = tab.url;
      elements.currentUrl.classList.remove('no-url');
      
      // Check if supported site
      const supportedSite = SUPPORTED_SITES.find(site => 
        url.hostname.includes(site.hostname)
      );
      
      if (supportedSite) {
        elements.siteBadge.innerHTML = `
          <span class="site-badge">
            ${supportedSite.icon} ${supportedSite.name} • Supported
          </span>
        `;
      } else {
        elements.siteBadge.innerHTML = `
          <span class="site-badge unsupported">
            ⚠️ Site not in auto-scan list
          </span>
        `;
      }
    } else {
      elements.currentUrl.textContent = 'No URL detected';
      elements.currentUrl.classList.add('no-url');
    }
  } catch (error) {
    console.error('Error loading tab:', error);
    elements.currentUrl.textContent = 'Unable to load URL';
    elements.currentUrl.classList.add('no-url');
  }
}

// Setup event listeners
function setupEventListeners() {
  elements.scanBtn.addEventListener('click', performScan);
  elements.saveBtn.addEventListener('click', saveScan);
  elements.settingsBtn.addEventListener('click', openSettings);
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Perform scan
async function performScan() {
  // Update button state
  elements.scanBtn.disabled = true;
  elements.scanBtn.innerHTML = `
    <span class="loading-spinner"></span>
    <span class="scan-btn-text">Analyzing...</span>
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get page content via content script
    let pageData = {};
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageData' });
      if (response) {
        pageData = response;
      }
    } catch (e) {
      console.log('Content script not available, using basic scan');
    }

    // Prepare scan input
    const scanInput = {
      url: tab.url || '',
      sellerPhone: elements.sellerPhone.value.trim(),
      sellerEmail: elements.sellerEmail.value.trim(),
      agentName: elements.agentName.value.trim(),
      listingTitle: pageData.title || '',
      listingDescription: pageData.description || '',
      listingPrice: pageData.price || '',
      listingImagesCount: pageData.imageCount || 0
    };

    // Perform local risk analysis
    const result = scanListing(scanInput);
    
    // Display results
    displayResults(result);

  } catch (error) {
    console.error('Scan error:', error);
    alert('Error performing scan. Please try again.');
  } finally {
    // Reset button
    elements.scanBtn.disabled = false;
    elements.scanBtn.innerHTML = `
      <span class="scan-btn-icon">🔍</span>
      <span class="scan-btn-text">Scan This Listing</span>
    `;
  }
}

// Local Risk Engine
function scanListing(input) {
  let score = 0;
  const flags = [];
  const recommendations = [];

  // --- Price Analysis ---
  if (input.listingPrice) {
    const priceMatch = input.listingPrice.match(/(\d[\d,\.]*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (price < 5000) {
        score += 25;
        flags.push({ text: 'Unrealistically low price detected', severity: 'high' });
        recommendations.push('Verify property value independently. Prices this low are often scam indicators.');
      } else if (price < 20000) {
        score += 12;
        flags.push({ text: 'Potentially suspicious pricing', severity: 'medium' });
        recommendations.push('Research comparable properties in the area to verify pricing.');
      }
    }
  } else {
    score += 8;
    flags.push({ text: 'No price information found', severity: 'low' });
  }

  // --- Urgency Language Detection ---
  const description = (input.listingTitle || '') + ' ' + (input.listingDescription || '');
  const urgencyPatterns = [
    { pattern: /urgent|urgently/i, weight: 15, text: 'Urgency language detected' },
    { pattern: /quick sale|fast sale/i, weight: 15, text: 'Pressure to sell quickly' },
    { pattern: /deposit today|immediate deposit/i, weight: 20, text: 'Immediate deposit requested' },
    { pattern: /wire transfer/i, weight: 25, text: 'Wire transfer mentioned' },
    { pattern: /gift card/i, weight: 30, text: 'Gift card payment requested' },
    { pattern: /act fast|act now|limited time/i, weight: 12, text: 'Time pressure tactics' },
    { pattern: /overseas|abroad|out of country/i, weight: 18, text: 'Seller claims to be overseas' },
    { pattern: /cannot meet|can\'t meet|unable to meet/i, weight: 15, text: 'Seller refuses in-person meeting' }
  ];

  urgencyPatterns.forEach(({ pattern, weight, text }) => {
    if (pattern.test(description)) {
      score += weight;
      flags.push({ text, severity: weight >= 20 ? 'high' : 'medium' });
    }
  });

  if (flags.some(f => f.text.includes('Wire transfer') || f.text.includes('Gift card'))) {
    recommendations.push('NEVER send money via wire transfer or gift cards. These payments are irreversible.');
  }

  if (flags.some(f => f.text.includes('overseas') || f.text.includes('meeting'))) {
    recommendations.push('Always meet sellers in person and visit the property before any payment.');
  }

  // --- Contact Pattern Analysis ---
  if (input.sellerPhone) {
    const phoneClean = input.sellerPhone.replace(/[\s\-\.\(\)]/g, '');
    if (!/^\+?\d{7,15}$/.test(phoneClean)) {
      score += 10;
      flags.push({ text: 'Suspicious phone number format', severity: 'medium' });
    }
  }

  if (input.sellerEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.sellerEmail)) {
      score += 10;
      flags.push({ text: 'Invalid email format', severity: 'medium' });
    }
    if (/temp|fake|trash|guerrilla/i.test(input.sellerEmail)) {
      score += 15;
      flags.push({ text: 'Temporary/disposable email detected', severity: 'high' });
    }
  }

  if (/whatsapp only|text only|sms only/i.test(description)) {
    score += 15;
    flags.push({ text: 'Communication restricted to messaging apps', severity: 'medium' });
    recommendations.push('Be cautious of sellers who avoid phone calls or official channels.');
  }

  // --- Image Analysis ---
  if (input.listingImagesCount !== undefined) {
    if (input.listingImagesCount === 0) {
      score += 20;
      flags.push({ text: 'No images provided', severity: 'high' });
      recommendations.push('Request multiple photos of the property from different angles.');
    } else if (input.listingImagesCount < 3) {
      score += 12;
      flags.push({ text: `Very few images (${input.listingImagesCount})`, severity: 'medium' });
    }
  }

  // --- Generic Phrasing Detection ---
  const genericPhrases = [
    /great opportunity/i,
    /investment property/i,
    /must see/i,
    /prime location/i,
    /won\'t last/i,
    /dream home/i
  ];
  
  const genericCount = genericPhrases.filter(p => p.test(description)).length;
  if (genericCount >= 3) {
    score += 8;
    flags.push({ text: 'Excessive generic marketing language', severity: 'low' });
  }

  // --- Cap score ---
  score = Math.min(100, Math.max(0, score));

  // --- Determine risk level ---
  let riskLevel;
  if (score >= 60) {
    riskLevel = 'HIGH';
  } else if (score >= 30) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // --- Default recommendations ---
  if (recommendations.length === 0) {
    if (riskLevel === 'LOW') {
      recommendations.push('This listing shows minimal red flags, but always verify independently.');
    }
    recommendations.push('Never send money without seeing the property in person.');
    recommendations.push('Verify ownership through official land registry records.');
  }

  return {
    score,
    riskLevel,
    flags,
    recommendations,
    scannedAt: Date.now(),
    url: input.url
  };
}

// Display results
function displayResults(result) {
  const { score, riskLevel, flags, recommendations } = result;

  // Show results section
  elements.resultsSection.style.display = 'block';

  // Update score
  const levelClass = riskLevel.toLowerCase();
  elements.scoreValue.textContent = score;
  elements.scoreValue.className = `score-value ${levelClass}`;

  // Update score bar
  elements.scorePercent.textContent = `${score}%`;
  elements.scoreBarFill.style.width = `${score}%`;
  elements.scoreBarFill.className = `score-bar-fill ${levelClass}`;

  // Update risk pill
  const riskLabels = {
    'LOW': '✓ Low Risk',
    'MEDIUM': '⚠️ Medium Risk',
    'HIGH': '🚨 High Risk'
  };
  elements.riskPill.textContent = riskLabels[riskLevel];
  elements.riskPill.className = `risk-pill ${levelClass}`;

  // Update flags
  elements.flagsList.innerHTML = '';
  if (flags.length > 0) {
    flags.forEach(flag => {
      const li = document.createElement('li');
      const iconClass = flag.severity === 'high' ? 'danger' : flag.severity === 'medium' ? 'warning' : 'safe';
      const icon = flag.severity === 'high' ? '🚨' : flag.severity === 'medium' ? '⚠️' : 'ℹ️';
      li.innerHTML = `<span class="flag-icon ${iconClass}">${icon}</span><span>${flag.text}</span>`;
      elements.flagsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<span class="flag-icon safe">✅</span><span>No significant red flags detected</span>';
    elements.flagsList.appendChild(li);
  }

  // Update recommendations
  elements.recommendationsList.innerHTML = '';
  recommendations.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    elements.recommendationsList.appendChild(li);
  });

  // Update explanation
  const explanations = {
    'LOW': 'This listing shows minimal suspicious patterns. However, always verify property ownership through official channels before making any payments.',
    'MEDIUM': 'This listing has some concerning elements that warrant caution. Thoroughly investigate before proceeding and never send money without proper verification.',
    'HIGH': 'This listing displays multiple high-risk indicators commonly associated with property scams. Exercise extreme caution and consider avoiding this listing entirely.'
  };
  elements.explanationText.textContent = explanations[riskLevel];

  // Store result for saving
  elements.saveBtn.dataset.result = JSON.stringify(result);

  // Scroll to results
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Save scan to history
async function saveScan() {
  try {
    const result = JSON.parse(elements.saveBtn.dataset.result);
    
    // Get existing history
    const storage = await chrome.storage.local.get('landguard_scan_history');
    let history = storage.landguard_scan_history || [];

    // Add new scan at the beginning
    history.unshift(result);

    // Keep max 50 scans
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    // Save
    await chrome.storage.local.set({ landguard_scan_history: history });

    // Update button
    elements.saveBtn.classList.add('saved');
    elements.saveBtn.innerHTML = '<span>✓</span> Saved to History';
    
    setTimeout(() => {
      elements.saveBtn.classList.remove('saved');
      elements.saveBtn.innerHTML = '<span>💾</span> Save Scan to History';
    }, 2000);

  } catch (error) {
    console.error('Error saving scan:', error);
    alert('Error saving scan. Please try again.');
  }
}
