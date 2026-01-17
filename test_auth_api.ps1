# Test Authentication APIs - Phase 5.5
# Tests user registration, login, and JWT authentication

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AUTHENTICATION TEST - PHASE 5.5" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8001/api/v1"
$testResults = @()
$global:adminToken = $null
$global:citizenToken = $null

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Token = $null
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
        
        if ($Token) {
            $params.Headers = @{
                "Authorization" = "Bearer $Token"
            }
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

Write-Host "Phase 5.5: Authentication System Tests" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register Admin User
Write-Host "1. Register Admin User" -ForegroundColor Magenta
$adminData = @{
    email = "admin@urbanintel.com"
    password = "admin12345"
    full_name = "System Administrator"
    role = "admin"
}

$adminReg = Test-Endpoint `
    -Name "Register Admin" `
    -Url "$baseUrl/auth/register" `
    -Method "POST" `
    -Body $adminData

if ($adminReg) {
    $global:adminToken = $adminReg.access_token
    Write-Host "   Admin Token: $($adminToken.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "   User ID: $($adminReg.user.id)" -ForegroundColor Gray
    Write-Host "   Role: $($adminReg.user.role)" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Register Citizen User
Write-Host "2. Register Citizen User" -ForegroundColor Magenta
$citizenData = @{
    email = "citizen@example.com"
    password = "citizen123"
    full_name = "John Citizen"
    role = "citizen"
}

$citizenReg = Test-Endpoint `
    -Name "Register Citizen" `
    -Url "$baseUrl/auth/register" `
    -Method "POST" `
    -Body $citizenData

if ($citizenReg) {
    $global:citizenToken = $citizenReg.access_token
    Write-Host "   Citizen Token: $($citizenToken.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "   User ID: $($citizenReg.user.id)" -ForegroundColor Gray
    Write-Host "   Role: $($citizenReg.user.role)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Try to register duplicate email
Write-Host "3. Test Duplicate Email Prevention" -ForegroundColor Magenta
$duplicateData = @{
    email = "admin@urbanintel.com"
    password = "another123456"
    full_name = "Another Admin"
    role = "admin"
}

$duplicate = Test-Endpoint `
    -Name "Duplicate Email (Should Fail)" `
    -Url "$baseUrl/auth/register" `
    -Method "POST" `
    -Body $duplicateData

if (-not $duplicate) {
    Write-Host "   ✅ Correctly prevented duplicate registration" -ForegroundColor Green
}
Write-Host ""

# Test 4: Login with correct credentials
Write-Host "4. Login with Correct Credentials" -ForegroundColor Magenta
$loginData = @{
    email = "admin@urbanintel.com"
    password = "admin12345"
}

$login = Test-Endpoint `
    -Name "Login Admin" `
    -Url "$baseUrl/auth/login" `
    -Method "POST" `
    -Body $loginData

if ($login) {
    Write-Host "   New Token: $($login.access_token.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "   Last Login: $($login.user.last_login)" -ForegroundColor Gray
}
Write-Host ""

# Test 5: Login with wrong password
Write-Host "5. Test Wrong Password" -ForegroundColor Magenta
$wrongLogin = @{
    email = "admin@urbanintel.com"
    password = "wrongpassword"
}

$wrongAttempt = Test-Endpoint `
    -Name "Wrong Password (Should Fail)" `
    -Url "$baseUrl/auth/login" `
    -Method "POST" `
    -Body $wrongLogin

if (-not $wrongAttempt) {
    Write-Host "   ✅ Correctly rejected wrong password" -ForegroundColor Green
}
Write-Host ""

# Test 6: Get current user profile (with token)
Write-Host "6. Get Current User Profile (Protected Route)" -ForegroundColor Magenta
$profile = Test-Endpoint `
    -Name "Get Profile" `
    -Url "$baseUrl/auth/me" `
    -Token $global:adminToken

if ($profile) {
    Write-Host "   Email: $($profile.email)" -ForegroundColor Gray
    Write-Host "   Name: $($profile.full_name)" -ForegroundColor Gray
    Write-Host "   Role: $($profile.role)" -ForegroundColor Gray
}
Write-Host ""

# Test 7: Try to access protected route without token
Write-Host "7. Test Protected Route Without Token" -ForegroundColor Magenta
$noToken = Test-Endpoint `
    -Name "Profile Without Token (Should Fail)" `
    -Url "$baseUrl/auth/me"

if (-not $noToken) {
    Write-Host "   ✅ Correctly required authentication" -ForegroundColor Green
}
Write-Host ""

# Test 8: List all users
Write-Host "8. List All Users" -ForegroundColor Magenta
$users = Test-Endpoint `
    -Name "List Users" `
    -Url "$baseUrl/auth/users" `
    -Token $global:adminToken

if ($users) {
    Write-Host "   Total Users: $($users.total)" -ForegroundColor Gray
    foreach ($user in $users.users) {
        Write-Host "     - $($user.email) ($($user.role))" -ForegroundColor Gray
    }
}
Write-Host ""

# Test 9: View database using utility script
Write-Host "9. View Database Tables (using view_db.py)" -ForegroundColor Magenta
try {
    $dbSummary = python D:\IngeniousC3E1\backend\scripts\view_db.py
    Write-Host $dbSummary -ForegroundColor Gray
    Write-Host "  ✅ PASSED" -ForegroundColor Green
    $script:testResults += @{Name="Database Viewer"; Status="PASSED"}
}
catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $script:testResults += @{Name="Database Viewer"; Status="FAILED"}
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
    Write-Host "Phase 5.5 Authentication Complete:" -ForegroundColor Cyan
    Write-Host "  ✅ User registration (admin & citizen roles)" -ForegroundColor Green
    Write-Host "  ✅ JWT token generation" -ForegroundColor Green
    Write-Host "  ✅ Login with password verification" -ForegroundColor Green
    Write-Host "  ✅ Protected routes with token validation" -ForegroundColor Green
    Write-Host "  ✅ Database viewer utility" -ForegroundColor Green
    Write-Host ""
    Write-Host "Saved Tokens for Frontend Development:" -ForegroundColor Yellow
    Write-Host "  Admin Token: $global:adminToken" -ForegroundColor Gray
    Write-Host "  Citizen Token: $global:citizenToken" -ForegroundColor Gray
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
