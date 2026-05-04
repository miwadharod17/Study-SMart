# SonarQube Deployment Checklist

Use this checklist to ensure proper SonarQube setup and integration.

## Pre-Deployment

### Prerequisites
- [ ] Docker & Docker Compose installed
- [ ] Kubernetes cluster running (for K8s deployment)
- [ ] kubectl configured and authenticated
- [ ] Git repository with webhook access
- [ ] Jenkins server ready
- [ ] Sufficient disk space (10GB+ for SonarQube)
- [ ] 2-4GB RAM available for SonarQube instance

### Code Preparation
- [ ] All source code committed to repository
- [ ] Test suite configured and working
- [ ] Coverage reports generation working
- [ ] `.gitignore` configured to exclude build artifacts
- [ ] Environment files reviewed

## Local Development Setup

### SonarQube Instance
- [ ] Run `./scripts/setup-sonarqube.sh` or `make sonarqube-setup`
- [ ] Verify SonarQube starts: `curl http://localhost:9000/api/system/health`
- [ ] Access UI at `http://localhost:9000`
- [ ] Confirm default credentials work (admin/admin)

### Initial Configuration
- [ ] **Change default admin password** to strong password
- [ ] Navigate to Administration → Users
- [ ] Generate new authentication token
- [ ] Copy token securely (needed for Jenkins)
- [ ] Verify PostgreSQL database connection
- [ ] Check storage and disk space
- [ ] Confirm no error logs in console

### Quality Profile Setup
- [ ] Review current quality profile: Administration → Quality Profiles
- [ ] Create custom profile if needed
- [ ] Set as default for project
- [ ] Configure rule severity levels
- [ ] Test with sample project

## Jenkins Integration

### Server Configuration
- [ ] Go to Manage Jenkins → Configure System
- [ ] Find "SonarQube Servers" section
- [ ] Add new SonarQube server:
  - [ ] Name: `SonarQube`
  - [ ] Server URL: `http://sonarqube:9000`
  - [ ] Server authentication token: (from step above)
- [ ] Test connection: click "Test Connection"
- [ ] Verify success message

### Jenkins Credentials
- [ ] Add "Secret text" credential:
  - [ ] Secret: [SonarQube token]
  - [ ] ID: `sonarqube-token`
  - [ ] Description: "SonarQube Jenkins Integration Token"
- [ ] Add Docker registry credentials
  - [ ] Username/password for docker.io
  - [ ] ID: `docker-registry-credentials`

### Jenkinsfile Verification
- [ ] Jenkinsfile has SonarQube Analysis stage
- [ ] Quality gate check is present
- [ ] Project key is correct: `study-smart-main`
- [ ] Coverage path is correct: `coverage/lcov.info`
- [ ] Build will fail if quality gate fails (test this!)

### First Pipeline Run
- [ ] Trigger manual build: "Build Now"
- [ ] Monitor console output
- [ ] Verify checkout completes
- [ ] Verify tests run and coverage generated
- [ ] Verify SonarQube scanner executes
- [ ] Check SonarQube dashboard for analysis results
- [ ] Verify quality gate evaluation
- [ ] Confirm quality gate passes or fails appropriately
- [ ] Verify Docker build (only if quality gate passed)

## GitHub Actions Setup

### Secrets Configuration
- [ ] Go to Settings → Secrets and Variables → Actions
- [ ] Add secret `SONAR_TOKEN`:
  - [ ] Value: [SonarQube authentication token]
- [ ] Add secret `DOCKER_USERNAME`:
  - [ ] Value: [Docker registry username]
- [ ] Add secret `DOCKER_PASSWORD`:
  - [ ] Value: [Docker registry password]
- [ ] Add secret `KUBECONFIG` (if deploying):
  - [ ] Value: base64-encoded kubeconfig
- [ ] Add secret `SLACK_WEBHOOK` (if using Slack):
  - [ ] Value: [Slack webhook URL]

### Workflow Verification
- [ ] `.github/workflows/sonarqube.yml` exists
- [ ] `.github/workflows/cicd-sonarqube.yml` exists
- [ ] Workflows are enabled in Actions tab
- [ ] Test PR workflow:
  - [ ] Create feature branch
  - [ ] Make code changes
  - [ ] Push to GitHub
  - [ ] Create pull request
  - [ ] Verify SonarQube workflow triggers
  - [ ] Check PR for SonarQube comment
  - [ ] Verify quality gate result is posted

### Main Branch Workflow
- [ ] Push to main branch
- [ ] Verify cicd-sonarqube.yml triggers
- [ ] Monitor all stages in Actions tab
- [ ] Verify quality gate passes before Docker build
- [ ] Verify Docker images are pushed
- [ ] Verify Kubernetes deployment (if configured)

## Kubernetes Deployment

### Prerequisites
- [ ] study-smart namespace exists: `kubectl create namespace study-smart`
- [ ] PersistentVolume provisioner available
- [ ] Ingress controller installed (nginx)
- [ ] Cert-manager installed (for HTTPS)

### Configuration Application
- [ ] Apply ConfigMaps: `kubectl apply -f kubernetes/configmaps/sonarqube-config.yaml`
- [ ] Apply Secrets: `kubectl apply -f kubernetes/secrets/sonarqube-secrets.yaml`
  - [ ] Verify secrets exist: `kubectl get secrets -n study-smart`
- [ ] Apply PVCs: `kubectl apply -f kubernetes/storage/sonarqube-pvc.yaml`
  - [ ] Verify PVCs bound: `kubectl get pvc -n study-smart`

### Deployments
- [ ] Deploy PostgreSQL: `kubectl apply -f kubernetes/deployments/postgres-sonar-deployment.yaml`
  - [ ] Verify pod running: `kubectl get pods -n study-smart -l app=postgres-sonar`
  - [ ] Check health: `kubectl describe pod -n study-smart [pod-name]`
  - [ ] Monitor logs: `kubectl logs -f deployment/postgres-sonar -n study-smart`
  - [ ] Wait for ready status (may take 2-3 minutes)

- [ ] Deploy SonarQube: `kubectl apply -f kubernetes/deployments/sonarqube-deployment.yaml`
  - [ ] Verify pod running: `kubectl get pods -n study-smart -l app=sonarqube`
  - [ ] Check startup progress: `kubectl logs -f deployment/sonarqube -n study-smart`
  - [ ] Watch for initialization messages
  - [ ] Wait for "SonarQube is up" message (5-10 minutes)

### Service & Ingress
- [ ] Verify Service: `kubectl get svc sonarqube -n study-smart`
- [ ] Apply Ingress: `kubectl apply -f kubernetes/ingress/sonarqube-ingress.yaml`
- [ ] Verify Ingress: `kubectl get ingress -n study-smart`
- [ ] Update DNS records (if needed): `sonarqube.studysmart.com` → cluster IP
- [ ] Test access: `curl http://sonarqube.studysmart.com/api/system/health`

### Pod Verification
```bash
# Check all pods are running
kubectl get pods -n study-smart

# View detailed pod info
kubectl describe pod deployment/sonarqube -n study-smart

# Check resource usage
kubectl top pod -n study-smart

# View logs
kubectl logs -f deployment/sonarqube -n study-smart
```

- [ ] All pods show "Running" status
- [ ] No pods in CrashLoopBackOff
- [ ] PostgreSQL is Ready (1/1)
- [ ] SonarQube is Ready (1/1)
- [ ] No error messages in logs

## Monitoring Setup

### Prometheus Configuration
- [ ] Update `monitoring/prometheus/prometheus.yml`:
  - [ ] SonarQube job added to scrape_configs
  - [ ] Metrics path: `/api/system/metrics`
  - [ ] Scrape interval: 30s
- [ ] Add alerts file: `sonarqube-alerts.yml` in rule_files
- [ ] Reload Prometheus: `curl -X POST http://prometheus:9090/-/reload`
- [ ] Verify SonarQube scrape job: `http://prometheus:9090/targets`

### Grafana Dashboard
- [ ] Copy dashboard JSON: `monitoring/grafana/dashboards/sonarqube-dashboard.json`
- [ ] Import in Grafana:
  - [ ] Create → Import
  - [ ] Paste JSON or upload file
  - [ ] Select Prometheus datasource
  - [ ] Click Import
- [ ] Verify dashboard displays:
  - [ ] Quality gate failures chart
  - [ ] Code coverage gauge
  - [ ] Duplication percentage
  - [ ] Security hotspots
  - [ ] Lines of code trend
  - [ ] Technical debt

### Alerts Configuration
- [ ] Verify Prometheus rule file loads
- [ ] Check Prometheus web UI for alert rules
- [ ] Trigger test alert (manual SonarQube shutdown)
- [ ] Verify AlertManager receives alert
- [ ] Check Slack/email notifications (if configured)

## Post-Deployment Verification

### SonarQube Functionality
- [ ] UI accessible at configured URL
- [ ] Can login with admin credentials
- [ ] System Health shows "UP" (Administration → System)
- [ ] Database connection verified
- [ ] Elasticsearch running (Administration → System)
- [ ] Storage showing available space

### Pipeline Integration
- [ ] Jenkins can trigger builds
- [ ] GitHub webhook configured and working
- [ ] Pull requests trigger SonarQube analysis
- [ ] Quality gate blocks failing code
- [ ] Slack notifications working (if configured)
- [ ] PR comments posting results

### Performance Testing
- [ ] Run analysis on small project (< 100 files)
  - [ ] Analysis completes in < 5 minutes
  - [ ] Quality gate evaluation fast (< 1 minute)
- [ ] Run analysis on full project
  - [ ] Monitor resource usage
  - [ ] CPU usage reasonable
  - [ ] Memory not exceeding limits
  - [ ] Disk space not filling up

### Security Checks
- [ ] HTTPS enabled (production)
- [ ] Default credentials changed
- [ ] Strong password policy set
- [ ] Token rotation scheduled
- [ ] Access logs being captured
- [ ] Database credentials secured
- [ ] No sensitive data in logs

## Production Hardening

### Database
- [ ] Regular backups scheduled
- [ ] Backup encryption enabled
- [ ] Recovery tested
- [ ] Connection pool size optimized
- [ ] Slow query logging enabled

### Security
- [ ] LDAP/AD integration configured (if applicable)
- [ ] Two-factor authentication enabled (if available)
- [ ] IP whitelist configured
- [ ] API rate limiting set
- [ ] Audit logging enabled

### High Availability
- [ ] Multiple SonarQube replicas (optional)
- [ ] Database replication configured (optional)
- [ ] Load balancer in place
- [ ] Health checks configured
- [ ] Failover tested

### Monitoring & Alerts
- [ ] Disk space alerts set (80%, 90%)
- [ ] Memory alerts set
- [ ] Service down alerts
- [ ] Quality gate failure alerts
- [ ] Security hotspot alerts
- [ ] On-call rotation configured

## Documentation

- [ ] Team trained on SonarQube usage
- [ ] Quality standards documented
- [ ] Troubleshooting guide created
- [ ] Escalation procedures defined
- [ ] Maintenance schedule established
- [ ] Links posted in team wiki/documentation
- [ ] Runbook created for common issues

## Sign-Off

- [ ] **Development Lead**: __________________ Date: ________
- [ ] **DevOps/Ops Lead**: __________________ Date: ________
- [ ] **Security Review**: __________________ Date: ________

## Notes & Issues

```
[Space for deployment notes, issues encountered, and resolutions]

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________
```

## Post-Deployment Review (1 week)

Schedule review meeting after 1 week of production use:

- [ ] No critical issues reported
- [ ] Quality gate preventing bad code
- [ ] Team familiar with workflow
- [ ] Monitoring alerting properly
- [ ] Logs clean of errors
- [ ] Performance satisfactory
- [ ] Documentation complete
- [ ] Team feedback incorporated

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Contact**: _______________

