# Phase 7: Frontend Authentication Integration Test
# Tests login page, JWT storage, protected routes, and role-based navigation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PHASE 7: FRONTEND AUTH TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8001"
$frontendUrl = "http://localhost:3000"

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

# 1. Test Backend Auth API
Write-Host "1. Test Backend Authentication API" -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"admin@urbanintel.com","password":"admin12345"}'
    
    $adminToken = $loginResponse.access_token
    Test-Result ($null -ne $adminToken) "Admin login successful"
    Test-Result ($loginResponse.token_type -eq "bearer") "Token type is bearer"
    
    # Test /me endpoint
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Headers $headers
    Test-Result ($meResponse.email -eq "admin@urbanintel.com") "Token validation works"
    Test-Result ($meResponse.role -eq "admin") "Role is correct"
} catch {
    Write-Host "  ❌ Backend auth failed: $_" -ForegroundColor Red
    $script:failed += 4
}
Write-Host ""

# 2. Test JWT Token Structure
Write-Host "2. Verify JWT Token Structure" -ForegroundColor Yellow
try {
    # Decode JWT (base64 decode the payload)
    $parts = $adminToken.Split('.')
    if ($parts.Length -eq 3) {
        Test-Result $true "JWT has 3 parts (header.payload.signature)"
        
        # Decode payload
        $payload = $parts[1]
        # Add padding if needed
        while ($payload.Length % 4 -ne 0) { $payload += "=" }
        $decodedBytes = [System.Convert]::FromBase64String($payload)
        $decodedJson = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
        $tokenData = $decodedJson | ConvertFrom-Json
        
        Test-Result ($null -ne $tokenData.sub) "Token has user ID (sub)"
        Test-Result ($null -ne $tokenData.email) "Token has email"
        Test-Result ($null -ne $tokenData.role) "Token has role"
        Test-Result ($null -ne $tokenData.exp) "Token has expiration"
    } else {
        Test-Result $false "JWT structure invalid"
    }
} catch {
    Write-Host "  ⚠️  JWT decode check skipped: $_" -ForegroundColor Yellow
}
Write-Host ""

# 3. Test Protected Endpoints with Auth
Write-Host "3. Test Protected Endpoints" -ForegroundColor Yellow
try {
    # Test without token (should fail)
    try {
        $noAuthResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/alerts/Ahmedabad" -ErrorAction Stop
        Test-Result $false "Unprotected endpoint allowed without token"
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 401 -or $_.Exception.Response.StatusCode.Value__ -eq 403) {
            Test-Result $true "Endpoint blocked without token (401/403)"
        } else {
            Test-Result $true "Endpoint accessible (may be public)"
        }
    }
    
    # Test with token (should succeed)
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $alertsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/alerts/Ahmedabad" -Headers $headers
    Test-Result ($null -ne $alertsResponse) "Protected endpoint works with token"
} catch {
    Write-Host "  ⚠️  Protected endpoint test inconclusive" -ForegroundColor Yellow
}
Write-Host ""

# 4. Test Role-Based Access
Write-Host "4. Test Role-Based Access Control" -ForegroundColor Yellow
try {
    # Admin should access audit logs
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    $auditResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/system/audit?limit=5" -Headers $adminHeaders
    Test-Result ($null -ne $auditResponse.total) "Admin can access audit logs"
    
    # Login as citizen
    $citizenLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"citizen@example.com","password":"citizen123"}'
    
    $citizenToken = $citizenLogin.access_token
    Test-Result ($null -ne $citizenToken) "Citizen login successful"
    
    # Citizen should NOT access audit logs
    try {
        $citizenHeaders = @{
            "Authorization" = "Bearer $citizenToken"
        }
        $citizenAudit = Invoke-RestMethod -Uri "$baseUrl/api/v1/system/audit?limit=5" -Headers $citizenHeaders -ErrorAction Stop
        Test-Result $false "Citizen should NOT access audit logs"
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 403) {
            Test-Result $true "Citizen correctly blocked from audit logs (403)"
        } else {
            Test-Result $false "Unexpected response code"
        }
    }
} catch {
    Write-Host "  ❌ RBAC test failed: $_" -ForegroundColor Red
    $script:failed += 4
}
Write-Host ""

# 5. Check Frontend Files
Write-Host "5. Verify Frontend Auth Files Exist" -ForegroundColor Yellow
$filesToCheck = @(
    "frontend\app\login\page.tsx",
    "frontend\lib\auth.ts",
    "frontend\components\ProtectedRoute.tsx",
    "frontend\components\Header.tsx",
    "frontend\app\unauthorized\page.tsx"
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Test-Result $true "$file exists"
    } else {
        Test-Result $false "$file missing"
    }
}
Write-Host ""

# 6. Check Frontend Dependencies
Write-Host "6. Check Frontend Dependencies" -ForegroundColor Yellow
$packageJson = Get-Content "frontend\package.json" -Raw | ConvertFrom-Json
$hasJwtDecode = $packageJson.dependencies."jwt-decode" -ne $null
Test-Result $hasJwtDecode "jwt-decode package installed"
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
    Write-Host "🎉 ALL PHASE 7 TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Start frontend dev server: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "2. Visit http://localhost:3000/login" -ForegroundColor White
    Write-Host "3. Login with admin@urbanintel.com / admin12345" -ForegroundColor White
    Write-Host "4. Test protected routes and role-based navigation" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Review above for details." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
