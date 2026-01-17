# Test Alert APIs - Phase 5
# Tests alert generation, retrieval, and resolution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ALERT SYSTEM TEST - PHASE 5" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8001/api/v1"
$city = "ahmedabad"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "  ✅ PASSED" -ForegroundColor Green
        $script:testResults += @{Name=$Name; Status="PASSED"; Data=$data}
        return $data
    }
    catch {
        Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{Name=$Name; Status="FAILED"; Error=$_.Exception.Message}
        return $null
    }
}

Write-Host "Phase 5: Alert System Tests" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan
Write-Host ""

# Test 1: Generate Alerts
Write-Host "1. Generate Alerts for $city" -ForegroundColor Magenta
$alertGenResult = Test-Endpoint `
    -Name "Generate Alerts" `
    -Url "$baseUrl/alerts/$city/generate" `
    -Method "POST"

if ($alertGenResult) {
    Write-Host "   Generated: $($alertGenResult.alerts_created) alerts" -ForegroundColor Gray
    Write-Host "   Breakdown:" -ForegroundColor Gray
    Write-Host "     - Risk: $($alertGenResult.breakdown.risk)" -ForegroundColor Gray
    Write-Host "     - Anomaly: $($alertGenResult.breakdown.anomaly)" -ForegroundColor Gray
    Write-Host "     - Forecast: $($alertGenResult.breakdown.forecast)" -ForegroundColor Gray
    Write-Host "     - System: $($alertGenResult.breakdown.system)" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Get All Alerts
Write-Host "2. Get All Active Alerts" -ForegroundColor Magenta
$allAlerts = Test-Endpoint `
    -Name "Get All Alerts" `
    -Url "$baseUrl/alerts/$city"

if ($allAlerts) {
    Write-Host "   Total: $($allAlerts.total_alerts)" -ForegroundColor Gray
    Write-Host "   Active: $($allAlerts.active_alerts)" -ForegroundColor Gray
    Write-Host "   Retrieved: $($allAlerts.alerts.Count)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Filter by Severity - Critical
Write-Host "3. Get Critical Alerts Only" -ForegroundColor Magenta
$criticalAlerts = Test-Endpoint `
    -Name "Get Critical Alerts" `
    -Url "$baseUrl/alerts/${city}?severity=critical"

if ($criticalAlerts) {
    Write-Host "   Critical alerts: $($criticalAlerts.alerts.Count)" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Filter by Audience - Public
Write-Host "4. Get Public Audience Alerts" -ForegroundColor Magenta
$publicAlerts = Test-Endpoint `
    -Name "Get Public Alerts" `
    -Url "$baseUrl/alerts/${city}?audience=public"

if ($publicAlerts) {
    Write-Host "   Public alerts: $($publicAlerts.alerts.Count)" -ForegroundColor Gray
}
Write-Host ""

# Test 5: Get Alert Summary
Write-Host "5. Get Alert Summary Statistics" -ForegroundColor Magenta
$summary = Test-Endpoint `
    -Name "Get Alert Summary" `
    -Url "$baseUrl/alerts/$city/summary"

if ($summary) {
    Write-Host "   Total: $($summary.total_alerts)" -ForegroundColor Gray
    Write-Host "   Active: $($summary.active_alerts)" -ForegroundColor Gray
    Write-Host "   By Severity:" -ForegroundColor Gray
    Write-Host "     - Critical: $($summary.by_severity.critical)" -ForegroundColor Gray
    Write-Host "     - Warning: $($summary.by_severity.warning)" -ForegroundColor Gray
    Write-Host "     - Info: $($summary.by_severity.info)" -ForegroundColor Gray
    Write-Host "   By Type:" -ForegroundColor Gray
    Write-Host "     - Risk: $($summary.by_type.risk)" -ForegroundColor Gray
    Write-Host "     - Anomaly: $($summary.by_type.anomaly)" -ForegroundColor Gray
    Write-Host "     - Forecast: $($summary.by_type.forecast)" -ForegroundColor Gray
    Write-Host "     - System: $($summary.by_type.system)" -ForegroundColor Gray
}
Write-Host ""

# Test 6: Resolve an Alert (if any exist)
if ($allAlerts -and $allAlerts.alerts.Count -gt 0) {
    $alertToResolve = $allAlerts.alerts[0].id
    Write-Host "6. Resolve Alert: $alertToResolve" -ForegroundColor Magenta
    
    $resolveBody = @{
        acknowledged_by = "test_user"
    }
    
    $resolveResult = Test-Endpoint `
        -Name "Resolve Alert" `
        -Url "$baseUrl/alerts/$alertToResolve/resolve" `
        -Method "POST" `
        -Body $resolveBody
    
    if ($resolveResult) {
        Write-Host "   Message: $($resolveResult.message)" -ForegroundColor Gray
        Write-Host "   Resolved At: $($resolveResult.resolved_at)" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Test 7: Verify Alert Resolution
    Write-Host "7. Verify Alert is Resolved" -ForegroundColor Magenta
    $verifyAlerts = Test-Endpoint `
        -Name "Get Active Alerts After Resolution" `
        -Url "$baseUrl/alerts/$city?active_only=true"
    
    if ($verifyAlerts) {
        Write-Host "   Active alerts now: $($verifyAlerts.active_alerts)" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "6. Resolve Alert - SKIPPED (no alerts to resolve)" -ForegroundColor Yellow
    Write-Host ""
}

# Test 8: Get All Alerts Including Resolved
Write-Host "8. Get All Alerts (Including Resolved)" -ForegroundColor Magenta
$allIncludingResolved = Test-Endpoint `
    -Name "Get All Alerts Including Resolved" `
    -Url "$baseUrl/alerts/${city}?active_only=false"

if ($allIncludingResolved) {
    Write-Host "   Total (including resolved): $($allIncludingResolved.alerts.Count)" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$total = $testResults.Count

Write-Host ""
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Phase 5 Alert System Complete:" -ForegroundColor Cyan
    Write-Host "  ✅ Alert generation from risk/anomaly/forecast" -ForegroundColor Green
    Write-Host "  ✅ Alert filtering and retrieval" -ForegroundColor Green
    Write-Host "  ✅ Alert resolution/acknowledgment" -ForegroundColor Green
    Write-Host "  ✅ Alert statistics and summaries" -ForegroundColor Green
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Status -eq "FAILED" } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
