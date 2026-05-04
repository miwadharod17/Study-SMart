.PHONY: help build up down logs clean deploy backup restore health test lint fmt sonarqube-up sonarqube-down sonarqube-logs sonarqube-setup sonarqube-deploy-k8s sonarqube-status

# Colors
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Show this help message
	@printf '$(GREEN)Available commands:$(NC)\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

build: ## Build all Docker images
	@printf '$(GREEN)Building Docker images...$(NC)\n'
	docker-compose build --parallel

up: ## Start all services
	@printf '$(GREEN)Starting services...$(NC)\n'
	docker-compose up -d
	@printf '$(GREEN)Waiting for services to be ready...$(NC)\n'
	sleep 10
	@$(MAKE) health

down: ## Stop all services
	@printf '$(YELLOW)Stopping services...$(NC)\n'
	docker-compose down

logs: ## View all logs
	docker-compose logs -f

clean: ## Remove containers, volumes, and images
	@printf '$(RED)Removing containers, volumes, and images...$(NC)\n'
	docker-compose down -v
	docker system prune -af --volumes

deploy: ## Deploy to production
	@printf '$(GREEN)Deploying to production...$(NC)\n'
	./scripts/deploy.sh

backup: ## Backup databases and configurations
	@printf '$(GREEN)Creating backup...$(NC)\n'
	./scripts/backup.sh

restore: ## Restore from latest backup
	@printf '$(YELLOW)Restoring from backup...$(NC)\n'
	./scripts/restore.sh

health: ## Run health checks
	@printf '$(GREEN)Running health checks...$(NC)\n'
	./scripts/health-check.sh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SonarQube Targets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

sonarqube-up: ## Start SonarQube services (Docker Compose)
	@printf '$(GREEN)Starting SonarQube...$(NC)\n'
	cd sonarqube && docker-compose up -d
	@printf '$(YELLOW)Waiting for SonarQube to be ready...$(NC)\n'
	@sleep 30
	@$(MAKE) sonarqube-status

sonarqube-down: ## Stop SonarQube services
	@printf '$(RED)Stopping SonarQube...$(NC)\n'
	cd sonarqube && docker-compose down

sonarqube-logs: ## View SonarQube logs
	cd sonarqube && docker-compose logs -f sonarqube

sonarqube-setup: ## Setup SonarQube for development (auto-config)
	@printf '$(GREEN)Setting up SonarQube...$(NC)\n'
	chmod +x scripts/setup-sonarqube.sh
	./scripts/setup-sonarqube.sh

sonarqube-deploy-k8s: ## Deploy SonarQube to Kubernetes
	@printf '$(GREEN)Deploying SonarQube to Kubernetes...$(NC)\n'
	chmod +x scripts/deploy-sonarqube-k8s.sh
	./scripts/deploy-sonarqube-k8s.sh

sonarqube-status: ## Check SonarQube health status
	@printf '$(GREEN)Checking SonarQube status...$(NC)\n'
	chmod +x scripts/monitor-sonarqube.sh
	./scripts/monitor-sonarqube.sh || true
	@printf '\n$(YELLOW)Access SonarQube at: http://localhost:9000$(NC)\n'
	@printf '$(YELLOW)Credentials: admin/admin$(NC)\n'

sonarqube-quality-gate: ## Run SonarQube analysis and check quality gate
	@printf '$(GREEN)Running SonarQube analysis...$(NC)\n'
	npm run test:coverage
	sonar-scanner \
		-Dsonar.projectKey=study-smart-main \
		-Dsonar.sources=. \
		-Dsonar.host.url=http://localhost:9000 \
		-Dsonar.login=$(SONAR_LOGIN)

sonarqube-clean: ## Stop and remove SonarQube data
	@printf '$(RED)Removing SonarQube containers and volumes...$(NC)\n'
	cd sonarqube && docker-compose down -v
	@printf '$(GREEN)SonarQube cleaned$(NC)\n'

sonarqube-docs: ## Open SonarQube documentation
	@printf '$(GREEN)Opening SonarQube documentation...$(NC)\n'
	@echo "See: docs/SONARQUBE_INTEGRATION.md"
	@echo "See: SONARQUBE_README.md"

test: ## Run all tests
	@printf '$(GREEN)Running tests...$(NC)\n'
	cd frontend && npm test -- --watchAll=false
	cd backend/services/payment-service && npm test
	cd backend/services/forum-service && npm test
	cd backend/services/crud-service && npm test

lint: ## Run linter on all services
	@printf '$(GREEN)Running linter...$(NC)\n'
	cd frontend && npm run lint
	cd backend/services/payment-service && npm run lint
	cd backend/services/forum-service && npm run lint
	cd backend/services/crud-service && npm run lint

fmt: ## Format code
	@printf '$(GREEN)Formatting code...$(NC)\n'
	cd frontend && npm run format
	cd backend/services/payment-service && npm run format
	cd backend/services/forum-service && npm run format
	cd backend/services/crud-service && npm run format

monitoring-up: ## Start monitoring stack only
	@printf '$(GREEN)Starting monitoring stack...$(NC)\n'
	docker-compose -f docker-compose.monitoring.yml up -d

monitoring-down: ## Stop monitoring stack
	@printf '$(YELLOW)Stopping monitoring stack...$(NC)\n'
	docker-compose -f docker-compose.monitoring.yml down

k8s-deploy: ## Deploy to Kubernetes
	@printf '$(GREEN)Deploying to Kubernetes...$(NC)\n'
	kubectl apply -f kubernetes/

k8s-delete: ## Delete Kubernetes resources
	@printf '$(RED)Deleting Kubernetes resources...$(NC)\n'
	kubectl delete -f kubernetes/

k8s-logs: ## View Kubernetes logs
	kubectl logs -f -n study-smart --all-containers --prefix

terraform-init: ## Initialize Terraform
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	cd terraform && terraform apply -auto-approve

terraform-destroy: ## Destroy Terraform infrastructure
	cd terraform && terraform destroy -auto-approve

ansible-ping: ## Test Ansible connectivity
	ansible -i ansible/inventory/production all -m ping

ansible-deploy: ## Run Ansible deployment playbook
	ansible-playbook -i ansible/inventory/production ansible/playbooks/deploy-app.yml

.silent: help
