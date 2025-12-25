/**
 * LandGuard AI v2.0 - Background Service Worker
 * Handles extension events, messaging, and API communication
 */

const VERSION = '2.0.0';
const API_BASE = 'https://landguardai.co/api/v1';

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`LandGuard AI v${VERSION}: ${details.reason}`);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      lg_settings: {
        autoScan: true,
        showBanner: true,
        darkMode: false,
        tier: 'free'
      },
      lg_scan_history: [],
      lg_api_key: ''
    });
    
    // Open options/welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/options.html')
    });
  } else if (details.reason === 'update') {
    // Show update notification
    console.log(`Updated from ${details.previousVersion} to ${VERSION}`);
    
    // Migrate settings if needed
    migrateSettings();
  }
});

// Migrate settings from v1.x
async function migrateSettings() {
  try {
    const storage = await chrome.storage.local.get([
      'lg_settings', 
      'landguard_settings',
      'landguard_scan_history'
    ]);
    
    // Migrate old keys
    if (storage.landguard_settings && !storage.lg_settings) {
      await chrome.storage.local.set({ lg_settings: storage.landguard_settings });
    }
    if (storage.landguard_scan_history && !storage.lg_scan_history) {
      await chrome.storage.local.set({ lg_scan_history: storage.landguard_scan_history });
    }
    
    // Clean up old keys
    await chrome.storage.local.remove(['landguard_settings', 'landguard_scan_history']);
    
  } catch (e) {
    console.error('Migration error:', e);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async
});

async function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'getSettings':
      const settingsResult = await chrome.storage.local.get(['lg_settings', 'lg_api_key']);
      sendResponse({
        settings: settingsResult.lg_settings || { autoScan: true, tier: 'free' },
        apiKey: settingsResult.lg_api_key || ''
      });
      break;
      
    case 'saveSettings':
      await chrome.storage.local.set({ lg_settings: message.settings });
      sendResponse({ success: true });
      break;
      
    case 'saveApiKey':
      await chrome.storage.local.set({ lg_api_key: message.apiKey });
      // Validate key
      if (message.apiKey) {
        const validation = await validateApiKey(message.apiKey);
        sendResponse(validation);
      } else {
        sendResponse({ success: true, tier: 'free' });
      }
      break;
      
    case 'saveScan':
      const historyResult = await chrome.storage.local.get('lg_scan_history');
      let history = historyResult.lg_scan_history || [];
      history.unshift(message.scan);
      if (history.length > 50) history = history.slice(0, 50);
      await chrome.storage.local.set({ lg_scan_history: history });
      sendResponse({ success: true });
      break;
      
    case 'getHistory':
      const histResult = await chrome.storage.local.get('lg_scan_history');
      sendResponse(histResult.lg_scan_history || []);
      break;
      
    case 'clearHistory':
      await chrome.storage.local.set({ lg_scan_history: [] });
      sendResponse({ success: true });
      break;
      
    case 'scanListingAPI':
      try {
        const apiKey = (await chrome.storage.local.get('lg_api_key')).lg_api_key;
        const result = await scanListingAPI(message.data, apiKey);
        sendResponse(result);
      } catch (e) {
        sendResponse({ error: e.message });
      }
      break;
      
    case 'scanSellerAPI':
      try {
        const apiKey = (await chrome.storage.local.get('lg_api_key')).lg_api_key;
        const result = await scanSellerAPI(message.data, apiKey);
        sendResponse(result);
      } catch (e) {
        sendResponse({ error: e.message });
      }
      break;
      
    case 'getUsage':
      try {
        const apiKey = (await chrome.storage.local.get('lg_api_key')).lg_api_key;
        if (apiKey) {
          const usage = await getApiUsage(apiKey);
          sendResponse(usage);
        } else {
          sendResponse({ error: 'No API key' });
        }
      } catch (e) {
        sendResponse({ error: e.message });
      }
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
}

// Validate API key
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${API_BASE}/usage`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const json = await response.json();
    
    if (json.success) {
      return {
        success: true,
        tier: json.data?.tier?.name?.toLowerCase() || 'free',
        usage: json.data?.usage
      };
    } else {
      return { success: false, error: json.error?.message || 'Invalid API key' };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Scan listing via API
async function scanListingAPI(data, apiKey) {
  if (!apiKey) {
    throw new Error('API key required');
  }
  
  const response = await fetch(`${API_BASE}/scan-listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || 'API error');
  }
  
  return json;
}

// Scan seller via API
async function scanSellerAPI(data, apiKey) {
  if (!apiKey) {
    throw new Error('API key required');
  }
  
  const response = await fetch(`${API_BASE}/scan-seller`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || 'API error');
  }
  
  return json;
}

// Get API usage
async function getApiUsage(apiKey) {
  const response = await fetch(`${API_BASE}/usage`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  return response.json();
}

// Log startup
console.log(`LandGuard AI v${VERSION}: Background service worker started`);
