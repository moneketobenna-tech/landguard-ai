// LandGuard AI - Options Page Script

// DOM Elements
const elements = {
  autoScanToggle: document.getElementById('autoScanToggle'),
  showBannerToggle: document.getElementById('showBannerToggle'),
  notificationsToggle: document.getElementById('notificationsToggle'),
  historyCount: document.getElementById('historyCount'),
  historyEmpty: document.getElementById('historyEmpty'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadHistory();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get('landguard_settings');
  const settings = result.landguard_settings || {
    autoScan: true,
    showBannerOnAllPages: false,
    notifications: true
  };

  elements.autoScanToggle.checked = settings.autoScan;
  elements.showBannerToggle.checked = settings.showBannerOnAllPages;
  elements.notificationsToggle.checked = settings.notifications !== false;
}

// Save settings
async function saveSettings() {
  const settings = {
    autoScan: elements.autoScanToggle.checked,
    showBannerOnAllPages: elements.showBannerToggle.checked,
    notifications: elements.notificationsToggle.checked
  };

  await chrome.storage.local.set({ landguard_settings: settings });
}

// Load scan history
async function loadHistory() {
  const result = await chrome.storage.local.get('landguard_scan_history');
  const history = result.landguard_scan_history || [];

  // Update count
  elements.historyCount.textContent = `${history.length} scan${history.length !== 1 ? 's' : ''} saved`;

  if (history.length === 0) {
    elements.historyEmpty.style.display = 'block';
    elements.historyList.style.display = 'none';
    return;
  }

  elements.historyEmpty.style.display = 'none';
  elements.historyList.style.display = 'flex';
  elements.historyList.innerHTML = '';

  history.forEach((scan, index) => {
    const item = createHistoryItem(scan, index);
    elements.historyList.appendChild(item);
  });
}

// Create history item element
function createHistoryItem(scan, index) {
  const item = document.createElement('div');
  const riskClass = scan.riskLevel.toLowerCase();
  item.className = `history-item risk-${riskClass}`;

  // Format URL for display
  let displayUrl = scan.url;
  try {
    const url = new URL(scan.url);
    displayUrl = url.hostname + url.pathname.substring(0, 30) + (url.pathname.length > 30 ? '...' : '');
  } catch (e) {}

  // Format time
  const scanDate = new Date(scan.scannedAt);
  const timeAgo = getTimeAgo(scanDate);

  // Risk labels
  const riskLabels = {
    'low': 'Low Risk',
    'medium': 'Medium Risk',
    'high': 'High Risk'
  };

  item.innerHTML = `
    <div class="history-item-header">
      <div class="history-item-url" title="${scan.url}">${displayUrl}</div>
      <div class="history-item-score">
        <span class="history-score-value ${riskClass}">${scan.score}</span>
        <span class="history-risk-pill ${riskClass}">${riskLabels[riskClass]}</span>
      </div>
    </div>
    <div class="history-item-meta">
      <span class="history-item-time">🕐 ${timeAgo}</span>
      <span class="history-item-flags">🚩 ${scan.flags?.length || 0} flags</span>
    </div>
  `;

  return item;
}

// Get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

// Clear history
async function clearHistory() {
  if (!confirm('Are you sure you want to clear all scan history? This cannot be undone.')) {
    return;
  }

  await chrome.storage.local.remove('landguard_scan_history');
  await loadHistory();
}

// Setup event listeners
function setupEventListeners() {
  elements.autoScanToggle.addEventListener('change', saveSettings);
  elements.showBannerToggle.addEventListener('change', saveSettings);
  elements.notificationsToggle.addEventListener('change', saveSettings);
  elements.clearHistoryBtn.addEventListener('click', clearHistory);
}
