# SonarQube Integration Guide

## Overview

This document provides comprehensive guidance on the SonarQube integration with Study-Smart CI/CD pipeline. SonarQube is used for continuous code quality and security analysis, serving as a critical quality gate in the deployment pipeline.

## Architecture

The SonarQube integration follows this flow:

```
GitHub Push
    ↓
Jenkins Triggered (webhook)
    ↓
SonarQube Analysis
    ↓
Quality Gate Check ← ⚠️ BLOCKS if failed
    ↓
Docker Image Build
    ↓
Push to Registry
    ↓
Kubernetes Deployment
    ↓
Prometheus/Grafana Monitoring
```

## Setup Instructions

### 1. Local Development with Docker Compose

Start SonarQube locally for development and testing:

```bash
cd sonarqube
docker-compose up -d
```

SonarQube will be available at `http://localhost:9000`

**Default credentials:**
- Username: `admin`
- Password: `admin`

⚠️ **Change default password immediately in production!**

### 2. Configure SonarQube Jenkins Integration

In Jenkins, configure SonarQube server:

1. Navigate to **Manage Jenkins** → **Configure System**
2. Find **SonarQube Servers** section
3. Add a new server:
   - **Name:** SonarQube
   - **Server URL:** `http://sonarqube:9000`
   - **Server authentication token:** Create a token in SonarQube and add as Jenkins secret

### 3. Create SonarQube Token

In SonarQube:
1. Go to **Administration** → **Security** → **Users**
2. Click on admin user
3. Scroll to **Tokens** section
4. Generate new token
5. Store securely in Jenkins credentials

### 4. Kubernetes Deployment

Deploy SonarQube to Kubernetes:

```bash
# Create namespace if not exists
kubectl create namespace study-smart

# Apply configuration
kubectl apply -f kubernetes/configmaps/sonarqube-config.yaml
kubectl apply -f kubernetes/secrets/sonarqube-secrets.yaml
kubectl apply -f kubernetes/storage/sonarqube-pvc.yaml
kubectl apply -f kubernetes/deployments/postgres-sonar-deployment.yaml
kubectl apply -f kubernetes/deployments/sonarqube-deployment.yaml
kubectl apply -f kubernetes/ingress/sonarqube-ingress.yaml
```

Verify deployment:

```bash
kubectl get pods -n study-smart | grep sonarqube
kubectl logs -f deployment/sonarqube -n study-smart
```

### 5. GitHub Actions Configuration

Add secrets to GitHub repository:
- `SONAR_TOKEN`: SonarQube authentication token
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password
- `KUBECONFIG`: Base64-encoded kubeconfig
- `SLACK_WEBHOOK`: Slack webhook URL

```bash
# Example: Encode kubeconfig
cat ~/.kube/config | base64 -w 0
```

## Pipeline Stages

### Stage 1: Checkout
- Clones repository
- Stores git commit info

### Stage 2: SonarQube Analysis
- Installs dependencies
- Runs test coverage
- Executes SonarQube scanner
- Uploads results to SonarQube

### Stage 3: Quality Gate Check ⚠️ **CRITICAL**
- Waits for SonarQube to evaluate quality gate
- **Blocks deployment if quality gate fails**
- Prevents low-quality code from reaching production

### Stage 4: Docker Build
- Builds Docker images in parallel:
  - payment-service
  - forum-service
  - crud-service
  - frontend
- Tags with build number and latest

### Stage 5: Push to Registry
- Authenticates with Docker registry
- Pushes all images with build number tag

### Stage 6: Kubernetes Deployment
- Updates deployment image references
- Waits for rollout to complete
- Monitors health checks

### Stage 7: Smoke Tests
- Verifies deployed services respond to requests
- Checks API health endpoints

### Stage 8: Rollback (on failure)
- Automatically reverts to previous version if tests fail

## Code Quality Standards

### SonarQube Quality Profile

The project uses the **Sonar Way** quality profile with the following standards:

| Metric | Threshold | Status |
|--------|-----------|--------|
| Code Coverage | ≥ 80% | Required |
| Duplication | ≤ 10% | Fails if exceeded |
| Security Hotspots | Review required | Blocks |
| Critical Bugs | 0 | Blocks |
| Blocker Issues | 0 | Blocks |

### Quality Gate Configuration

In SonarQube, configure the Quality Gate:
1. Go to **Quality Gates**
2. Set conditions:
   - Coverage on New Code ≥ 80%
   - Duplication on New Code ≤ 10%
   - Security Hotspots reviewed 100%
   - Critical issues = 0
   - Blocker issues = 0

## Monitoring with Prometheus & Grafana

### Prometheus Configuration

SonarQube metrics are scraped automatically with 30-second interval:

```yaml
job_name: 'sonarqube'
metrics_path: '/api/system/metrics'
static_configs:
  - targets: ['sonarqube:9000']
scrape_interval: 30s
```

### Grafana Dashboards

Access the SonarQube dashboard at: `http://grafana:3005`

**Dashboard features:**
- Quality Gate failures over time
- Code coverage percentage
- Code duplication trend
- Security hotspots to review
- Lines of code trend
- Technical debt hours

### Alerts

SonarQube alerts configured in Prometheus:

| Alert | Condition | Severity |
|-------|-----------|----------|
| SonarQubeDown | Service unavailable for 5 min | Critical |
| QualityGateFailure | Projects fail quality gate | Warning |
| HighDuplication | Duplication > 10% | Warning |
| LowTestCoverage | Coverage < 80% | Warning |
| SecurityHotspots | Hotspots require review | Critical |

## Troubleshooting

### Quality Gate Fails Unexpectedly

1. Check SonarQube dashboard for issues
2. Verify coverage reports generated: `coverage/lcov.info`
3. Review test execution logs
4. Check quality gate conditions in SonarQube

### SonarQube Not Available

```bash
# Docker Compose
docker-compose -f sonarqube/docker-compose.yml logs sonarqube

# Kubernetes
kubectl logs -f deployment/sonarqube -n study-smart
```

### PostgreSQL Connection Issues

```bash
# Docker Compose
docker-compose -f sonarqube/docker-compose.yml logs postgres-sonar

# Kubernetes
kubectl logs -f deployment/postgres-sonar -n study-smart
```

### High Memory Usage

SonarQube requires substantial memory. Allocate:
- Development: 2GB
- Production: 4GB+

Adjust in Kubernetes deployment:
```yaml
resources:
  requests:
    memory: "2Gi"
  limits:
    memory: "4Gi"
```

## Maintenance

### Backup SonarQube Database

```bash
# Docker Compose
docker-compose -f sonarqube/docker-compose.yml exec postgres-sonar \
  pg_dump -U sonar sonar > sonar_backup.sql

# Kubernetes
kubectl exec -it pod/postgres-sonar-xxxxx -n study-smart -- \
  pg_dump -U sonar sonar > sonar_backup.sql
```

### Upgrade SonarQube

1. Update image version in docker-compose.yml or kubernetes deployment
2. Test in development first
3. Follow SonarQube upgrade guide
4. Database migrations run automatically

### Regular Tasks

- Monitor disk space for analysis data
- Review and update quality gate rules quarterly
- Clean up old analysis data (SonarQube admin panel)
- Rotate database credentials periodically

## Best Practices

1. **Quality Gates are Mandatory** - Never bypass quality gates in production
2. **Test Coverage** - Aim for >85% coverage, SonarQube requires >80%
3. **Security First** - Address all security hotspots before deployment
4. **Code Review** - Use SonarQube comments in PRs
5. **Monitor Trends** - Use Grafana dashboard to track quality over time
6. **Fix Quickly** - Address quality gate failures immediately
7. **Baseline Metrics** - Set realistic baselines for legacy code

## Environment Variables

### Docker Compose

```bash
# .env file
SONAR_POSTGRES_USER=sonar
SONAR_POSTGRES_PASSWORD=sonar_password_2024
SONAR_ADMIN_PASSWORD=admin_password_2024
```

### Kubernetes

Secrets are configured in `kubernetes/secrets/sonarqube-secrets.yaml`

### Jenkins

Store these as Jenkins credentials:
- `sonarqube-token`: SonarQube authentication token
- `docker-registry-credentials`: Docker registry access
- `kubeconfig`: Kubernetes cluster access

## Performance Tuning

### SonarQube Container

```yaml
environment:
  SONAR_WEB_JAVAADDITIONALOPTS: -Xmx2g -XX:+HeapDumpOnOutOfMemoryError
  SONAR_SEARCH_JAVAADDITIONALOPTS: -Xmx1g
```

### Database Connection Pool

```yaml
environment:
  SONAR_JDBC_MAX_POOL_SIZE: 20
```

### Elasticsearch Configuration

```yaml
environment:
  SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
  SONAR_SEARCH_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
```

## Support & Documentation

- **SonarQube Official Docs:** https://docs.sonarqube.org
- **Quality Profiles:** https://docs.sonarqube.org/latest/instance-administration/quality-profiles/
- **Community Plugins:** https://docs.sonarqube.org/latest/extend/developing-a-plugin/

## File Structure

```
project/
├── sonarqube/
│   └── docker-compose.yml
├── sonar-project.properties
├── backend/services/*/sonar-project.properties
├── frontend/sonar-project.properties
├── kubernetes/
│   ├── configmaps/sonarqube-config.yaml
│   ├── secrets/sonarqube-secrets.yaml
│   ├── storage/sonarqube-pvc.yaml
│   ├── deployments/
│   │   ├── sonarqube-deployment.yaml
│   │   └── postgres-sonar-deployment.yaml
│   └── ingress/sonarqube-ingress.yaml
├── monitoring/
│   ├── prometheus/
│   │   ├── sonarqube-scrape.yml
│   │   └── sonarqube-alerts.yml
│   └── grafana/dashboards/sonarqube-dashboard.json
├── jenkins/Jenkinsfile
└── .github/workflows/
    ├── sonarqube.yml
    └── cicd-sonarqube.yml
```

## Contact & Issues

For issues or questions:
1. Check SonarQube logs first
2. Review deployment logs in Jenkins/GitHub Actions
3. Consult SonarQube documentation
4. Contact DevOps team
