#!/usr/bin/env pwsh

# Study Smart Kubernetes Route Testing Script
# This script tests all routes across the microservices

$ErrorActionPreference = "Stop"

# Configuration
$NAMESPACE = "study-smart"
$API_BASE = "http://localhost"
$API_GATEWAY_PORT = "80"

# Color output
$colors = @{
    Green = "Green"
    Red = "Red"
    Yellow = "Yellow"
    Blue = "Blue"
}

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n" -ForegroundColor $colors.Blue
    Write-Host "=" * 80 -ForegroundColor $colors.Blue
    Write-Host "🧪 $Title" -ForegroundColor $colors.Blue
    Write-Host "=" * 80 -ForegroundColor $colors.Blue
}

function Write-TestCase {
    param([string]$Method, [string]$Route, [string]$Description)
    Write-Host "▶ $Method $Route - $Description" -ForegroundColor $colors.Yellow
}

function Test-Route {
    param(
        [string]$Method,
        [string]$Route,
        [string]$Description,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    Write-TestCase -Method $Method -Route $Route -Description $Description
    
    try {
        $url = "$API_BASE/$Route"
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params["Body"] = $Body | ConvertTo-Json
            $params["ContentType"] = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor $colors.Green
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 401) {
            Write-Host "⚠️  UNAUTHORIZED (401) - Auth required" -ForegroundColor $colors.Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "⚠️  NOT FOUND (404)" -ForegroundColor $colors.Yellow
        } else {
            Write-Host "❌ FAILED - $($_.Exception.Message)" -ForegroundColor $colors.Red
        }
        return $null
    }
}

# ============================================================================
# STEP 1: Check Kubernetes Status
# ============================================================================
Write-TestHeader "Checking Kubernetes Cluster"

try {
    $nodes = kubectl get nodes -o json | ConvertFrom-Json
    Write-Host "✅ Kubernetes cluster is running" -ForegroundColor $colors.Green
    Write-Host "📊 Nodes: $($nodes.items.Count)"
} catch {
    Write-Host "❌ Kubernetes cluster not accessible" -ForegroundColor $colors.Red
    Write-Host "   Make sure: docker desktop/minikube/k3s is running" -ForegroundColor $colors.Yellow
    exit 1
}

# ============================================================================
# STEP 2: Check Namespace
# ============================================================================
Write-TestHeader "Checking Study Smart Namespace"

try {
    $ns = kubectl get namespace $NAMESPACE 2>$null
    Write-Host "✅ Namespace '$NAMESPACE' exists" -ForegroundColor $colors.Green
} catch {
    Write-Host "⚠️  Namespace '$NAMESPACE' not found. Creating..." -ForegroundColor $colors.Yellow
    kubectl apply -f kubernetes/namespaces/study-smart.yaml
}

# ============================================================================
# STEP 3: Check Deployed Services
# ============================================================================
Write-TestHeader "Checking Deployed Services"

$services = @("crud-service", "forum-service", "payment-service", "postgres")

foreach ($service in $services) {
    try {
        $pod = kubectl get pod -n $NAMESPACE -l "app=$service" --no-headers 2>$null
        if ($pod) {
            Write-Host "✅ $service is running" -ForegroundColor $colors.Green
        } else {
            Write-Host "⚠️  $service not found in pods" -ForegroundColor $colors.Yellow
        }
    } catch {
        Write-Host "⚠️  Cannot verify $service status" -ForegroundColor $colors.Yellow
    }
}

# ============================================================================
# STEP 4: Port Forward Services (if needed)
# ============================================================================
Write-TestHeader "Setting up Port Forwarding"

Write-Host "Attempting to access services via port 80 (nginx ingress)..." -ForegroundColor $colors.Yellow
Write-Host "If services are not accessible, use:" -ForegroundColor $colors.Yellow
Write-Host "  kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:80" -ForegroundColor $colors.Blue

# ============================================================================
# STEP 5: Test Frontend Routes
# ============================================================================
Write-TestHeader "Testing Frontend Routes (Public)"

@(
    @{ Method = "GET"; Route = ""; Description = "Home page" }
    @{ Method = "GET"; Route = "signin"; Description = "Sign in page" }
    @{ Method = "GET"; Route = "signup"; Description = "Sign up page" }
    @{ Method = "GET"; Route = "forum"; Description = "Forum page" }
) | ForEach-Object {
    Test-Route @_
}

# ============================================================================
# STEP 6: Test Auth Routes
# ============================================================================
Write-TestHeader "Testing Auth Routes"

$registerBody = @{
    name = "Test User"
    email = "testuser@example.com"
    password = "TestPass123"
    role = "buyer"
} | ConvertTo-Json

$loginBody = @{
    email = "testuser@example.com"
    password = "TestPass123"
} | ConvertTo-Json

$authToken = $null
Test-Route -Method "POST" -Route "api/users/register" -Description "Register user" -Body $registerBody

$loginResponse = Test-Route -Method "POST" -Route "api/users/login" -Description "Login user" -Body $loginBody
if ($loginResponse) {
    try {
        $authToken = ($loginResponse.Content | ConvertFrom-Json).token
        Write-Host "   🔑 Got auth token" -ForegroundColor $colors.Green
    } catch {
        Write-Host "   ⚠️  Could not extract token from response" -ForegroundColor $colors.Yellow
    }
}

# ============================================================================
# STEP 7: Test CRUD Service Routes (Books)
# ============================================================================
Write-TestHeader "Testing CRUD Service - Books"

@(
    @{ Method = "GET"; Route = "api/crud/books"; Description = "Get all books" }
    @{ Method = "GET"; Route = "api/crud/books/1"; Description = "Get book by ID" }
    @{ Method = "GET"; Route = "api/crud/books/search/algorithms"; Description = "Search books" }
    @{ Method = "GET"; Route = "api/crud/books/seller/1"; Description = "Get books by seller" }
) | ForEach-Object {
    Test-Route @_
}

# ============================================================================
# STEP 8: Test Protected CRUD Routes (with Auth)
# ============================================================================
Write-TestHeader "Testing CRUD Service - Protected Routes"

if ($authToken) {
    $headers = @{
        "Authorization" = "Bearer $authToken"
    }
    
    $createBookBody = @{
        title = "Test Book"
        description = "A test book"
        price = 500
        condition = "New"
        category = "Textbooks"
        stock = 5
    } | ConvertTo-Json
    
    @(
        @{ Method = "GET"; Route = "api/crud/users/profile/1"; Description = "Get user profile" }
        @{ Method = "POST"; Route = "api/crud/books"; Description = "Create book" }
        @{ Method = "GET"; Route = "api/crud/orders/my-orders"; Description = "Get my orders" }
    ) | ForEach-Object {
        if ($_.Route -eq "api/crud/books") {
            Test-Route @_ -Headers $headers -Body $createBookBody
        } else {
            Test-Route @_ -Headers $headers
        }
    }
} else {
    Write-Host "⚠️  Skipping protected routes - no auth token available" -ForegroundColor $colors.Yellow
}

# ============================================================================
# STEP 9: Test Forum Service Routes
# ============================================================================
Write-TestHeader "Testing Forum Service - Questions"

@(
    @{ Method = "GET"; Route = "api/forum/questions"; Description = "Get all questions" }
    @{ Method = "GET"; Route = "api/forum/questions/trending"; Description = "Get trending questions" }
    @{ Method = "GET"; Route = "api/forum/questions/1"; Description = "Get question by ID" }
) | ForEach-Object {
    Test-Route @_
}

# ============================================================================
# STEP 10: Test Payment Service Routes
# ============================================================================
Write-TestHeader "Testing Payment Service"

@(
    @{ Method = "GET"; Route = "api/payments/payment-status/1"; Description = "Get payment status" }
) | ForEach-Object {
    Test-Route @_
}

if ($authToken) {
    $headers = @{
        "Authorization" = "Bearer $authToken"
    }
    
    $paymentBody = @{
        amount = 500
        currency = "USD"
    } | ConvertTo-Json
    
    @(
        @{ Method = "POST"; Route = "api/payments/create-payment"; Description = "Create payment" }
    ) | ForEach-Object {
        Test-Route @_ -Headers $headers -Body $paymentBody
    }
}

# ============================================================================
# STEP 11: Test Notes Routes
# ============================================================================
Write-TestHeader "Testing CRUD Service - Notes"

@(
    @{ Method = "GET"; Route = "api/crud/notes"; Description = "Get all notes" }
    @{ Method = "GET"; Route = "api/crud/notes/1"; Description = "Get note by ID" }
) | ForEach-Object {
    Test-Route @_
}

# ============================================================================
# STEP 12: Health Check
# ============================================================================
Write-TestHeader "Service Health Checks"

$services = @("crud", "forum", "payment")
foreach ($service in $services) {
    Test-Route -Method "GET" -Route "api/$service/health" -Description "$service health check"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-TestHeader "Test Summary"

Write-Host "
✅ Route Testing Complete!

📊 What to check:
  1. ✅ = Route is accessible
  2. ⚠️  = Route requires auth or not found (expected for some)
  3. ❌ = Route failed (may need debugging)

🔗 Useful kubectl commands:
  - kubectl get pods -n study-smart
  - kubectl get svc -n study-smart
  - kubectl logs -n study-smart <pod-name>
  - kubectl port-forward -n study-smart svc/api-gateway 8080:80
  - kubectl exec -it -n study-smart <pod-name> -- /bin/sh

📝 Notes:
  - If using local Kubernetes, set up port-forwarding
  - Add 'api.studysmart.com' and 'studysmart.com' to your hosts file for DNS
  - Check firewall/network policies if routes fail
" -ForegroundColor $colors.Green
