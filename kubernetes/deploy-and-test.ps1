#!/usr/bin/env pwsh

# Study Smart Kubernetes Deployment & Testing Script
# Deploys all services and tests all routes

$ErrorActionPreference = "Continue"

$NAMESPACE = "study-smart"
$KUBE_DIR = "kubernetes"

# Colors
function Write-Step { Write-Host "`n✨ $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }

# ============================================================================
# STEP 1: Verify Kubernetes is Running
# ============================================================================
Write-Step "Verifying Kubernetes cluster..."

try {
    $nodes = kubectl get nodes --no-headers 2>$null
    if ($nodes) {
        Write-Success "Kubernetes cluster is running"
    }
} catch {
    Write-Error "Kubernetes not found. Please start Docker Desktop, Minikube, or K3s"
    exit 1
}

# ============================================================================
# STEP 2: Create/Verify Namespace
# ============================================================================
Write-Step "Setting up namespace '$NAMESPACE'..."

kubectl apply -f "$KUBE_DIR/namespaces/study-smart.yaml"
Write-Success "Namespace ready"

# ============================================================================
# STEP 3: Create ConfigMaps
# ============================================================================
Write-Step "Applying ConfigMaps..."

Get-ChildItem "$KUBE_DIR/configmaps/" -Filter "*.yaml" | ForEach-Object {
    Write-Host "  📋 Applying $($_.Name)..."
    kubectl apply -f $_.FullName
}
Write-Success "ConfigMaps applied"

# ============================================================================
# STEP 4: Create Secrets
# ============================================================================
Write-Step "Applying Secrets..."

Get-ChildItem "$KUBE_DIR/secrets/" -Filter "*.yaml" | ForEach-Object {
    Write-Host "  🔐 Applying $($_.Name)..."
    kubectl apply -f $_.FullName
}
Write-Success "Secrets applied"

# ============================================================================
# STEP 5: Create Storage
# ============================================================================
Write-Step "Setting up Storage..."

Get-ChildItem "$KUBE_DIR/storage/" -Filter "*.yaml" | ForEach-Object {
    Write-Host "  💾 Applying $($_.Name)..."
    kubectl apply -f $_.FullName
}
Write-Success "Storage configured"

# ============================================================================
# STEP 6: Deploy Database
# ============================================================================
Write-Step "Deploying PostgreSQL..."

kubectl apply -f "$KUBE_DIR/deployments/postgres-deployment.yaml"
kubectl apply -f "$KUBE_DIR/services/postgres-service.yaml"

Write-Warning "Waiting for PostgreSQL to be ready (this may take a minute)..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s 2>$null || Write-Warning "PostgreSQL startup taking longer..."
Write-Success "PostgreSQL deployed"

# ============================================================================
# STEP 7: Deploy Services
# ============================================================================
Write-Step "Deploying Microservices..."

$services = @("crud", "forum", "payment")
foreach ($service in $services) {
    Write-Host "  🚀 Deploying $service-service..."
    kubectl apply -f "$KUBE_DIR/deployments/${service}-deployment.yaml"
    kubectl apply -f "$KUBE_DIR/services/${service}-service.yaml"
}
Write-Success "Microservices deployed"

# ============================================================================
# STEP 8: Wait for Deployments
# ============================================================================
Write-Step "Waiting for all deployments to be ready..."

foreach ($service in $services) {
    Write-Host "  ⏳ Waiting for $service..."
    kubectl wait --for=condition=available --timeout=300s deployment/$service-service -n $NAMESPACE 2>$null || Write-Warning "$service taking longer..."
}
Write-Success "All deployments ready"

# ============================================================================
# STEP 9: Setup Ingress
# ============================================================================
Write-Step "Setting up Ingress..."

kubectl apply -f "$KUBE_DIR/ingress/ingress.yaml"
Write-Success "Ingress configured"

# ============================================================================
# STEP 10: Setup HPA (Auto-scaling)
# ============================================================================
Write-Step "Setting up Horizontal Pod Autoscaling..."

Get-ChildItem "$KUBE_DIR/hpa/" -Filter "*.yaml" | ForEach-Object {
    Write-Host "  📈 Applying $($_.Name)..."
    kubectl apply -f $_.FullName
}
Write-Success "HPA configured"

# ============================================================================
# STEP 11: Port Forwarding (if needed)
# ============================================================================
Write-Step "Port Forwarding Setup"

Write-Host "To access the services, run one of these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:80" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n $NAMESPACE svc/crud-service 3003:3003" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n $NAMESPACE svc/forum-service 3002:3002" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n $NAMESPACE svc/payment-service 3001:3001" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# STEP 12: Show Deployment Status
# ============================================================================
Write-Step "Deployment Status"

Write-Host "Pods:" -ForegroundColor Cyan
kubectl get pods -n $NAMESPACE

Write-Host "`nServices:" -ForegroundColor Cyan
kubectl get svc -n $NAMESPACE

Write-Host "`nDeployments:" -ForegroundColor Cyan
kubectl get deployments -n $NAMESPACE

# ============================================================================
# STEP 13: Run Route Tests
# ============================================================================
Write-Step "Testing Routes"

Write-Host "Running comprehensive route tests..." -ForegroundColor Cyan
Write-Host ""

# Run the test script
. "$KUBE_DIR/test-routes.ps1"

Write-Success "Deployment and testing complete!"
