# Run with: powershell -ExecutionPolicy Bypass -File test_backend.ps1
# Backend must be running: python main.py

$base = "http://127.0.0.1:8001"
$pass = "[PASS]"
$fail = "[FAIL]"

Write-Host "`n=== Backend API test (expect backend on port 8001) ===`n"

# 1. Health
Write-Host "1. GET /api/health"
try {
    $r = Invoke-RestMethod -Uri "$base/api/health" -Method Get -TimeoutSec 5
    if ($r.status -eq "ok") { Write-Host "   $pass $($r | ConvertTo-Json -Compress)" } else { Write-Host "   $fail $r" }
} catch {
    Write-Host "   $fail $($_.Exception.Message)"
    Write-Host "   Is the backend running? Run: python main.py"
    exit 1
}

# 2. Signup
Write-Host "`n2. POST /api/auth/signup"
$body = '{"name":"Test User","email":"test@example.com","password":"test123"}'
try {
    $r = Invoke-RestMethod -Uri "$base/api/auth/signup" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
    if ($r.access_token) { Write-Host "   $pass User created, got token" } else { Write-Host "   $fail $r" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -and $_.ErrorDetails.Message -match "already exists") {
        Write-Host "   $pass User already exists"
    } else {
        Write-Host "   $fail $($_.Exception.Message)"
    }
}

# 3. Login
Write-Host "`n3. POST /api/auth/login"
$body = '{"email":"test@example.com","password":"test123"}'
try {
    $r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
    if ($r.access_token) { Write-Host "   $pass Login OK, got token" } else { Write-Host "   $fail $r" }
} catch {
    Write-Host "   $fail $($_.Exception.Message)"
}

Write-Host "`n=== Backend is working. Use frontend at http://localhost:3003 ===`n"
