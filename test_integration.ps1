# Quick Integration Test Script
# Run this to verify backend integration after frontend changes

Write-Host "`n=== Urban Intelligence Platform - Integration Tests ===" -ForegroundColor Cyan
Write-Host "Testing backend API endpoints...`n" -ForegroundColor Yellow

$API_BASE = "http://127.0.0.1:8001"

# Test 1: Health Check
Write-Host "[1/5] Testing Backend Health..." -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get
    Write-Host "✅ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "   Make sure backend is running on port 8001" -ForegroundColor Yellow
    exit 1
}

# Test 2: Citizen Login
Write-Host "`n[2/5] Testing Citizen Login API..." -ForegroundColor White
try {
    $citizenLogin = @{
        email = "citizen@example.com"
        password = "citizen123"
    } | ConvertTo-Json

    $citizenResponse = Invoke-RestMethod -Uri "$API_BASE/api/v1/auth/login" -Method Post -Body $citizenLogin -ContentType "application/json"
    $citizenToken = $citizenResponse.access_token
    
    Write-Host "✅ Citizen login successful" -ForegroundColor Green
    Write-Host "   Token: $($citizenToken.Substring(0,20))..." -ForegroundColor Gray

    # Verify citizen role
    $headers = @{ Authorization = "Bearer $citizenToken" }
    $citizenUser = Invoke-RestMethod -Uri "$API_BASE/api/v1/auth/me" -Method Get -Headers $headers
    
    if ($citizenUser.role -eq "citizen") {
        Write-Host "✅ Citizen role verified" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong role: $($citizenUser.role)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Citizen login failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 3: Admin Login
Write-Host "`n[3/5] Testing Admin Login API..." -ForegroundColor White
try {
    $adminLogin = @{
        email = "admin@urbanintel.com"
        password = "admin12345"
    } | ConvertTo-Json

    $adminResponse = Invoke-RestMethod -Uri "$API_BASE/api/v1/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
    $adminToken = $adminResponse.access_token
    
    Write-Host "✅ Admin login successful" -ForegroundColor Green
    Write-Host "   Token: $($adminToken.Substring(0,20))..." -ForegroundColor Gray

    # Verify admin role
    $headers = @{ Authorization = "Bearer $adminToken" }
    $adminUser = Invoke-RestMethod -Uri "$API_BASE/api/v1/auth/me" -Method Get -Headers $headers
    
    if ($adminUser.role -eq "admin") {
        Write-Host "✅ Admin role verified" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong role: $($adminUser.role)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Admin login failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: Public Alerts API (No Auth Required)
Write-Host "`n[4/5] Testing Public Alerts API..." -ForegroundColor White
try {
    $alerts = Invoke-RestMethod -Uri "$API_BASE/api/v1/alerts/ahmedabad?audience=public&active_only=true" -Method Get
    Write-Host "✅ Public alerts accessible" -ForegroundColor Green
    Write-Host "   Active alerts: $($alerts.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Public alerts failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Protected Scenario API (Admin Only)
Write-Host "`n[5/5] Testing Protected Scenario API..." -ForegroundColor White
try {
    $scenarioData = @{
        city = "ahmedabad"
        zone = "A"
        timeWindow = "08:00-11:00"
        trafficDensityChange = -25
        heavyVehicleRestriction = $false
    } | ConvertTo-Json

    $headers = @{ 
        Authorization = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    $scenario = Invoke-RestMethod -Uri "$API_BASE/api/v1/scenario/simulate/ahmedabad" -Method Post -Body $scenarioData -Headers $headers
    
    Write-Host "✅ Scenario simulation works" -ForegroundColor Green
    Write-Host "   Confidence: $($scenario.overall_confidence)" -ForegroundColor Gray
    Write-Host "   Impacts: $($scenario.impacts.Count) factors analyzed" -ForegroundColor Gray
} catch {
    Write-Host "❌ Scenario simulation failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Backend integration tests completed." -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in browser" -ForegroundColor Gray
Write-Host "2. Test citizen login at /login" -ForegroundColor Gray
Write-Host "3. Test admin login at /admin/login" -ForegroundColor Gray
Write-Host "4. Verify existing components still work" -ForegroundColor Gray
Write-Host "`nSee FRONTEND_TESTS.md for detailed test cases.`n" -ForegroundColor Cyan
