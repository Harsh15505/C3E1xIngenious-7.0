#!/usr/bin/env pwsh
# Production Build and Test Script

Write-Host "`n🚀 Production Build Script" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Step 1: Clean previous builds
Write-Host "📦 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next folder" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host "`n📥 Checking dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies up to date" -ForegroundColor Green

# Step 3: Build for production
Write-Host "`n🔨 Building for production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 4: Show build stats
Write-Host "`n📊 Build Statistics:" -ForegroundColor Cyan
if (Test-Path ".next") {
    $size = (Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Total build size: $([math]::Round($size, 2)) MB" -ForegroundColor White
}

# Step 5: Start production server
Write-Host "`n🎯 Starting production server..." -ForegroundColor Yellow
Write-Host "Server will start on http://localhost:3000" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Gray

npm run start
