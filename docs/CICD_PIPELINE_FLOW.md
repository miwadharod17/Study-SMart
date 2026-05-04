# CI/CD Pipeline Flow

## Complete Pipeline Architecture

This document describes the complete CI/CD flow with SonarQube integration for the Study-Smart project.

## End-to-End Flow

### Trigger Points

1. **GitHub Push to main/develop**
   ```
   git push origin main
   ↓
   GitHub Actions triggered
   ↓
   Jenkins triggered via webhook
   ```

2. **Pull Request**
   ```
   GitHub PR created
   ↓
   SonarQube PR analysis
   ↓
   Quality gate check
   ↓
   Report back to GitHub
   ```

## Pipeline Stages

### 1. Checkout & Prepare
**Duration:** ~30 seconds

```
┌─────────────────────────────┐
│  GitHub Webhook Triggered   │
└────────────┬────────────────┘
             │
             ↓
┌─────────────────────────────┐
│  Clone Repository           │
│  - Fetch full history       │
│  - Record git info          │
└────────────┬────────────────┘
```

### 2. SonarQube Analysis
**Duration:** 2-5 minutes (depends on project size)

```
┌──────────────────────────────┐
│  Run npm install             │
│  Install dependencies        │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│  npm run test:coverage       │
│  Generate coverage reports   │
│  (lcov.info, cobertura.xml)  │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│  sonar-scanner               │
│  - Analyze source code       │
│  - Upload to SonarQube       │
│  - Security scan             │
│  - Duplication analysis      │
└────────────┬─────────────────┘
```

### 3. Quality Gate Check ⚠️ **CRITICAL**
**Duration:** 30 seconds to 2 minutes

```
┌──────────────────────────────────┐
│  waitForQualityGate()             │
│  (max timeout: 5 minutes)         │
│                                   │
│  Evaluates:                       │
│  ✓ Code coverage ≥ 80%           │
│  ✓ Duplication ≤ 10%             │
│  ✓ Security hotspots reviewed    │
│  ✓ No critical bugs              │
│  ✓ No blocker issues             │
└────────┬────────────────┬────────┘
         │                │
         ↓ PASS           ↓ FAIL
     Continue...      ⛔ BLOCK
                      Rollback
```

**If Quality Gate FAILS:**
- Build stopped
- Slack notification sent
- PR comment added (if applicable)
- Developer must fix issues

### 4. Docker Build
**Duration:** 2-5 minutes (parallel)

```
┌──────────────────────────────┐
│  Build 4 Docker Images       │
│  (in parallel)               │
├──────────────────────────────┤
│ ┌────────────┐ ┌──────────┐ │
│ │ Payment    │ │ Forum    │ │
│ │ Service    │ │ Service  │ │
│ └────┬───────┘ └────┬─────┘ │
│ ┌────┴───────┐ ┌────┴─────┐ │
│ │ CRUD       │ │ Frontend │ │
│ │ Service    │ │          │ │
│ └────────────┘ └──────────┘ │
├──────────────────────────────┤
│ Tags:                        │
│ - docker.io/studysmart/xxx   │
│ - :BUILD_NUMBER (e.g., :123) │
│ - :latest                    │
└──────────┬───────────────────┘
           │
           ↓
```

### 5. Push to Registry
**Duration:** 1-3 minutes

```
┌──────────────────────────────┐
│  docker login                │
│  Registry authentication     │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│  docker push                 │
│  - payment-service:123       │
│  - forum-service:123         │
│  - crud-service:123          │
│  - frontend:123              │
│  (4 parallel pushes)         │
└────────────┬─────────────────┘
```

### 6. Kubernetes Deployment
**Duration:** 2-5 minutes

```
┌──────────────────────────────────┐
│  kubectl set image ...           │
│  Update deployment image refs    │
│                                  │
│  Update 4 deployments:           │
│  1. payment-service              │
│  2. forum-service                │
│  3. crud-service                 │
│  4. frontend                      │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  kubectl rollout status          │
│  Wait for all pods ready         │
│  - Health checks pass            │
│  - Ready = Running ✓             │
│  - Timeout: 5 minutes            │
└────────────┬─────────────────────┘
```

### 7. Smoke Tests
**Duration:** 30 seconds - 2 minutes

```
┌──────────────────────────────┐
│  Wait 10 seconds             │
│  (services to stabilize)     │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│  curl /api/health            │
│  API Gateway health check    │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│  curl /                      │
│  Frontend health check       │
└────────────┬─────────────────┘
```

### 8. Rollback (if failure)
**Duration:** 1-2 minutes

```
┌──────────────────────────────────┐
│  If any stage fails:             │
│                                  │
│  kubectl rollout undo            │
│  - Revert all 4 deployments      │
│  - Return to previous version    │
│  - Restore service stability     │
└──────────────┬───────────────────┘
               │
               ↓
        ⚠️ INVESTIGATE
```

## Timeline Example

```
13:00:01 - GitHub push detected
13:00:05 - Checkout complete
13:00:35 - Dependencies installed
13:01:00 - Tests running...
13:02:30 - Test coverage generated
13:03:00 - SonarQube analysis starting
13:05:00 - SonarQube analysis complete
13:05:15 - Quality gate: EVALUATING...
13:05:45 - Quality gate: ✅ PASSED
13:06:00 - Docker build starting (4 parallel)
13:09:00 - Docker images built
13:09:30 - Pushing to registry...
13:12:00 - Registry push complete
13:12:15 - Kubernetes deployment starting
13:12:30 - Deployments updated
13:15:00 - Rollout complete ✅
13:15:30 - Smoke tests running...
13:16:00 - Smoke tests passed ✅
13:16:15 - Slack notification sent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~16 minutes from push to live ✨
```

## Failure Scenarios

### Scenario 1: Quality Gate Fails
```
Timeline:
- SonarQube Analysis: ✅ Complete
- Quality Gate Check: ❌ FAILED
  - Reason: Test coverage 75% < 80% required
  - Coverage found: 15 new lines uncovered
  
Actions:
1. Build STOPPED
2. Slack notification sent
3. PR comment: "Quality gate failed - coverage too low"
4. Developer adds tests
5. git push (triggers new build)
```

### Scenario 2: Docker Build Fails
```
Timeline:
- Quality Gate: ✅ Passed
- Docker Build: ❌ FAILED
  - Reason: payment-service build error
  - Error: npm ERR! Not a tarballs tarball

Actions:
1. Build STOPPED
2. Docker build logs available in Jenkins
3. Slack alert: "Docker build failed"
4. Developer fixes Dockerfile
5. git push (triggers new build)
```

### Scenario 3: Kubernetes Deployment Fails
```
Timeline:
- Quality Gate: ✅ Passed
- Docker Build: ✅ Complete
- Registry Push: ✅ Complete
- K8s Deployment: ❌ FAILED
  - Reason: CrashLoopBackOff (pod crash)
  
Actions:
1. Rollout status: FAILED
2. AUTOMATIC ROLLBACK triggered
3. Previous version restored
4. Slack alert: "Deployment failed - rolled back"
5. Investigate pod logs
6. Fix and redeploy
```

## Monitoring During Pipeline

### Jenkins Console
Monitor build progress in real-time:
```
http://jenkins.studysmart.com/job/study-smart-main/BUILD_NUMBER/console
```

### Kubernetes Events
```bash
kubectl get events -n study-smart --sort-by='.lastTimestamp'
kubectl describe deployment/payment-service -n study-smart
```

### SonarQube Dashboard
```
http://sonarqube.studysmart.com/dashboard
```

### Grafana Monitoring
```
http://grafana.studysmart.com:3005
- Dashboard: SonarQube Code Quality
- Dashboard: Kubernetes Deployments
- Dashboard: Application Metrics
```

## Notifications & Alerts

### Slack Integration
**Success Message:**
```
✅ Deployment Successful!
Build: #456
Branch: main
Quality Gate: PASSED
Docker: PUSHED
Kubernetes: DEPLOYED
```

**Failure Message:**
```
❌ Deployment Failed!
Build: #455
Branch: main
Failed Stage: Quality Gate
Error: Test coverage 75% < 80%
```

### GitHub Pull Request Comments
- Quality gate results posted
- SonarQube findings linked
- Coverage changes highlighted

### Email Alerts
- Critical failures
- Security issues
- Quality gate blocks

## Rollback Procedures

### Automatic Rollback (on failure)
```
Failed Smoke Test → Immediate kubectl rollout undo
```

### Manual Rollback
```bash
kubectl rollout undo deployment/payment-service -n study-smart
kubectl rollout undo deployment/forum-service -n study-smart
kubectl rollout undo deployment/crud-service -n study-smart
kubectl rollout undo deployment/frontend -n study-smart
```

### View Rollout History
```bash
kubectl rollout history deployment/payment-service -n study-smart
```

## Performance Metrics

| Stage | Duration | Notes |
|-------|----------|-------|
| Checkout | 30 sec | Clone + setup |
| Dependencies | 1 min | npm install |
| Tests | 2 min | Unit tests |
| Coverage | 1 min | Report generation |
| SonarQube Analysis | 2 min | Code analysis |
| Quality Gate | 30 sec | Evaluation |
| Docker Build | 3 min | 4 images parallel |
| Registry Push | 2 min | Upload to Docker Hub |
| K8s Deploy | 3 min | Image rollout |
| Smoke Tests | 1 min | Health checks |
| **Total** | **~16 min** | End-to-end |

## Optimization Tips

1. **Parallel Execution**: Docker builds run in parallel, reducing build time
2. **Layer Caching**: Use BuildKit for faster image builds
3. **Database Optimization**: Separate PostgreSQL for SonarQube
4. **Resource Allocation**: 2GB+ RAM for SonarQube instance
5. **Network**: Ensure low-latency access between all components

## Security Considerations

1. **Quality Gates Block Bad Code**: Non-negotiable security check
2. **Secret Management**: Tokens stored in Jenkins/GitHub secrets
3. **Registry Authentication**: Docker registry access controlled
4. **Kubernetes RBAC**: Deployment permissions limited
5. **Audit Logging**: All deployments logged
6. **Monitoring**: Real-time alerts on failures

---

**Last Updated:** 2024
**Maintained By:** DevOps Team
