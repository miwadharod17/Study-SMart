#!/bin/bash

set -e

# Health check script for monitoring
SERVICES=("payment-service:3001" "forum-service:3002" "crud-service:3003")
API_GATEWAY="http://localhost"

check_service() {
    local service=$1
    local host=$(echo $service | cut -d: -f1)
    local port=$(echo $service | cut -d: -f2)
    
    if curl -f -s -o /dev/null "http://$host:$port/health"; then
        echo "✅ $host is healthy"
        return 0
    else
        echo "❌ $host is unhealthy"
        return 1
    fi
}

check_database() {
    if docker exec study_smart_postgres pg_isready -U $DB_USER > /dev/null 2>&1; then
        echo "✅ PostgreSQL is healthy"
        return 0
    else
        echo "❌ PostgreSQL is unhealthy"
        return 1
    fi
}

check_prometheus() {
    if curl -f -s -o /dev/null "http://localhost:9090/-/healthy"; then
        echo "✅ Prometheus is healthy"
        return 0
    else
        echo "❌ Prometheus is unhealthy"
        return 1
    fi
}

main() {
    local failed=0
    
    echo "🏥 Running health checks..."
    
    for service in "${SERVICES[@]}"; do
        if ! check_service $service; then
            failed=$((failed + 1))
        fi
    done
    
    if ! check_database; then
        failed=$((failed + 1))
    fi
    
    if ! check_prometheus; then
        failed=$((failed + 1))
    fi
    
    if [ $failed -eq 0 ]; then
        echo "✅ All services are healthy!"
        exit 0
    else
        echo "❌ $failed service(s) are unhealthy!"
        exit 1
    fi
}

main
