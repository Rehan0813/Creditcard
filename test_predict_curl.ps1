
# Function to send prediction request
function Test-Prediction {
    param (
        [string]$Name,
        [hashtable]$Data,
        [hashtable]$Headers,
        [string]$Url
    )

    Write-Host "`n--- Testing: $Name ---"
    Write-Host "Amount: $($Data.amount)"
    try {
        $resp = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body ($Data | ConvertTo-Json)
        Write-Host "Fraud Score: $($resp.fraud_score)"
        Write-Host "Risk Level: $($resp.risk_level)"
        # Write-Host "Response: $($resp | ConvertTo-Json -Depth 2)"
    } catch {
        Write-Host "Request failed: $_"
        Write-Host $_.Exception.Response
    }
}

# 1. Login to get token
$loginUrl = "http://127.0.0.1:8001/api/auth/login"
$loginBody = @{
    email = "test@example.com"
    password = "password123"
}

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "Logging in..."
    $loginResp = Invoke-RestMethod -Uri $loginUrl -Method Post -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $token = $loginResp.access_token
    Write-Host "Got token."
    $headers["Authorization"] = "Bearer $token"
} catch {
    Write-Host "Login failed. Trying to signup..."
    $signupUrl = "http://127.0.0.1:8001/api/auth/signup"
    $signupBody = @{
        name = "Test User"
        email = "test@example.com"
        password = "password123"
    }
    try {
        $signupResp = Invoke-RestMethod -Uri $signupUrl -Method Post -Body ($signupBody | ConvertTo-Json) -ContentType "application/json"
        $token = $signupResp.access_token
        Write-Host "Signup successful. Got token."
        $headers["Authorization"] = "Bearer $token"
    } catch {
        Write-Host "Signup/Login failed: $_"
        exit 1
    }
}

$url = "http://127.0.0.1:8001/api/predict"

# Base transaction
$base = @{
    transaction_time = "07-02-2026 14:30"
    merchant_category = "groceries"
    country = "US"
    device_type = "mobile"
    payment_method = "credit_card"
    channel = "in_store"
    merchant_country = "US"
    transaction_count_24h = 1
    avg_amount_24h = 45.0
}

# Case 1: Low Amount
$case1 = $base.Clone()
$case1["amount"] = 10.0
Test-Prediction -Name "Low Amount" -Data $case1 -Headers $headers -Url $url

# Case 2: Normal Amount
$case2 = $base.Clone()
$case2["amount"] = 100.0
Test-Prediction -Name "Normal Amount" -Data $case2 -Headers $headers -Url $url

# Case 3: High Amount (but safe context)
$case3 = $base.Clone()
$case3["amount"] = 1000.0
Test-Prediction -Name "High Amount (Safe Context)" -Data $case3 -Headers $headers -Url $url

# Case 4: Very High Amount (Safe Context)
$case4 = $base.Clone()
$case4["amount"] = 5000.0
Test-Prediction -Name "Very High Amount (Safe Context)" -Data $case4 -Headers $headers -Url $url

# Case 5: High Amount + Risky Context (Night, Risky Category)
$case5 = $base.Clone()
$case5["amount"] = 5000.0
$case5["transaction_time"] = "07-02-2026 03:00"
$case5["merchant_category"] = "electronics"
Test-Prediction -Name "High Amount + Risky Context" -Data $case5 -Headers $headers -Url $url
