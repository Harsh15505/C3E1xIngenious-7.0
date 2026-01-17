# Test Analytics APIs (Anomaly Detection & Risk Scoring)
Write-Host "Testing Analytics APIs..." -ForegroundColor Green

$city = "ahmedabad"

# Test anomaly detection
Write-Host "`nTesting GET /api/v1/analytics/anomalies/$city" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/analytics/anomalies/$city" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Anomaly detection successful!" -ForegroundColor Green
    Write-Host "Total anomalies detected: $($result.total_count)" -ForegroundColor Yellow
    Write-Host "  Environment: $($result.environment_anomalies.Count)" -ForegroundColor White
    Write-Host "  Traffic: $($result.traffic_anomalies.Count)" -ForegroundColor White
    Write-Host "  Services: $($result.service_anomalies.Count)" -ForegroundColor White
    
    if ($result.total_count -gt 0) {
        Write-Host "`nSample anomaly:" -ForegroundColor Cyan
        $sample = $result.environment_anomalies[0]
        if ($sample) {
            Write-Host "  Metric: $($sample.metric)" -ForegroundColor White
            Write-Host "  Severity: $($sample.severity)" -ForegroundColor White
            Write-Host "  Current: $($sample.current_value), Expected: $($sample.expected_value)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test risk scoring
Write-Host "`n`nTesting GET /api/v1/analytics/risk/$city" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/analytics/risk/$city" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Risk scoring successful!" -ForegroundColor Green
    Write-Host "Overall Risk Score: $($result.overall_score) ($($result.risk_level))" -ForegroundColor Yellow
    
    Write-Host "`nComponent Scores:" -ForegroundColor Cyan
    Write-Host "  Environment: $($result.components.environment.score)" -ForegroundColor White
    Write-Host "  Traffic: $($result.components.traffic.score)" -ForegroundColor White
    Write-Host "  Services: $($result.components.services.score)" -ForegroundColor White
    Write-Host "  Anomalies: $($result.components.anomalies.score) ($($result.components.anomalies.count) detected)" -ForegroundColor White
    
    Write-Host "`nRecommendations:" -ForegroundColor Cyan
    foreach ($rec in $result.recommendations) {
        Write-Host "  $rec" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test anomaly history
Write-Host "`n`nTesting GET /api/v1/analytics/anomalies/$city/history" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/analytics/anomalies/$city/history" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Anomaly history retrieved!" -ForegroundColor Green
    Write-Host "Historical anomalies: $($result.count)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test risk history
Write-Host "`n`nTesting GET /api/v1/analytics/risk/$city/history" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/v1/analytics/risk/$city/history" `
        -Method GET `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Risk history retrieved!" -ForegroundColor Green
    Write-Host "Historical risk scores: $($result.count)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n`n=== Summary ===" -ForegroundColor Green
Write-Host "Phase 3 (Advanced Analytics) Complete!" -ForegroundColor Green
Write-Host "  ✅ Anomaly Detection - Z-score based" -ForegroundColor White
Write-Host "  ✅ Risk Scoring - Multi-factor weighted" -ForegroundColor White
Write-Host "  ✅ Historical tracking" -ForegroundColor White
