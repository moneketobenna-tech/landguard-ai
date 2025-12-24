/**
 * LandGuard AI - Storage Utilities
 * Manages scan history and settings with chrome.storage.local
 */

import { STORAGE_KEYS, MAX_HISTORY_ITEMS, DEFAULT_SETTINGS, ScanResult, Settings } from './constants';

/**
 * Get scan history
 */
export async function getScanHistory(): Promise<ScanResult[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.scanHistory], (result) => {
      resolve(result[STORAGE_KEYS.scanHistory] || []);
    });
  });
}

/**
 * Save scan to history (FIFO - max 50 items)
 */
export async function saveScan(scan: ScanResult): Promise<void> {
  const history = await getScanHistory();
  
  // Add new scan to beginning
  history.unshift(scan);
  
  // Keep only last MAX_HISTORY_ITEMS
  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.scanHistory]: trimmedHistory }, resolve);
  });
}

/**
 * Clear all scan history
 */
export async function clearHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEYS.scanHistory], resolve);
  });
}

/**
 * Get settings
 */
export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.settings], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.settings] });
    });
  });
}

/**
 * Save settings
 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.settings]: updated }, resolve);
  });
}

/**
 * Delete a specific scan from history by URL and timestamp
 */
export async function deleteScan(url: string, timestamp: number): Promise<void> {
  const history = await getScanHistory();
  const filtered = history.filter(scan => !(scan.url === url && scan.timestamp === timestamp));
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.scanHistory]: filtered }, resolve);
  });
}

