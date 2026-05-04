#!/bin/bash

set -e

echo "📊 Setting up monitoring stack..."

# Deploy Prometheus
kubectl apply -f kubernetes/deployments/prometheus-deployment.yaml
kubectl apply -f kubernetes/services/prometheus-service.yaml

# Deploy Grafana
kubectl apply -f kubernetes/deployments/grafana-deployment.yaml
kubectl apply -f kubernetes/services/grafana-service.yaml

# Setup node exporters on all nodes
ansible-playbook -i ansible/inventory/production ansible/playbooks/monitoring-setup.yml

# Import dashboards
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/dashboards/api_metrics.json

echo "✅ Monitoring stack deployed!"
