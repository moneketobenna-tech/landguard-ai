/**
 * LandGuard AI - Local Heuristic Risk Engine
 * NO BACKEND / NO API - All analysis runs locally
 */

// Urgency language patterns
const URGENCY_PATTERNS = [
  /urgent/i,
  /quick sale/i,
  /must sell/i,
  /deposit today/i,
  /wire transfer/i,
  /gift card/i,
  /immediate/i,
  /act fast/i,
  /won't last/i,
  /first come/i,
  /serious buyers only/i,
  /cash only/i,
  /no time wasters/i,
  /motivated seller/i,
  /below market/i,
  /distress sale/i,
  /bank owned/i,
  /foreclosure/i,
  /inheritance/i,
  /relocating/i,
  /divorce sale/i,
  /estate sale/i,
  /western union/i,
  /moneygram/i,
  /bitcoin/i,
  /crypto/i,
  /zelle/i,
  /venmo/i,
  /paypal friends/i
];

// Suspicious contact patterns
const SUSPICIOUS_CONTACT_PATTERNS = [
  /whatsapp only/i,
  /text only/i,
  /no calls/i,
  /contact via/i,
  /telegram/i,
  /signal app/i,
  /overseas/i,
  /out of (the )?country/i,
  /abroad/i,
  /traveling/i,
  /international/i
];

// Generic/template language
const GENERIC_PATTERNS = [
  /beautiful property/i,
  /amazing opportunity/i,
  /once in a lifetime/i,
  /dream home/i,
  /won't be disappointed/i,
  /you won't regret/i,
  /perfect location/i,
  /prime location/i,
  /investment opportunity/i,
  /rental income/i,
  /passive income/i,
  /guaranteed return/i
];

// Suspicious seller claims
const SUSPICIOUS_CLAIMS = [
  /owner financing/i,
  /rent to own/i,
  /lease option/i,
  /no credit check/i,
  /bad credit ok/i,
  /no bank needed/i,
  /skip the bank/i,
  /private sale/i,
  /off market/i,
  /not listed/i,
  /exclusive deal/i,
  /special price/i,
  /friends and family/i,
  /trusted buyer/i
];

// Location red flags
const LOCATION_RED_FLAGS = [
  /exact location available/i,
  /address upon deposit/i,
  /viewing after payment/i,
  /keys upon transfer/i,
  /location disclosed/i
];

/**
 * Extract content from the current page
 */
function extractPageContent() {
  const title = document.title || '';
  const description = document.body?.innerText || '';
  
  const priceMatch = description.match(/\$[\d,]+(\.\d{2})?/);
  const price = priceMatch ? priceMatch[0] : undefined;
  
  const images = document.querySelectorAll('img');
  const imageCount = images.length;
  
  const phoneMatch = description.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  const emailMatch = description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  
  return {
    title,
    description: description.substring(0, 10000),
    price,
    imageCount,
    sellerPhone: phoneMatch ? phoneMatch[1] : undefined,
    sellerEmail: emailMatch ? emailMatch[0] : undefined
  };
}

/**
 * Analyze content and return risk flags
 */
function analyzeContent(content) {
  const flags = [];
  const text = `${content.title} ${content.description}`.toLowerCase();
  
  // Check urgency language
  let urgencyCount = 0;
  URGENCY_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      urgencyCount++;
    }
  });
  if (urgencyCount > 0) {
    flags.push({
      category: "Urgency Language",
      description: `${urgencyCount} pressure tactic${urgencyCount > 1 ? 's' : ''} detected (e.g., "urgent", "wire transfer", "act fast")`,
      weight: Math.min(urgencyCount * 8, 30)
    });
  }
  
  // Check suspicious contact patterns
  let contactFlags = 0;
  SUSPICIOUS_CONTACT_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      contactFlags++;
    }
  });
  if (contactFlags > 0) {
    flags.push({
      category: "Suspicious Contact Method",
      description: `Seller prefers unusual contact methods (WhatsApp only, out of country, etc.)`,
      weight: contactFlags * 10
    });
  }
  
  // Check for unrealistic pricing
  if (content.price) {
    const priceNum = parseFloat(content.price.replace(/[$,]/g, ''));
    if (priceNum > 0 && priceNum < 10000) {
      flags.push({
        category: "Unrealistic Price",
        description: `Price appears too low for real estate ($${priceNum.toLocaleString()})`,
        weight: 25
      });
    }
  }
  
  // Check image count
  if (content.imageCount < 3) {
    flags.push({
      category: "Low Image Count",
      description: `Only ${content.imageCount} image${content.imageCount !== 1 ? 's' : ''} in listing (legitimate listings typically have 5+)`,
      weight: 15
    });
  }
  
  // Check generic language
  let genericCount = 0;
  GENERIC_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      genericCount++;
    }
  });
  if (genericCount >= 3) {
    flags.push({
      category: "Generic Template Language",
      description: `Listing uses vague, templated phrases common in scam listings`,
      weight: 12
    });
  }
  
  // Check suspicious seller claims
  let claimCount = 0;
  SUSPICIOUS_CLAIMS.forEach(pattern => {
    if (pattern.test(text)) {
      claimCount++;
    }
  });
  if (claimCount > 0) {
    flags.push({
      category: "Suspicious Seller Claims",
      description: `Seller makes unusual claims (owner financing, no credit check, etc.)`,
      weight: claimCount * 8
    });
  }
  
  // Check location red flags
  let locationFlags = 0;
  LOCATION_RED_FLAGS.forEach(pattern => {
    if (pattern.test(text)) {
      locationFlags++;
    }
  });
  if (locationFlags > 0) {
    flags.push({
      category: "Location Withholding",
      description: `Seller won't disclose location until payment/deposit`,
      weight: 20
    });
  }
  
  // Check for payment method red flags
  if (/wire|western union|moneygram|gift card|bitcoin|crypto|zelle|venmo/i.test(text)) {
    flags.push({
      category: "Risky Payment Method",
      description: `Seller requests untraceable payment method (wire transfer, gift cards, crypto)`,
      weight: 25
    });
  }
  
  // Check for overseas seller
  if (/overseas|abroad|out of country|international|traveling|can't meet/i.test(text)) {
    flags.push({
      category: "Remote Seller",
      description: `Seller claims to be overseas or unable to meet in person`,
      weight: 18
    });
  }
  
  // Check for deposit/advance payment requests
  if (/deposit|advance|upfront|before viewing|before meeting|to hold|secure it/i.test(text)) {
    flags.push({
      category: "Advance Payment Request",
      description: `Seller requests deposit or advance payment before viewing`,
      weight: 22
    });
  }
  
  return flags;
}

/**
 * Calculate risk score from flags
 */
function calculateScore(flags) {
  const totalWeight = flags.reduce((sum, flag) => sum + flag.weight, 0);
  return Math.min(totalWeight, 100);
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score) {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/**
 * Generate recommendations based on flags
 */
function generateRecommendations(flags, riskLevel) {
  const recommendations = [];
  
  if (riskLevel === "high") {
    recommendations.push("⛔ Do NOT send any money or deposit to this seller");
    recommendations.push("🚫 Do NOT share personal or financial information");
    recommendations.push("🔍 Verify property ownership through official land registry");
  }
  
  if (riskLevel === "medium") {
    recommendations.push("⚠️ Proceed with extreme caution");
    recommendations.push("🔍 Independently verify seller identity and property ownership");
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
  
  if (categories.includes("Low Image Count")) {
    recommendations.push("📸 Request additional photos and video walkthrough");
  }
  
  if (riskLevel !== "low") {
    recommendations.push("👮 Report suspicious listings to the platform and local authorities");
    recommendations.push("🏛️ Consult with a licensed real estate attorney before purchasing");
  }
  
  if (riskLevel === "low") {
    recommendations.push("✅ Listing appears legitimate, but always verify ownership independently");
    recommendations.push("📋 Use a licensed real estate agent or attorney for the transaction");
  }
  
  return [...new Set(recommendations)];
}

/**
 * Main scan function - analyzes current page
 */
function scanPage(additionalInfo) {
  const content = extractPageContent();
  
  if (additionalInfo?.phone) content.sellerPhone = additionalInfo.phone;
  if (additionalInfo?.email) content.sellerEmail = additionalInfo.email;
  
  const flags = analyzeContent(content);
  const score = calculateScore(flags);
  const riskLevel = getRiskLevel(score);
  const recommendations = generateRecommendations(flags, riskLevel);
  
  return {
    url: window.location.href,
    timestamp: Date.now(),
    score,
    riskLevel,
    flags: flags.map(f => `${f.category}: ${f.description}`),
    recommendations,
    sellerInfo: {
      phone: content.sellerPhone,
      email: content.sellerEmail,
      agent: additionalInfo?.agent
    }
  };
}
