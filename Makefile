.PHONY: help build up down logs clean deploy backup restore health test lint fmt

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
