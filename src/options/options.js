/**
 * LandGuard AI v2.0 - Options Page Script
 */

const API_BASE = 'https://landguardai.co/api/v1';

// State
let settings = {
  autoScan: true,
  showBanner: true,
  useApiScans: true,
  tier: 'free'
};
let apiKey = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  loadHistory();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['lg_settings', 'lg_api_key']);
    
    if (result.lg_settings) {
      settings = { ...settings, ...result.lg_settings };
    }
    
    if (result.lg_api_key) {
      apiKey = result.lg_api_key;
      document.getElementById('apiKeyInput').value = apiKey;
      await validateApiKey();
    }
    
    // Apply settings to UI
    document.getElementById('autoScan').checked = settings.autoScan;
    document.getElementById('showBanner').checked = settings.showBanner;
    document.getElementById('useApiScans').checked = settings.useApiScans;
    
    updateTierBadge(settings.tier);
    
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// Setup event listeners
function setupEventListeners() {
  // API Key save
  document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
  
  // Toggle API key visibility
  document.getElementById('toggleApiKey').addEventListener('click', () => {
    const input = document.getElementById('apiKeyInput');
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  
  // Settings toggles
  document.getElementById('autoScan').addEventListener('change', saveSettings);
  document.getElementById('showBanner').addEventListener('change', saveSettings);
  document.getElementById('useApiScans').addEventListener('change', saveSettings);
  
  // Clear history
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
}

// Save API key
async function saveApiKey() {
  const btn = document.getElementById('saveApiKey');
  const input = document.getElementById('apiKeyInput');
  const newKey = input.value.trim();
  
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Validating...';
  
  try {
    if (newKey) {
      // Validate key
      const response = await fetch(`${API_BASE}/usage`, {
        headers: {
          'Authorization': `Bearer ${newKey}`
        }
      });
      
      const json = await response.json();
      
      if (json.success) {
        apiKey = newKey;
        await chrome.storage.local.set({ lg_api_key: apiKey });
        
        showApiStatus(true, json.data);
        updateUsageStats(json.data.usage);
        updateTierBadge(json.data.tier?.name?.toLowerCase() || 'starter');
        
        btn.innerHTML = '<span>✓</span> Saved!';
      } else {
        showApiStatus(false, { error: json.error?.message || 'Invalid API key' });
        btn.innerHTML = '<span>❌</span> Invalid Key';
      }
    } else {
      // Clear key
      apiKey = '';
      await chrome.storage.local.set({ lg_api_key: '' });
      
      document.getElementById('apiStatus').style.display = 'none';
      document.getElementById('usageStats').style.display = 'none';
      updateTierBadge('free');
      
      btn.innerHTML = '<span>✓</span> Cleared';
    }
  } catch (e) {
    console.error('API key error:', e);
    showApiStatus(false, { error: e.message });
    btn.innerHTML = '<span>❌</span> Error';
  }
  
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span> Save API Key';
  }, 2000);
}

// Validate existing API key
async function validateApiKey() {
  if (!apiKey) return;
  
  try {
    const response = await fetch(`${API_BASE}/usage`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const json = await response.json();
    
    if (json.success) {
      showApiStatus(true, json.data);
      updateUsageStats(json.data.usage);
      updateTierBadge(json.data.tier?.name?.toLowerCase() || 'starter');
    } else {
      showApiStatus(false, { error: json.error?.message || 'API key invalid' });
    }
  } catch (e) {
    console.error('Validation error:', e);
  }
}

// Show API status
function showApiStatus(success, data) {
  const statusEl = document.getElementById('apiStatus');
  const iconEl = document.getElementById('apiStatusIcon');
  const titleEl = document.getElementById('apiStatusTitle');
  const descEl = document.getElementById('apiStatusDesc');
  
  statusEl.style.display = 'flex';
  
  if (success) {
    statusEl.classList.remove('error');
    iconEl.textContent = '✓';
    titleEl.textContent = 'API Connected';
    descEl.textContent = `${data.tier?.name || 'Unknown'} tier • ${data.usage?.remaining || 'Unknown'} credits remaining`;
  } else {
    statusEl.classList.add('error');
    iconEl.textContent = '✕';
    titleEl.textContent = 'Connection Failed';
    descEl.textContent = data.error || 'Unable to validate API key';
  }
}

// Update usage stats
function updateUsageStats(usage) {
  if (!usage) return;
  
  const statsEl = document.getElementById('usageStats');
  statsEl.style.display = 'flex';
  
  document.getElementById('creditsUsed').textContent = 
    typeof usage.currentMonth === 'number' ? usage.currentMonth.toLocaleString() : '-';
  
  document.getElementById('creditsRemaining').textContent = 
    usage.remaining === 'Unlimited' ? '∞' : 
    typeof usage.remaining === 'number' ? usage.remaining.toLocaleString() : '-';
  
  // Parse reset date
  const resetDate = document.getElementById('resetDate');
  if (usage.periodEnd) {
    const date = new Date(usage.periodEnd);
    resetDate.textContent = date.toLocaleDateString();
  } else {
    resetDate.textContent = '-';
  }
}

// Update tier badge
function updateTierBadge(tier) {
  const badge = document.getElementById('currentTier');
  badge.textContent = tier.toUpperCase();
  badge.className = `tier-badge ${tier}`;
  
  settings.tier = tier;
}

// Save settings
async function saveSettings() {
  settings.autoScan = document.getElementById('autoScan').checked;
  settings.showBanner = document.getElementById('showBanner').checked;
  settings.useApiScans = document.getElementById('useApiScans').checked;
  
  await chrome.storage.local.set({ lg_settings: settings });
  console.log('Settings saved:', settings);
}

// Load history
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get('lg_scan_history');
    const history = result.lg_scan_history || [];
    const listEl = document.getElementById('historyList');
    
    if (history.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <span class="empty-text">No scan history yet</span>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = history.slice(0, 20).map(item => {
      const date = new Date(item.timestamp);
      const score = item.score || 0;
      const riskClass = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
      const url = item.url || 'Unknown URL';
      
      return `
        <div class="history-item">
          <div>
            <div class="history-url">${truncateUrl(url, 50)}</div>
            <div class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
          </div>
          <span class="history-score ${riskClass}">${score}</span>
        </div>
      `;
    }).join('');
    
  } catch (e) {
    console.error('Error loading history:', e);
  }
}

// Clear history
async function clearHistory() {
  if (confirm('Are you sure you want to clear all scan history?')) {
    await chrome.storage.local.set({ lg_scan_history: [] });
    loadHistory();
  }
}

// Truncate URL
function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}
