/**
 * LandGuard AI - Shared Constants
 * Brand colors and configuration
 */

export const LANDGUARD_COLORS = {
  primaryBlue: "#0A5CFF",      // Brand / security
  secondaryGreen: "#2ECC71",   // Land / verification
  dangerRed: "#E74C3C",        // High risk
  warningAmber: "#F39C12",     // Medium risk
  safeGreen: "#27AE60",        // Low risk
  darkBg: "#0B1220",           // Banner background
  lightBg: "#F5F7FA",          // Cards / panels
  silverText: "#C9D1D9"        // Logo-matching silver text
};

export const BRAND = {
  name: "LandGuard AI",
  version: "1.0.0",
  tagline: "LandGuard AI protects buyers from land and property scams before money changes hands.",
  disclaimer: "This is a risk analysis tool, not legal advice or ownership verification."
};

export const STORAGE_KEYS = {
  scanHistory: "lg_scan_history",
  settings: "lg_settings"
};

export const MAX_HISTORY_ITEMS = 50;

export const SUPPORTED_SITES = {
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

export const DEFAULT_SETTINGS = {
  autoScan: true,
  showBannerOnAllPages: false
};

export type RiskLevel = "low" | "medium" | "high";

export interface ScanResult {
  url: string;
  timestamp: number;
  score: number;
  riskLevel: RiskLevel;
  flags: string[];
  recommendations: string[];
  sellerInfo?: {
    phone?: string;
    email?: string;
    agent?: string;
  };
}

export interface Settings {
  autoScan: boolean;
  showBannerOnAllPages: boolean;
}

