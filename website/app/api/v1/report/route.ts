/**
 * LandGuard AI - Report Generation API
 * POST /api/v1/report
 * 
 * Generates a detailed scan report in HTML format for PDF export
 */

import { NextRequest, NextResponse } from 'next/server'
import { ScanResult, RiskFlag } from '@/lib/api/types'

export const dynamic = 'force-dynamic'

interface ReportRequest {
  scanResult: ScanResult
  propertyInfo?: {
    url?: string
    title?: string
    price?: string
    location?: string
  }
  userInfo?: {
    email?: string
    name?: string
  }
  notes?: string
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return '#991B1B'
    case 'high': return '#DC2626'
    case 'medium': return '#D97706'
    case 'low': return '#059669'
    case 'safe': return '#16A34A'
    default: return '#6B7280'
  }
}

function getRiskBgColor(level: string): string {
  switch (level) {
    case 'critical': return '#FEF2F2'
    case 'high': return '#FEF2F2'
    case 'medium': return '#FFFBEB'
    case 'low': return '#F0FDF4'
    case 'safe': return '#F0FDF4'
    default: return '#F9FAFB'
  }
}

function generateReportHTML(data: ReportRequest): string {
  const { scanResult, propertyInfo, userInfo, notes } = data
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const flagsByCategory = scanResult.flags.reduce((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = []
    acc[flag.category].push(flag)
    return acc
  }, {} as Record<string, RiskFlag[]>)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandGuard AI - Scan Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1F2937;
      background: #fff;
      padding: 40px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #22C55E;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #166534;
    }
    
    .report-meta {
      text-align: right;
      color: #6B7280;
      font-size: 11px;
    }
    
    .report-title {
      font-size: 14px;
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 4px;
    }
    
    .score-section {
      background: ${getRiskBgColor(scanResult.riskLevel)};
      border: 2px solid ${getRiskColor(scanResult.riskLevel)};
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 30px;
    }
    
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: white;
      border: 6px solid ${getRiskColor(scanResult.riskLevel)};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .score-value {
      font-size: 36px;
      font-weight: 700;
      color: ${getRiskColor(scanResult.riskLevel)};
    }
    
    .score-label {
      font-size: 10px;
      color: #6B7280;
      text-transform: uppercase;
    }
    
    .risk-info {
      flex: 1;
    }
    
    .risk-level {
      font-size: 24px;
      font-weight: 700;
      color: ${getRiskColor(scanResult.riskLevel)};
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .risk-description {
      color: #4B5563;
      font-size: 13px;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #DCFCE7;
    }
    
    .property-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .property-item {
      background: #F9FAFB;
      padding: 12px;
      border-radius: 8px;
    }
    
    .property-label {
      font-size: 10px;
      color: #6B7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .property-value {
      font-size: 13px;
      font-weight: 500;
      color: #1F2937;
      word-break: break-all;
    }
    
    .flags-grid {
      display: grid;
      gap: 12px;
    }
    
    .flag-category {
      background: #F9FAFB;
      border-radius: 8px;
      padding: 16px;
    }
    
    .category-header {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .flag-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .flag-item:last-child {
      border-bottom: none;
    }
    
    .flag-severity {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .severity-critical { background: #FEF2F2; color: #991B1B; }
    .severity-high { background: #FEF2F2; color: #DC2626; }
    .severity-medium { background: #FFFBEB; color: #D97706; }
    .severity-low { background: #F0FDF4; color: #059669; }
    
    .flag-description {
      flex: 1;
      color: #4B5563;
    }
    
    .flag-evidence {
      font-size: 11px;
      color: #9CA3AF;
      font-style: italic;
    }
    
    .recommendations-list {
      list-style: none;
    }
    
    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .recommendation-item:last-child {
      border-bottom: none;
    }
    
    .rec-icon {
      font-size: 16px;
    }
    
    .rec-text {
      color: #374151;
      font-size: 13px;
    }
    
    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .analysis-card {
      background: #F9FAFB;
      border-radius: 8px;
      padding: 16px;
    }
    
    .analysis-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .analysis-stat {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .analysis-stat:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      color: #6B7280;
    }
    
    .stat-value {
      font-weight: 600;
      color: #1F2937;
    }
    
    .notes-section {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 16px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 10px;
    }
    
    .disclaimer {
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 12px;
      margin-top: 20px;
      font-size: 11px;
      color: #92400E;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🛡️</div>
      <div class="logo-text">LandGuard AI</div>
    </div>
    <div class="report-meta">
      <div class="report-title">Property Scan Report</div>
      <div>Report ID: ${scanResult.scanId}</div>
      <div>Generated: ${reportDate}</div>
      ${userInfo?.email ? `<div>User: ${userInfo.email}</div>` : ''}
    </div>
  </div>

  <div class="score-section">
    <div class="score-circle">
      <div class="score-value">${scanResult.score}</div>
      <div class="score-label">Risk Score</div>
    </div>
    <div class="risk-info">
      <div class="risk-level">${scanResult.riskLevel} Risk</div>
      <div class="risk-description">
        ${scanResult.riskLevel === 'critical' || scanResult.riskLevel === 'high' 
          ? '⚠️ This listing shows significant red flags. Do NOT proceed without extreme caution.'
          : scanResult.riskLevel === 'medium'
          ? '⚡ This listing has some concerning elements. Verify all details before proceeding.'
          : '✅ This listing appears legitimate. Standard due diligence is still recommended.'}
      </div>
    </div>
  </div>

  ${propertyInfo ? `
  <div class="section">
    <div class="section-title">📋 Property Information</div>
    <div class="property-grid">
      ${propertyInfo.url ? `
      <div class="property-item" style="grid-column: span 2;">
        <div class="property-label">Listing URL</div>
        <div class="property-value">${propertyInfo.url}</div>
      </div>` : ''}
      ${propertyInfo.title ? `
      <div class="property-item">
        <div class="property-label">Title</div>
        <div class="property-value">${propertyInfo.title}</div>
      </div>` : ''}
      ${propertyInfo.price ? `
      <div class="property-item">
        <div class="property-label">Price</div>
        <div class="property-value">${propertyInfo.price}</div>
      </div>` : ''}
      ${propertyInfo.location ? `
      <div class="property-item">
        <div class="property-label">Location</div>
        <div class="property-value">${propertyInfo.location}</div>
      </div>` : ''}
    </div>
  </div>` : ''}

  ${scanResult.analysis ? `
  <div class="section">
    <div class="section-title">🔍 Analysis Summary</div>
    <div class="analysis-grid">
      ${scanResult.analysis.imageAnalysis ? `
      <div class="analysis-card">
        <div class="analysis-title">📸 Image Analysis</div>
        <div class="analysis-stat">
          <span class="stat-label">Images Found</span>
          <span class="stat-value">${scanResult.analysis.imageAnalysis.imageCount}</span>
        </div>
        <div class="analysis-stat">
          <span class="stat-label">Stock Photos</span>
          <span class="stat-value" style="color: ${scanResult.analysis.imageAnalysis.stockImageDetected ? '#DC2626' : '#059669'}">
            ${scanResult.analysis.imageAnalysis.stockImageDetected ? 'Detected ⚠️' : 'None Found ✓'}
          </span>
        </div>
        <div class="analysis-stat">
          <span class="stat-label">Image Score</span>
          <span class="stat-value">${scanResult.analysis.imageAnalysis.score}/100</span>
        </div>
      </div>` : ''}
      ${scanResult.analysis.templateAnalysis ? `
      <div class="analysis-card">
        <div class="analysis-title">📝 Template Detection</div>
        <div class="analysis-stat">
          <span class="stat-label">Template Text</span>
          <span class="stat-value" style="color: ${scanResult.analysis.templateAnalysis.isTemplateText ? '#DC2626' : '#059669'}">
            ${scanResult.analysis.templateAnalysis.isTemplateText ? 'Detected ⚠️' : 'Unique ✓'}
          </span>
        </div>
        <div class="analysis-stat">
          <span class="stat-label">Generic Phrases</span>
          <span class="stat-value">${scanResult.analysis.templateAnalysis.genericPhraseCount}</span>
        </div>
        <div class="analysis-stat">
          <span class="stat-label">Template Score</span>
          <span class="stat-value">${scanResult.analysis.templateAnalysis.score}/100</span>
        </div>
      </div>` : ''}
    </div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">🚩 Risk Flags (${scanResult.flags.length} Found)</div>
    ${scanResult.flags.length > 0 ? `
    <div class="flags-grid">
      ${Object.entries(flagsByCategory).map(([category, flags]) => `
        <div class="flag-category">
          <div class="category-header">${category}</div>
          ${flags.map(flag => `
            <div class="flag-item">
              <span class="flag-severity severity-${flag.severity}">${flag.severity}</span>
              <div>
                <div class="flag-description">${flag.description}</div>
                ${flag.evidence ? `<div class="flag-evidence">"${flag.evidence}"</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>` : `
    <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; color: #166534;">
      ✅ No significant risk flags detected
    </div>`}
  </div>

  <div class="section">
    <div class="section-title">💡 Recommendations</div>
    <ul class="recommendations-list">
      ${scanResult.recommendations.map(rec => `
        <li class="recommendation-item">
          <span class="rec-text">${rec}</span>
        </li>
      `).join('')}
    </ul>
  </div>

  ${notes ? `
  <div class="section">
    <div class="section-title">📝 Notes</div>
    <div class="notes-section">
      ${notes}
    </div>
  </div>` : ''}

  <div class="disclaimer">
    ⚠️ <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute legal advice. 
    LandGuard AI provides risk analysis based on pattern detection and should not be considered as definitive proof of fraud or legitimacy. 
    Always conduct proper due diligence, verify property ownership through official county records, and consult with licensed real estate 
    professionals and attorneys before any property transaction.
  </div>

  <div class="footer">
    <p>Generated by LandGuard AI v2.0 | landguardai.co</p>
    <p>© ${new Date().getFullYear()} LandGuard AI. All rights reserved.</p>
  </div>
</body>
</html>
`
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json()
    
    if (!body.scanResult) {
      return NextResponse.json({
        success: false,
        error: 'scanResult is required'
      }, { status: 400 })
    }
    
    const html = generateReportHTML(body)
    
    return NextResponse.json({
      success: true,
      reportId: `report_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      html,
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] report generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/report',
    method: 'POST',
    description: 'Generate a detailed scan report in HTML format for PDF export',
    requestBody: {
      scanResult: { type: 'ScanResult', required: true, description: 'The scan result to generate a report for' },
      propertyInfo: { 
        type: 'object', 
        required: false, 
        description: 'Additional property details',
        properties: {
          url: 'Listing URL',
          title: 'Property title',
          price: 'Listed price',
          location: 'Property location'
        }
      },
      userInfo: {
        type: 'object',
        required: false,
        description: 'User information for the report',
        properties: {
          email: 'User email',
          name: 'User name'
        }
      },
      notes: { type: 'string', required: false, description: 'Additional notes to include' }
    },
    responseFields: {
      reportId: 'Unique report identifier',
      html: 'Generated HTML report (can be converted to PDF)',
      generatedAt: 'Timestamp of report generation'
    }
  })
}

