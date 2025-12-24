/**
 * LandGuard AI - Shared Constants
 * Brand colors and configuration
 */

const LANDGUARD_COLORS = {
  primaryBlue: "#0A5CFF",
  secondaryGreen: "#2ECC71",
  dangerRed: "#E74C3C",
  warningAmber: "#F39C12",
  safeGreen: "#27AE60",
  darkBg: "#0B1220",
  lightBg: "#F5F7FA",
  silverText: "#C9D1D9"
};

const BRAND = {
  name: "LandGuard AI",
  version: "1.0.0",
  tagline: "LandGuard AI protects buyers from land and property scams before money changes hands.",
  disclaimer: "This is a risk analysis tool, not legal advice or ownership verification."
};

const STORAGE_KEYS = {
  scanHistory: "lg_scan_history",
  settings: "lg_settings"
};

const MAX_HISTORY_ITEMS = 50;

const SUPPORTED_SITES = {
  facebook: {
    name: "Facebook Marketplace",
    pattern: /facebook\.com\/marketplace/i,
    enabled: true
  },
  kijiji: {
    name: "Kijiji",
    pattern: /kijiji\.ca/i,
    enabled: true
  },
  craigslist: {
    name: "Craigslist",
    pattern: /craigslist\.org/i,
    enabled: true
  }
};

const DEFAULT_SETTINGS = {
  autoScan: true,
  showBannerOnAllPages: false
};
