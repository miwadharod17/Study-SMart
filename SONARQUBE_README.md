# SonarQube Quick Start Guide

## Overview

SonarQube is an integral part of the Study-Smart CI/CD pipeline. This guide provides quick setup instructions.

## 🚀 Quick Start

### Option 1: Local Development (Docker Compose)

```bash
# Setup and start SonarQube
chmod +x scripts/setup-sonarqube.sh
./scripts/setup-sonarqube.sh

# Access SonarQube
# Open http://localhost:9000
# Default: admin/admin
```

**Change default password immediately!**

### Option 2: Production (Kubernetes)

```bash
# Deploy to Kubernetes
chmod +x scripts/deploy-sonarqube-k8s.sh
./scripts/deploy-sonarqube-k8s.sh

# Verify deployment
kubectl get pods -n study-smart | grep sonarqube
```

## 📋 Prerequisites

- Docker & Docker Compose (for local)
- Kubernetes & kubectl (for K8s)
- Git with webhook access
- Jenkins or GitHub Actions configured

## 🔐 Configuration

### 1. Generate Authentication Token

**In SonarQube UI:**
1. Click your avatar (top-right)
2. Select "My Account"
3. Click "Security" tab
4. Create token: `jenkins-token`
5. Copy token value

### 2. Add to Jenkins

**Jenkins → Manage Jenkins → Credentials:**
1. Add new credential
2. Type: Secret text
3. Secret: [token from step 1]
4. ID: `sonarqube-token`

### 3. Configure Jenkins Pipeline

Already configured in `jenkins/Jenkinsfile`:
- SonarQube server: `http://sonarqube:9000`
- Quality gate: Blocks deployment if failed

### 4. GitHub Actions Secrets

Add to GitHub repository settings:
```
SONAR_TOKEN = [token from step 1]
```

## 🔄 Pipeline Integration

The complete flow:

```
GitHub Push → Quality Check → Docker Build → K8s Deploy → Monitoring
                    ↑
          SonarQube Analysis
```

**Quality Gate Blocks Deployment**: If quality checks fail, code won't deploy.

## 📊 Metrics & Monitoring

### SonarQube Dashboard
- Coverage trends
- Code quality metrics
- Security issues
- Technical debt

### Grafana Integration
- Prometheus scrapes SonarQube metrics
- Custom dashboard in Grafana
- Real-time monitoring

## ✅ Verify Setup

```bash
# Check SonarQube health
curl http://localhost:9000/api/system/health

# Monitor via script
chmod +x scripts/monitor-sonarqube.sh
./scripts/monitor-sonarqube.sh
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check container logs: `docker-compose -f sonarqube/docker-compose.yml logs` |
| Quality gate fails | Review coverage, add tests, or adjust gate rules |
| Database connection error | Verify PostgreSQL is running and healthy |
| Performance issues | Increase memory allocation |

## 📚 Documentation

- [Full SonarQube Integration Guide](docs/SONARQUBE_INTEGRATION.md)
- [CI/CD Pipeline Flow](docs/CICD_PIPELINE_FLOW.md)
- [Official SonarQube Docs](https://docs.sonarqube.org)

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `sonarqube/docker-compose.yml` | Local development setup |
| `sonar-project.properties` | Root project config |
| `jenkins/Jenkinsfile` | Jenkins pipeline definition |
| `.github/workflows/sonarqube.yml` | PR quality checks |
| `.github/workflows/cicd-sonarqube.yml` | Main branch deployment |
| `kubernetes/deployments/sonarqube-deployment.yaml` | K8s deployment |

## 🎯 Quality Gate Rules

Default thresholds (adjustable):
- Code Coverage: ≥ 80%
- Duplication: ≤ 10%
- Security Hotspots: 0 critical
- Blocker Issues: 0

## 📞 Support

For issues:
1. Check SonarQube logs
2. Review Jenkins/GitHub Actions logs
3. Consult [SonarQube documentation](https://docs.sonarqube.org)
4. Contact DevOps team

---

**Last Updated:** 2024  
**Status:** Production Ready ✅
