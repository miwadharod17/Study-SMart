# 🚀 Quick Start - Kubernetes Testing

## One Command Deployment + Testing

### Windows/WSL (PowerShell)
```powershell
cd kubernetes
.\deploy-and-test.ps1
```

### Linux/macOS (Bash)
```bash
cd kubernetes
bash deploy.sh
bash test-routes.sh
```

## Manual Testing Steps

### 1. Deploy Services
```bash
# One script does everything
bash kubernetes/deploy.sh

# Or deploy step-by-step:
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/storage/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/ingress/
```

### 2. Port Forward (if needed)
```bash
kubectl port-forward -n study-smart svc/api-gateway 8080:80
```

### 3. Run Tests
```bash
# Full automated test suite
bash kubernetes/test-routes.sh

# Manual route testing
bash kubernetes/manual-test.sh

# Or use curl directly
curl http://localhost/api/books
```

## 📡 All Routes to Test

### Public (No Auth Required)
```
GET  /                                  # Home
GET  /api/books                         # Browse books
GET  /api/books/:id                     # Book details
GET  /api/books/search/:query           # Search
GET  /api/forum/questions               # Forum questions
GET  /api/notes                         # Notes list
POST /api/users/register                # Register user
POST /api/users/login                   # Login user
```

### Protected (Auth Required)
```
GET  /dashboard                         # User dashboard
GET  /marketplace                       # Marketplace
GET  /api/users/profile/:id             # User profile
GET  /api/orders/my-orders              # My orders
POST /api/orders                        # Create order
POST /api/books                         # Create listing (seller)
POST /api/forum/questions               # Ask question
POST /api/payments/create-payment       # Create payment
```

## 🔍 Check Status

```bash
# View pods
kubectl get pods -n study-smart

# View services
kubectl get svc -n study-smart

# View logs
kubectl logs -f -n study-smart -l app=crud-service

# Describe pod
kubectl describe pod <pod-name> -n study-smart
```

## 🧪 Test Examples

### Get books
```bash
curl http://localhost/api/books | jq
```

### Register user
```bash
curl -X POST http://localhost/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "password": "Pass123",
    "role": "buyer"
  }'
```

### Login and get token
```bash
curl -X POST http://localhost/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123"}' | jq .token
```

### Use token for protected route
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/users/profile/1 | jq
```

## 📊 Test Suites Provided

| Script | Purpose | Language |
|--------|---------|----------|
| `deploy-and-test.ps1` | Full deployment + tests | PowerShell |
| `deploy.sh` | Deploy services | Bash |
| `test-routes.ps1` | Test all routes | PowerShell |
| `test-routes.sh` | Test all routes | Bash |
| `manual-test.sh` | Interactive route testing | Bash |
| `TESTING_GUIDE.md` | Comprehensive guide | Markdown |

## ✅ Verification Checklist

- [ ] Kubernetes running: `kubectl cluster-info`
- [ ] Namespace created: `kubectl get ns | grep study-smart`
- [ ] Pods running: `kubectl get pods -n study-smart`
- [ ] Services created: `kubectl get svc -n study-smart`
- [ ] Can reach API: `curl http://localhost/api/books`
- [ ] Can register: User registration endpoint works
- [ ] Can login: Get auth token
- [ ] Protected routes work: Use token to access profile

## 🆘 Quick Fixes

**Services not accessible?**
```bash
kubectl port-forward -n study-smart svc/api-gateway 8080:80
curl http://localhost:8080/api/books
```

**PostgreSQL failing?**
```bash
kubectl logs -n study-smart postgres-0
kubectl describe pod postgres-0 -n study-smart
```

**Pods not starting?**
```bash
kubectl get events -n study-smart --sort-by='.lastTimestamp'
kubectl describe pod <pod-name> -n study-smart
```

## 📚 Full Documentation

See `TESTING_GUIDE.md` for comprehensive setup, testing, and troubleshooting guide.
