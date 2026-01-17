# Phase 7 Dashboard Test
# Test login and access to both citizen and municipal dashboards

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PHASE 7: DASHBOARD ACCESS TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8001"

# Test counters
$passed = 0
$failed = 0

function Test-Result {
    param($condition, $testName)
    if ($condition) {
        Write-Host "  ✅ $testName" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  ❌ $testName" -ForegroundColor Red
        $script:failed++
    }
}

# 1. Test Citizen Login & Access
Write-Host "1. Test Citizen Login & Dashboard Access" -ForegroundColor Yellow
try {
    $citizenLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"citizen@example.com","password":"citizen123"}'
    
    $citizenToken = $citizenLogin.access_token
    Test-Result ($null -ne $citizenToken) "Citizen can login"
    
    $headers = @{
        "Authorization" = "Bearer $citizenToken"
    }
    
    # Test accessing public alerts (citizen dashboard data)
    $alerts = Invoke-RestMethod -Uri "$baseUrl/api/v1/alerts/Ahmedabad?audience=public&active_only=true" -Headers $headers
    Test-Result ($null -ne $alerts) "Citizen can access public alerts"
    
    # Test citizen CANNOT access admin endpoints
    try {
        $audit = Invoke-RestMethod -Uri "$baseUrl/api/v1/system/audit?limit=5" -Headers $headers -ErrorAction Stop
        Test-Result $false "Citizen should NOT access audit logs"
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 403) {
            Test-Result $true "Citizen correctly blocked from admin endpoints"
        } else {
            Test-Result $false "Unexpected response code for citizen admin access"
        }
    }
} catch {
    Write-Host "  ❌ Citizen login test failed: $_" -ForegroundColor Red
    $script:failed += 3
}
Write-Host ""

# 2. Test Admin Login & Access
Write-Host "2. Test Admin Login & Dashboard Access" -ForegroundColor Yellow
try {
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"admin@urbanintel.com","password":"admin12345"}'
    
    $adminToken = $adminLogin.access_token
    Test-Result ($null -ne $adminToken) "Admin can login"
    
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    # Test accessing all alerts (admin dashboard data)
    $allAlerts = Invoke-RestMethod -Uri "$baseUrl/api/v1/alerts/Ahmedabad" -Headers $headers
    Test-Result ($null -ne $allAlerts) "Admin can access all alerts"
    
    # Test accessing risk scores
    $risk = Invoke-RestMethod -Uri "$baseUrl/api/v1/analytics/risk/Ahmedabad" -Headers $headers
    Test-Result ($null -ne $risk) "Admin can access risk scores"
    
    # Test accessing anomalies
    $anomalies = Invoke-RestMethod -Uri "$baseUrl/api/v1/analytics/anomalies/Ahmedabad" -Headers $headers
    Test-Result ($null -ne $anomalies) "Admin can access anomaly data"
    
    # Test accessing audit logs
    $audit = Invoke-RestMethod -Uri "$baseUrl/api/v1/system/audit?limit=5" -Headers $headers
    Test-Result ($null -ne $audit.total) "Admin can access audit logs"
} catch {
    Write-Host "  ❌ Admin login test failed: $_" -ForegroundColor Red
    $script:failed += 5
}
Write-Host ""

# 3. Test System Health
Write-Host "3. Test System Health (Public Access)" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health"
    Test-Result ($health.status -eq "healthy") "System health endpoint accessible"
    Test-Result ($health.service -eq "api") "API service running"
} catch {
    Write-Host "  ❌ Health check failed: $_" -ForegroundColor Red
    $script:failed += 2
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Passed: $passed" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL DASHBOARD TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend URLs:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000/login" -ForegroundColor White
    Write-Host "  http://localhost:3000/citizen/dashboard" -ForegroundColor White
    Write-Host "  http://localhost:3000/municipal/dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "Test the dashboards:" -ForegroundColor Cyan
    Write-Host "1. Login as citizen@example.com / citizen123" -ForegroundColor White
    Write-Host "2. View citizen dashboard with public alerts" -ForegroundColor White
    Write-Host "3. Logout and login as admin@urbanintel.com / admin12345" -ForegroundColor White
    Write-Host "4. View municipal dashboard with full analytics" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Review above for details." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
