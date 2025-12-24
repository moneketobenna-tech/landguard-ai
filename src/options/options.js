/**
 * LandGuard AI - Options Page Script
 * Manages settings and scan history
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const autoScanEl = document.getElementById('autoScan');
  const showBannerAllEl = document.getElementById('showBannerAll');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyStats = document.getElementById('historyStats');
  const historyList = document.getElementById('historyList');
  
  // Load settings
  async function loadSettings() {
    const result = await chrome.storage.local.get(['lg_settings']);
    const settings = result.lg_settings || { autoScan: true, showBannerOnAllPages: false };
    
    autoScanEl.checked = settings.autoScan;
    showBannerAllEl.checked = settings.showBannerOnAllPages;
  }
  
  // Save settings
  async function saveSettings() {
    const settings = {
      autoScan: autoScanEl.checked,
      showBannerOnAllPages: showBannerAllEl.checked
    };
    
    await chrome.storage.local.set({ lg_settings: settings });
  }
  
  // Load scan history
  async function loadHistory() {
    const result = await chrome.storage.local.get(['lg_scan_history']);
    const history = result.lg_scan_history || [];
    
    // Update stats
    const highRisk = history.filter(s => s.riskLevel === 'high').length;
    const mediumRisk = history.filter(s => s.riskLevel === 'medium').length;
    const lowRisk = history.filter(s => s.riskLevel === 'low').length;
    
    historyStats.innerHTML = `
      📊 <strong>${history.length}</strong> total scans • 
      <span style="color: #E74C3C">🔴 ${highRisk} high risk</span> • 
      <span style="color: #F39C12">🟡 ${mediumRisk} medium</span> • 
      <span style="color: #27AE60">🟢 ${lowRisk} low</span>
    `;
    
    // Render history items
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <div class="history-empty-icon">📋</div>
          <p>No scans yet. Visit a listing on Facebook Marketplace, Kijiji, or Craigslist to start scanning.</p>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = history.map((scan, index) => {
      const date = new Date(scan.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const riskLabels = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' };
      
      // Truncate URL for display
      const displayUrl = scan.url.length > 60 ? scan.url.substring(0, 60) + '...' : scan.url;
      
      return `
        <div class="history-item ${scan.riskLevel}" data-index="${index}">
          <div class="history-item-info">
            <div class="history-item-url" title="${scan.url}">${displayUrl}</div>
            <div class="history-item-meta">
              <span class="history-item-score ${scan.riskLevel}">${scan.score}/100 ${riskLabels[scan.riskLevel]}</span>
              <span>📅 ${dateStr} at ${timeStr}</span>
              ${scan.flags?.length > 0 ? `<span>🚩 ${scan.flags.length} flags</span>` : ''}
            </div>
          </div>
          <button class="history-item-delete" data-index="${index}" title="Delete scan">🗑️</button>
        </div>
      `;
    }).join('');
    
    // Attach delete handlers
    document.querySelectorAll('.history-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.target.dataset.index);
        await deleteScan(index);
      });
    });
  }
  
  // Delete single scan
  async function deleteScan(index) {
    const result = await chrome.storage.local.get(['lg_scan_history']);
    const history = result.lg_scan_history || [];
    
    history.splice(index, 1);
    
    await chrome.storage.local.set({ lg_scan_history: history });
    loadHistory();
  }
  
  // Clear all history
  async function clearHistory() {
    if (!confirm('Are you sure you want to clear all scan history? This cannot be undone.')) {
      return;
    }
    
    await chrome.storage.local.remove(['lg_scan_history']);
    loadHistory();
  }
  
  // Event listeners
  autoScanEl.addEventListener('change', saveSettings);
  showBannerAllEl.addEventListener('change', saveSettings);
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Initialize
  await loadSettings();
  await loadHistory();
});
