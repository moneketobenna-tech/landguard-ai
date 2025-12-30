# LandGuard AI v8.0 - Chrome Store Package Creator
# This script creates a clean ZIP file ready for Chrome Web Store submission

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  LandGuard AI v8.0 - Chrome Store Packager" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$sourceDir = "C:\Users\Toby\Desktop\landguard-ai"
$outputZip = "C:\Users\Toby\Desktop\landguard-ai-v8.0-chrome-store.zip"
$tempDir = "$env:TEMP\landguard-ai-v8-package"

# Clean up temp directory if it exists
if (Test-Path $tempDir) {
    Write-Host "Cleaning up previous build..." -ForegroundColor Yellow
    Remove-Item -Path $tempDir -Recurse -Force
}

# Create temp directory
Write-Host "Creating package directory..." -ForegroundColor Green
New-Item -Path $tempDir -ItemType Directory | Out-Null

# Copy required files
Write-Host "Copying extension files..." -ForegroundColor Green

# 1. Manifest
Copy-Item "$sourceDir\manifest.json" -Destination $tempDir
Write-Host "  [OK] manifest.json" -ForegroundColor Gray

# 2. Icons
$iconsDir = "$tempDir\icons"
New-Item -Path $iconsDir -ItemType Directory | Out-Null
Copy-Item "$sourceDir\icons\*" -Destination $iconsDir -Recurse
Write-Host "  [OK] icons folder (16, 32, 48, 128px)" -ForegroundColor Gray

# 3. Source files
Copy-Item "$sourceDir\src" -Destination $tempDir -Recurse
Write-Host "  [OK] src folder (popup, background, content, options)" -ForegroundColor Gray

Write-Host ""
Write-Host "Verifying package contents..." -ForegroundColor Yellow

# Verify required files
$requiredFiles = @(
    "$tempDir\manifest.json",
    "$tempDir\icons\icon16.png",
    "$tempDir\icons\icon32.png",
    "$tempDir\icons\icon48.png",
    "$tempDir\icons\icon128.png",
    "$tempDir\src\popup\popup.html",
    "$tempDir\src\background\background.js",
    "$tempDir\src\content\content.js"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    $fileName = Split-Path $file -Leaf
    if (Test-Path $file) {
        Write-Host "  [OK] $fileName" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $fileName" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host ""
    Write-Host "ERROR: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating ZIP file..." -ForegroundColor Green

# Remove old ZIP if exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# Create ZIP
Add-Type -Assembly 'System.IO.Compression.FileSystem'
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $outputZip)

# Clean up temp directory
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

# Show file info
$zipInfo = Get-Item $outputZip
$fileSizeKB = [math]::Round($zipInfo.Length / 1KB, 2)

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  SUCCESS! PACKAGE CREATED!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "File Location:" -ForegroundColor Cyan
Write-Host "  $outputZip" -ForegroundColor White
Write-Host ""
Write-Host "File Size:" -ForegroundColor Cyan
Write-Host "  $fileSizeKB KB" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://chrome.google.com/webstore/devconsole" -ForegroundColor White
Write-Host "  2. Click 'New Item'" -ForegroundColor White
Write-Host "  3. Upload: landguard-ai-v8.0-chrome-store.zip" -ForegroundColor White
Write-Host "  4. Fill in store listing (see CHROME_STORE_SUBMISSION.md)" -ForegroundColor White
Write-Host "  5. Submit for review!" -ForegroundColor White
Write-Host ""
Write-Host "LandGuard AI v8.0 is ready for Chrome Web Store!" -ForegroundColor Green
Write-Host ""
