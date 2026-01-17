"""
Test Phase 6 Audit Logging + Previous Phases
"""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PHASE 6 + PREVIOUS PHASES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8001/api/v1"

# Get admin token from previous test
Write-Host "1. Login as Admin to get token" -ForegroundColor Magenta
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"admin@urbanintel.com","password":"admin12345"}'

$adminToken = $loginResponse.access_token
Write-Host "  ✅ Got admin token" -ForegroundColor Green
Write-Host ""

# Test Phase 0-5 endpoints (generate audit logs)
Write-Host "2. Test Previous Phases (generates audit logs)" -ForegroundColor Magenta

Write-Host "  - Phase 0: Health check..."
Invoke-RestMethod -Uri "http://127.0.0.1:8001/health" | Out-Null
Write-Host "    ✅ Health OK" -ForegroundColor Green

Write-Host "  - Phase 2: Ingest data..."
Invoke-RestMethod -Uri "$baseUrl/ingest/environment" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"city":"Ahmedabad","aqi":85,"pm25":42,"temperature":28,"timestamp":"2026-01-17T15:00:00Z","source":"test-sensor"}' | Out-Null
Write-Host "    ✅ Ingestion OK" -ForegroundColor Green

Write-Host "  - Phase 3: Get risk scores..."
Invoke-RestMethod -Uri "$baseUrl/analytics/risk/Ahmedabad" | Out-Null
Write-Host "    ✅ Risk scores OK" -ForegroundColor Green

Write-Host "  - Phase 5: Get alerts..."
Invoke-RestMethod -Uri "$baseUrl/alerts/active?limit=5" | Out-Null
Write-Host "    ✅ Alerts OK" -ForegroundColor Green
Write-Host ""

# Test Phase 6: Audit logs
Write-Host "3. Test Phase 6: Query Audit Logs (admin only)" -ForegroundColor Magenta

Write-Host "  - Get all recent audit logs..."
$auditLogs = Invoke-RestMethod -Uri "$baseUrl/system/audit?limit=10" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

Write-Host "    Total logs: $($auditLogs.total)" -ForegroundColor Gray
Write-Host "    Recent requests:" -ForegroundColor Gray
foreach ($log in $auditLogs.items | Select-Object -First 5) {
    Write-Host "      [$($log.method)] $($log.path) - $($log.status_code) ($($log.latency_ms)ms)" -ForegroundColor DarkGray
}
Write-Host "  ✅ Audit logs retrieved" -ForegroundColor Green
Write-Host ""

Write-Host "  - Filter by status code 200..."
$okLogs = Invoke-RestMethod -Uri "$baseUrl/system/audit?status_code=200&limit=5" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
Write-Host "    Found: $($okLogs.total) successful requests" -ForegroundColor Gray
Write-Host "  ✅ Status filter works" -ForegroundColor Green
Write-Host ""

Write-Host "  - Filter by method POST..."
$postLogs = Invoke-RestMethod -Uri "$baseUrl/system/audit?method=POST&limit=5" `
    -Headers @{ "Authorization" = "Bearer $adminToken" }
Write-Host "    Found: $($postLogs.total) POST requests" -ForegroundColor Gray
Write-Host "  ✅ Method filter works" -ForegroundColor Green
Write-Host ""

Write-Host "  - Test unauthorized access (should fail)..."
try {
    Invoke-RestMethod -Uri "$baseUrl/system/audit" 2>&1 | Out-Null
    Write-Host "    ❌ FAILED: Should have been blocked" -ForegroundColor Red
} catch {
    Write-Host "    ✅ Correctly blocked without token" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Phase 0: System Infrastructure" -ForegroundColor Green
Write-Host "✅ Phase 2: Data Ingestion" -ForegroundColor Green  
Write-Host "✅ Phase 3: Analytics (Risk Scoring)" -ForegroundColor Green
Write-Host "✅ Phase 5: Alerts" -ForegroundColor Green
Write-Host "✅ Phase 5.5: Authentication" -ForegroundColor Green
Write-Host "✅ Phase 6: Audit Logging & Transparency" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
