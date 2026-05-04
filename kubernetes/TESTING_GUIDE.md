# Kubernetes Testing Guide for Study Smart

This guide walks you through deploying Study Smart to Kubernetes and testing all routes.

## 📋 Prerequisites

### Required
- Docker Desktop OR Minikube OR K3s (local Kubernetes)
- `kubectl` CLI installed and configured
- `curl` or PowerShell (for testing)
- 8GB+ RAM available

### Optional but Recommended
- `helm` (for easier deployments)
- `kubectx` (for switching contexts)
- VS Code with Kubernetes extension

## 🚀 Quick Start

### Option 1: Full Deployment + Testing (PowerShell - Windows/WSL)

```powershell
cd kubernetes
.\deploy-and-test.ps1
```

This single command will:
1. Create namespace
2. Apply ConfigMaps and Secrets
3. Deploy PostgreSQL
4. Deploy all microservices (CRUD, Forum, Payment)
5. Setup Ingress
6. Configure HPA
7. Run all route tests

### Option 2: Full Deployment + Testing (Bash - Linux/macOS/WSL)

```bash
cd kubernetes
chmod +x deploy-and-test.sh
./deploy-and-test.sh
```

### Option 3: Manual Step-by-Step

```bash
# 1. Create namespace
kubectl apply -f kubernetes/namespaces/study-smart.yaml

# 2. Apply configuration
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/storage/

# 3. Deploy database
kubectl apply -f kubernetes/deployments/postgres-deployment.yaml
kubectl apply -f kubernetes/services/postgres-service.yaml

# 4. Deploy microservices
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/

# 5. Setup ingress
kubectl apply -f kubernetes/ingress/ingress.yaml

# 6. Test routes
./kubernetes/test-routes.sh
# or
.\kubernetes\test-routes.ps1
```

## 🧪 Testing Routes

### Using PowerShell (Windows/WSL)
```powershell
.\kubernetes\test-routes.ps1
```

### Using Bash (Linux/macOS/WSL)
```bash
bash kubernetes/test-routes.sh
```

### Manual Testing with curl

```bash
# Set base URL
export API_BASE="http://localhost"

# Test public routes
curl $API_BASE/
curl $API_BASE/api/books
curl $API_BASE/api/forum/questions

# Register and login to get auth token
curl -X POST $API_BASE/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Pass123","role":"buyer"}'

# Login
curl -X POST $API_BASE/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}' | jq .

# Use token for protected routes
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" $API_BASE/api/users/profile/1
```

## 📊 Deployment Structure

```
kubernetes/
├── namespaces/           # Namespace definitions
│   └── study-smart.yaml
├── configmaps/           # Configuration data
│   ├── app-config.yaml
│   └── nginx-config.yaml
├── secrets/              # Sensitive data
│   └── db-secrets.yaml
├── deployments/          # Service deployments
│   ├── crud-deployment.yaml
│   ├── forum-deployment.yaml
│   ├── payment-deployment.yaml
│   └── postgres-deployment.yaml
├── services/             # Service definitions
│   ├── crud-service.yaml
│   ├── forum-service.yaml
│   ├── payment-service.yaml
│   └── postgres-service.yaml
├── ingress/              # Ingress configuration
│   └── ingress.yaml
├── hpa/                  # Horizontal Pod Autoscaling
│   └── autoscaling.yaml
├── storage/              # Storage configuration
│   └── postgres-pvc.yaml
├── test-routes.ps1       # PowerShell testing script
├── test-routes.sh        # Bash testing script
└── deploy-and-test.ps1   # Full deployment script
```

## 🔗 Service Ports & Routing

### Internal Service Ports
- **CRUD Service**: 3003
- **Forum Service**: 3002
- **Payment Service**: 3001
- **PostgreSQL**: 5432
- **Nginx Ingress**: 80/443

### API Routes
```
/api/users/       → CRUD Service
/api/books/       → CRUD Service
/api/notes/       → CRUD Service
/api/orders/      → CRUD Service
/api/forum/       → Forum Service
/api/payments/    → Payment Service
```

## 🔌 Port Forwarding

If using local Kubernetes without Ingress DNS setup:

```bash
# Forward to API Gateway
kubectl port-forward -n study-smart svc/api-gateway 8080:80

# Forward to specific services
kubectl port-forward -n study-smart svc/crud-service 3003:3003
kubectl port-forward -n study-smart svc/forum-service 3002:3002
kubectl port-forward -n study-smart svc/payment-service 3001:3001

# Then access via http://localhost:8080
```

## 📡 Testing All Routes

### Frontend Routes (Public - No Auth)
```
GET  /                          # Home
GET  /signin                    # Sign in
GET  /signup                    # Sign up
GET  /forum                     # Forum
GET  /product/:id               # Product detail
```

### API Routes - Books (Public)
```
GET  /api/books                 # Get all books
GET  /api/books/:id             # Get single book
GET  /api/books/seller/:id      # Get seller's books
GET  /api/books/search/:query   # Search books
```

### API Routes - Books (Protected)
```
POST   /api/books               # Create book (seller)
PUT    /api/books/:id           # Update book (seller)
DELETE /api/books/:id           # Delete book (seller)
```

### API Routes - Forum (Public)
```
GET  /api/forum/questions       # Get questions
GET  /api/forum/questions/:id   # Get question detail
```

### API Routes - Forum (Protected)
```
POST   /api/forum/questions     # Create question
POST   /api/forum/questions/:id/vote  # Vote on question
```

### API Routes - Orders (Protected)
```
GET    /api/orders/my-orders    # Get my orders
POST   /api/orders              # Create order
GET    /api/orders/:id          # Get order detail
PUT    /api/orders/:id/status   # Update order status
```

### API Routes - Payments (Protected)
```
POST   /api/payments/create-payment      # Create payment
GET    /api/payments/payment-status/:id  # Check payment status
POST   /api/payments/refund/:id          # Process refund
```

## 🐛 Debugging

### View Deployment Status
```bash
kubectl get deployments -n study-smart
kubectl get pods -n study-smart
kubectl get svc -n study-smart
```

### View Logs
```bash
# View logs from specific pod
kubectl logs -n study-smart <pod-name>

# View logs in real-time
kubectl logs -f -n study-smart <pod-name>

# View logs from specific container
kubectl logs -n study-smart <pod-name> -c crud
```

### Describe Resources
```bash
# Describe deployment
kubectl describe deployment crud-service -n study-smart

# Describe pod
kubectl describe pod <pod-name> -n study-smart

# Describe service
kubectl describe service crud-service -n study-smart
```

### Execute Commands in Pod
```bash
# Open shell in pod
kubectl exec -it -n study-smart <pod-name> -- /bin/bash

# Run command
kubectl exec -n study-smart <pod-name> -- npm run test
```

### Check Events
```bash
kubectl get events -n study-smart --sort-by='.lastTimestamp'
```

## ⚙️ Configuration

### Environment Variables
Check `kubernetes/configmaps/app-config.yaml` for service configuration:
- `NODE_ENV`: production
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `JWT_SECRET`: (set in secrets)

### Scaling Services
```bash
# Scale CRUD service to 5 replicas
kubectl scale deployment crud-service -n study-smart --replicas=5

# View autoscaling status
kubectl get hpa -n study-smart
```

### Resource Limits
Current limits per service (in deployment manifests):
- CPU Request: 250m, Limit: 500m
- Memory Request: 256Mi, Limit: 512Mi

Adjust in deployment YAML files as needed.

## 📈 Monitoring

### Check Metrics (requires metrics-server)
```bash
kubectl top nodes
kubectl top pods -n study-smart
```

### View Ingress Status
```bash
kubectl get ingress -n study-smart
kubectl describe ingress study-smart-ingress -n study-smart
```

## 🧹 Cleanup

### Delete Everything
```bash
# Delete all resources in namespace
kubectl delete namespace study-smart

# Delete specific resource
kubectl delete deployment crud-service -n study-smart
kubectl delete service crud-service -n study-smart
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Namespace created: `kubectl get namespace study-smart`
- [ ] Pods running: `kubectl get pods -n study-smart`
- [ ] Services created: `kubectl get svc -n study-smart`
- [ ] PostgreSQL ready: `kubectl logs -n study-smart postgres-0`
- [ ] CRUD service healthy: `curl http://localhost/api/books`
- [ ] Forum service healthy: `curl http://localhost/api/forum/questions`
- [ ] Auth working: Can register and login
- [ ] Protected routes accessible with token
- [ ] All test routes passing (run test scripts)

## 🆘 Common Issues

### Services not accessible
**Solution**: Enable port forwarding
```bash
kubectl port-forward -n study-smart svc/api-gateway 8080:80
```

### Database connection failed
**Solution**: Check PostgreSQL status
```bash
kubectl logs -n study-smart postgres-0
kubectl describe pod postgres-0 -n study-smart
```

### Ingress not working
**Solution**: Verify ingress controller and add hosts file entry
```bash
# Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows)
127.0.0.1 api.studysmart.com studysmart.com
```

### Pods stuck in Pending
**Solution**: Check resource availability
```bash
kubectl describe node
kubectl describe pod <pending-pod> -n study-smart
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/features/kubernetes/)
