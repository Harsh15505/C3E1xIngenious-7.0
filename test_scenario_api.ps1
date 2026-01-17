# Test the Scenario API
Write-Host "Testing Scenario API..." -ForegroundColor Green

# Test scenario simulation
$body = @{
    city = "ahmedabad"
    zone = "A"
    trafficDensityChange = -30
    heavyVehicleRestriction = $true
    timeWindow = "08:00-11:00"
} | ConvertTo-Json

Write-Host "`nTesting POST /api/v1/scenario/simulate" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/scenario/simulate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Scenario simulation successful!" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test model explanation
Write-Host "`n`nTesting GET /api/v1/scenario/explain" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/scenario/explain" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Model explanation retrieved!" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test scenario history
Write-Host "`n`nTesting GET /api/v1/scenario/history/ahmedabad" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/scenario/history/ahmedabad" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Scenario history retrieved!" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
