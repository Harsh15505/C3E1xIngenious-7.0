# Comprehensive API Test - All Completed Phases
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   URBAN INTELLIGENCE PLATFORM" -ForegroundColor Cyan
Write-Host "   Comprehensive API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8001"
$city = "ahmedabad"
$testsPassed = 0
$testsFailed = 0

# Helper function
function Test-Endpoint {
    param($Name, $Url, $Method = "GET", $Body = $null)
    
    Write-Host "`n[$Name]" -ForegroundColor Yellow
    try {
        if ($Method -eq "POST") {
            $response = Invoke-WebRequest -Uri $Url -Method POST -ContentType "application/json" -Body $Body -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        }
        
        $result = $response.Content | ConvertFrom-Json
        Write-Host "  ✅ SUCCESS" -ForegroundColor Green
        return @{Success = $true; Data = $result}
    } catch {
        Write-Host "  ❌ FAILED: $_" -ForegroundColor Red
        return @{Success = $false; Error = $_}
    }
}

Write-Host "`n`n========== PHASE 0: SYSTEM STATUS ==========" -ForegroundColor Cyan

$result = Test-Endpoint "Root Endpoint" "$baseUrl/"
if ($result.Success) { $testsPassed++ } else { $testsFailed++ }

$result = Test-Endpoint "Health Check" "$baseUrl/health"
if ($result.Success) { $testsPassed++ } else { $testsFailed++ }

$result = Test-Endpoint "Scheduler Status" "$baseUrl/scheduler/status"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Jobs: $($result.Data.jobs.Count)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 2: DATA INGESTION APIs ==========" -ForegroundColor Cyan

# Test environment data ingestion
$envData = @{
    city = $city
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    source = "test-api"
    aqi = 145.0
    pm25 = 78.5
    temperature = 28.5
    rainfall = 0.0
} | ConvertTo-Json

$result = Test-Endpoint "Ingest Environment Data" "$baseUrl/api/v1/ingest/environment" "POST" $envData
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Record ID: $($result.Data.recordId.Substring(0,8))..." -ForegroundColor White
} else { 
    $testsFailed++ 
}

# Test traffic data ingestion
$trafficData = @{
    city = $city
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    source = "test-api"
    zone = "A"
    densityPercent = 75.0
    congestionLevel = "high"
    heavyVehicleCount = 150
} | ConvertTo-Json

$result = Test-Endpoint "Ingest Traffic Data" "$baseUrl/api/v1/ingest/traffic" "POST" $trafficData
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Record ID: $($result.Data.recordId.Substring(0,8))..." -ForegroundColor White
} else { 
    $testsFailed++ 
}

# Test service data ingestion
$serviceData = @{
    city = $city
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    source = "test-api"
    waterSupplyStress = 0.65
    wasteCollectionEff = 0.88
    powerOutageCount = 2
} | ConvertTo-Json

$result = Test-Endpoint "Ingest Service Data" "$baseUrl/api/v1/ingest/services" "POST" $serviceData
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Record ID: $($result.Data.recordId.Substring(0,8))..." -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 3: ANALYTICS (Forecasting) ==========" -ForegroundColor Cyan

$result = Test-Endpoint "Get Forecasts" "$baseUrl/api/v1/system/forecasts/$city"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Forecasts available: $($result.Data.total_forecasts)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 3: ANALYTICS (Anomaly Detection) ==========" -ForegroundColor Cyan

$result = Test-Endpoint "Detect Anomalies" "$baseUrl/api/v1/analytics/anomalies/$city"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Total anomalies: $($result.Data.total_count)" -ForegroundColor White
    Write-Host "    Environment: $($result.Data.environment_anomalies.Count)" -ForegroundColor Gray
    Write-Host "    Traffic: $($result.Data.traffic_anomalies.Count)" -ForegroundColor Gray
    Write-Host "    Services: $($result.Data.service_anomalies.Count)" -ForegroundColor Gray
} else { 
    $testsFailed++ 
}

$result = Test-Endpoint "Anomaly History" "$baseUrl/api/v1/analytics/anomalies/$city/history"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Historical records: $($result.Data.count)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 3: ANALYTICS (Risk Scoring) ==========" -ForegroundColor Cyan

$result = Test-Endpoint "Calculate Risk Score" "$baseUrl/api/v1/analytics/risk/$city"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Risk Level: $($result.Data.risk_level.ToUpper())" -ForegroundColor White
    Write-Host "  Overall Score: $($result.Data.overall_score)" -ForegroundColor White
    Write-Host "  Components:" -ForegroundColor Gray
    Write-Host "    Environment: $($result.Data.components.environment.score)" -ForegroundColor Gray
    Write-Host "    Traffic: $($result.Data.components.traffic.score)" -ForegroundColor Gray
    Write-Host "    Services: $($result.Data.components.services.score)" -ForegroundColor Gray
    Write-Host "    Anomalies: $($result.Data.components.anomalies.score)" -ForegroundColor Gray
} else { 
    $testsFailed++ 
}

$result = Test-Endpoint "Risk History" "$baseUrl/api/v1/analytics/risk/$city/history"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Historical records: $($result.Data.count)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 4: SCENARIO ENGINE (CENTERPIECE) ==========" -ForegroundColor Cyan

$scenarioData = @{
    city = $city
    zone = "A"
    trafficDensityChange = -25
    heavyVehicleRestriction = $true
    timeWindow = "08:00-11:00"
} | ConvertTo-Json

$result = Test-Endpoint "Simulate Policy Scenario" "$baseUrl/api/v1/scenario/simulate" "POST" $scenarioData
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Scenario ID: $($result.Data.scenario_id.Substring(0,8))..." -ForegroundColor White
    Write-Host "  Impacts: $($result.Data.impacts.Count)" -ForegroundColor White
    Write-Host "  Confidence: $($result.Data.overall_confidence)" -ForegroundColor White
    Write-Host "  Recommendation: $($result.Data.recommendation.Substring(0,50))..." -ForegroundColor White
} else { 
    $testsFailed++ 
}

$result = Test-Endpoint "Model Explanation" "$baseUrl/api/v1/scenario/explain"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Model: $($result.Data.model_type)" -ForegroundColor White
    Write-Host "  Confidence Range: $($result.Data.confidence_range)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

$result = Test-Endpoint "Scenario History" "$baseUrl/api/v1/scenario/history/$city"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Stored scenarios: $($result.Data.count)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

Write-Host "`n`n========== PHASE 1: DATA INFRASTRUCTURE ==========" -ForegroundColor Cyan

$result = Test-Endpoint "System Metadata" "$baseUrl/api/v1/system/metadata"
if ($result.Success) { 
    $testsPassed++
    Write-Host "  Cities: $($result.Data.cities.Count)" -ForegroundColor White
    Write-Host "  Data Sources: $($result.Data.data_sources.Count)" -ForegroundColor White
} else { 
    $testsFailed++ 
}

# Summary
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host "`nCompleted Phases:" -ForegroundColor Cyan
    Write-Host "  ✅ Phase 0: System Infrastructure" -ForegroundColor White
    Write-Host "  ✅ Phase 1: Database & Data Sources" -ForegroundColor White
    Write-Host "  ✅ Phase 2: Data Ingestion APIs" -ForegroundColor White
    Write-Host "  ✅ Phase 3a: Forecasting" -ForegroundColor White
    Write-Host "  ✅ Phase 3b: Anomaly Detection" -ForegroundColor White
    Write-Host "  ✅ Phase 3c: Risk Scoring" -ForegroundColor White
    Write-Host "  ✅ Phase 4: Scenario Engine (CENTERPIECE)" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Some tests failed. Check errors above." -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
