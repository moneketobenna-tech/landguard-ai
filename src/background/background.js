/**
 * LandGuard AI - Background Service Worker
 * Handles extension events and messaging
 */

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('LandGuard AI installed/updated:', details.reason);
  
  // Set default settings on first install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      lg_settings: {
        autoScan: true,
        showBannerOnAllPages: false
      },
      lg_scan_history: []
    });
    
    // Open welcome/options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/options.html')
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    chrome.storage.local.get(['lg_settings'], (result) => {
      sendResponse(result.lg_settings || { autoScan: true, showBannerOnAllPages: false });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'saveScan') {
    chrome.storage.local.get(['lg_scan_history'], (result) => {
      const history = result.lg_scan_history || [];
      history.unshift(message.scan);
      const trimmed = history.slice(0, 50);
      chrome.storage.local.set({ lg_scan_history: trimmed }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (message.action === 'getHistory') {
    chrome.storage.local.get(['lg_scan_history'], (result) => {
      sendResponse(result.lg_scan_history || []);
    });
    return true;
  }
});

// Handle extension icon click when popup is not available
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if popup is defined, but keeping for safety
  console.log('Extension icon clicked on tab:', tab.url);
});

// Log when service worker starts
console.log('LandGuard AI v1.0: Background service worker started');
