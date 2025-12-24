/**
 * LandGuard AI - Popup Script
 * Handles manual scans and displays results
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const currentUrlEl = document.getElementById('currentUrl');
  const sellerPhoneEl = document.getElementById('sellerPhone');
  const sellerEmailEl = document.getElementById('sellerEmail');
  const agentNameEl = document.getElementById('agentName');
  const scanBtn = document.getElementById('scanBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const resultsSection = document.getElementById('resultsSection');
  const scoreRing = document.getElementById('scoreRing');
  const scoreValue = document.getElementById('scoreValue');
  const riskPill = document.getElementById('riskPill');
  const flagsList = document.getElementById('flagsList');
  const recommendationsList = document.getElementById('recommendationsList');
  const explanationText = document.getElementById('explanationText');
  const saveBtn = document.getElementById('saveBtn');
  const flagsContainer = document.getElementById('flagsContainer');
  
  let currentTab = null;
  let lastScanResult = null;
  
  // ========== RISK ENGINE (Inline for popup) ==========
  
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
  
  function analyzeText(text) {
    const flags = [];
    const lowerText = text.toLowerCase();
    
    // Check urgency language
    let urgencyCount = 0;
    URGENCY_PATTERNS.forEach(pattern => {
      if (pattern.test(lowerText)) urgencyCount++;
    });
    if (urgencyCount > 0) {
      flags.push({
        category: "Urgency Language",
        description: `${urgencyCount} pressure tactic${urgencyCount > 1 ? 's' : ''} detected (urgent, wire transfer, etc.)`,
        weight: Math.min(urgencyCount * 8, 30)
      });
    }
    
    // Check suspicious contact patterns
    let contactFlags = 0;
    SUSPICIOUS_CONTACT_PATTERNS.forEach(pattern => {
      if (pattern.test(lowerText)) contactFlags++;
    });
    if (contactFlags > 0) {
      flags.push({
        category: "Suspicious Contact Method",
        description: "Seller prefers unusual contact methods (WhatsApp only, overseas, etc.)",
        weight: contactFlags * 10
      });
    }
    
    // Check generic language
    let genericCount = 0;
    GENERIC_PATTERNS.forEach(pattern => {
      if (pattern.test(lowerText)) genericCount++;
    });
    if (genericCount >= 2) {
      flags.push({
        category: "Generic Template Language",
        description: "Listing uses vague, templated phrases common in scam listings",
        weight: 12
      });
    }
    
    // Check suspicious seller claims
    let claimCount = 0;
    SUSPICIOUS_CLAIMS.forEach(pattern => {
      if (pattern.test(lowerText)) claimCount++;
    });
    if (claimCount > 0) {
      flags.push({
        category: "Suspicious Seller Claims",
        description: "Unusual claims detected (owner financing, no credit check, etc.)",
        weight: claimCount * 8
      });
    }
    
    // Payment method red flags
    if (/wire|western union|moneygram|gift card|bitcoin|crypto|zelle|venmo/i.test(lowerText)) {
      flags.push({
        category: "Risky Payment Method",
        description: "Seller requests untraceable payment method",
        weight: 25
      });
    }
    
    // Overseas seller
    if (/overseas|abroad|out of country|international|traveling|can't meet/i.test(lowerText)) {
      flags.push({
        category: "Remote Seller",
        description: "Seller claims to be overseas or unable to meet",
        weight: 18
      });
    }
    
    // Deposit requests
    if (/deposit|advance|upfront|before viewing|to hold|secure it/i.test(lowerText)) {
      flags.push({
        category: "Advance Payment Request",
        description: "Deposit or advance payment requested before viewing",
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
    
    if (categories.includes("Risky Payment Method")) {
      recommendations.push("💳 Only use traceable payment methods with buyer protection");
    }
    if (categories.includes("Remote Seller")) {
      recommendations.push("🤝 Insist on meeting seller in person before any transaction");
    }
    if (categories.includes("Advance Payment Request")) {
      recommendations.push("🚨 Never pay deposits before viewing property and verifying ownership");
    }
    
    if (riskLevel === "low") {
      recommendations.push("✅ Listing appears legitimate, but always verify ownership independently");
      recommendations.push("📋 Use a licensed real estate agent or attorney for the transaction");
    }
    
    return [...new Set(recommendations)];
  }
  
  function generateExplanation(score, riskLevel, flags) {
    if (riskLevel === "high") {
      return `This listing has a HIGH risk score of ${score}/100. Multiple red flags were detected including ${flags.slice(0, 2).map(f => f.category.toLowerCase()).join(' and ')}. We strongly recommend NOT proceeding with this listing without thorough verification.`;
    }
    if (riskLevel === "medium") {
      return `This listing has a MEDIUM risk score of ${score}/100. Some concerning patterns were detected. Proceed with caution and verify all claims independently before making any payments.`;
    }
    return `This listing has a LOW risk score of ${score}/100. No major red flags were detected, but always verify property ownership and seller identity before any transaction.`;
  }
  
  // ========== UI FUNCTIONS ==========
  
  // Get current tab
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
  
  // Initialize
  async function init() {
    currentTab = await getCurrentTab();
    if (currentTab?.url) {
      currentUrlEl.textContent = currentTab.url;
    } else {
      currentUrlEl.textContent = 'Unable to get current page URL';
    }
  }
  
  // Run scan
  async function runScan() {
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<div class="spinner"></div> Scanning...';
    
    try {
      // Try to get page content from content script
      let pageText = '';
      
      try {
        const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getPageText' });
        if (response?.text) {
          pageText = response.text;
        }
      } catch (e) {
        // Content script not available, use URL analysis only
        console.log('Content script not available, using URL analysis');
      }
      
      // Add seller info to analysis
      const sellerInfo = [
        sellerPhoneEl.value,
        sellerEmailEl.value,
        agentNameEl.value
      ].filter(Boolean).join(' ');
      
      const fullText = `${currentTab.url} ${pageText} ${sellerInfo}`;
      
      // Analyze
      const flags = analyzeText(fullText);
      const score = calculateScore(flags);
      const riskLevel = getRiskLevel(score);
      const recommendations = generateRecommendations(flags, riskLevel);
      const explanation = generateExplanation(score, riskLevel, flags);
      
      lastScanResult = {
        url: currentTab.url,
        timestamp: Date.now(),
        score,
        riskLevel,
        flags: flags.map(f => `${f.category}: ${f.description}`),
        recommendations,
        sellerInfo: {
          phone: sellerPhoneEl.value || undefined,
          email: sellerEmailEl.value || undefined,
          agent: agentNameEl.value || undefined
        }
      };
      
      // Display results
      displayResults(score, riskLevel, flags, recommendations, explanation);
      
    } catch (error) {
      console.error('Scan error:', error);
      alert('Error scanning page. Please try again.');
    } finally {
      scanBtn.disabled = false;
      scanBtn.innerHTML = '<span class="scan-btn-icon">🔍</span><span class="scan-btn-text">Scan Listing</span>';
    }
  }
  
  // Display results
  function displayResults(score, riskLevel, flags, recommendations, explanation) {
    resultsSection.style.display = 'block';
    
    // Update score
    scoreRing.className = `score-ring ${riskLevel}`;
    scoreValue.textContent = score;
    
    // Update risk pill
    riskPill.className = `risk-pill ${riskLevel}`;
    const riskLabels = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK' };
    riskPill.textContent = riskLabels[riskLevel];
    
    // Update flags
    if (flags.length > 0) {
      flagsContainer.style.display = 'block';
      flagsList.innerHTML = flags.map(flag => 
        `<li>🚩 <strong>${flag.category}:</strong> ${flag.description}</li>`
      ).join('');
    } else {
      flagsContainer.style.display = 'none';
      flagsList.innerHTML = '<li class="no-flags">✅ No major red flags detected</li>';
    }
    
    // Update recommendations
    recommendationsList.innerHTML = recommendations.map(rec => 
      `<li>${rec}</li>`
    ).join('');
    
    // Update explanation
    explanationText.textContent = explanation;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Save scan
  async function saveScan() {
    if (!lastScanResult) return;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '💾 Saving...';
    
    try {
      const result = await chrome.storage.local.get(['lg_scan_history']);
      const history = result.lg_scan_history || [];
      
      history.unshift(lastScanResult);
      const trimmed = history.slice(0, 50);
      
      await chrome.storage.local.set({ lg_scan_history: trimmed });
      
      saveBtn.innerHTML = '✅ Saved!';
      setTimeout(() => {
        saveBtn.innerHTML = '<span>💾</span> Save Scan to History';
        saveBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Save error:', error);
      saveBtn.innerHTML = '❌ Error';
      setTimeout(() => {
        saveBtn.innerHTML = '<span>💾</span> Save Scan to History';
        saveBtn.disabled = false;
      }, 2000);
    }
  }
  
  // Event listeners
  scanBtn.addEventListener('click', runScan);
  saveBtn.addEventListener('click', saveScan);
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Initialize
  init();
});
