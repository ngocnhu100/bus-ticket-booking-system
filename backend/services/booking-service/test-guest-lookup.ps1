# Test Guest Booking Lookup

# This script tests the guest booking lookup implementation

$API_BASE = "http://localhost:3000"
$bookingRef = "BK202512071234"  # Replace with actual booking reference

Write-Host "`n====== GUEST BOOKING LOOKUP TESTS ======`n" -ForegroundColor Cyan

# Test 1: Guest lookup WITH correct email
Write-Host "Test 1: Guest lookup with correct email" -ForegroundColor Yellow
try {
    $response1 = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef?contactEmail=guest@test.com" -Method GET -ContentType "application/json"
    Write-Host "✅ Success:" -ForegroundColor Green
    $response1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# Test 2: Guest lookup WITH correct phone
Write-Host "`nTest 2: Guest lookup with correct phone" -ForegroundColor Yellow
try {
    $response2 = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef?contactPhone=%2B84901234567" -Method GET -ContentType "application/json"
    Write-Host "✅ Success:" -ForegroundColor Green
    $response2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# Test 3: Guest lookup WITHOUT contact info (should fail)
Write-Host "`nTest 3: Guest lookup without contact info (should return 400)" -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef" -Method GET -ContentType "application/json"
    Write-Host "❌ Should have failed but got:" -ForegroundColor Red
    $response3.Content
} catch {
    Write-Host "✅ Expected error:" -ForegroundColor Green
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 1

# Test 4: Guest lookup WITH wrong email (should fail with security message)
Write-Host "`nTest 4: Guest lookup with wrong email (should return 404)" -ForegroundColor Yellow
try {
    $response4 = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef?contactEmail=wrong@email.com" -Method GET -ContentType "application/json"
    Write-Host "❌ Should have failed but got:" -ForegroundColor Red
    $response4.Content
} catch {
    Write-Host "✅ Expected error (security: same as not found):" -ForegroundColor Green
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 1

# Test 5: Authenticated lookup (if you have a JWT token)
Write-Host "`nTest 5: Authenticated lookup with JWT" -ForegroundColor Yellow
$jwtToken = "YOUR_JWT_TOKEN_HERE"  # Replace with actual JWT
if ($jwtToken -ne "YOUR_JWT_TOKEN_HERE") {
    try {
        $headers = @{
            "Authorization" = "Bearer $jwtToken"
            "Content-Type" = "application/json"
        }
        $response5 = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef" -Method GET -Headers $headers
        Write-Host "✅ Success (authenticated, no contact verification needed):" -ForegroundColor Green
        $response5.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipped (no JWT token provided)" -ForegroundColor Gray
}

Write-Host "`n====== RATE LIMIT TEST ======`n" -ForegroundColor Cyan

# Test 6: Rate limiting (try 12 times to trigger limit)
Write-Host "Test 6: Rate limiting - making 12 rapid requests..." -ForegroundColor Yellow
$successCount = 0
$rateLimitCount = 0

for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/bookings/$bookingRef?contactEmail=ratelimit@test.com" -Method GET -ContentType "application/json" -ErrorAction Stop
        $successCount++
        Write-Host "  Request $i : ✅ Success/Expected Error" -ForegroundColor Gray
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitCount++
            Write-Host "  Request $i : 🚫 RATE LIMITED (Expected after 10 attempts)" -ForegroundColor Red
        } else {
            Write-Host "  Request $i : ⚠️  Other error: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "`nRate Limit Summary:" -ForegroundColor Cyan
Write-Host "  - Allowed requests: $successCount" -ForegroundColor Green
Write-Host "  - Rate limited: $rateLimitCount" -ForegroundColor Red
if ($rateLimitCount -gt 0) {
    Write-Host "  ✅ Rate limiting is working correctly!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Rate limiting might not be working (check Redis)" -ForegroundColor Yellow
}

Write-Host "`n====== TEST COMPLETE ======`n" -ForegroundColor Cyan
