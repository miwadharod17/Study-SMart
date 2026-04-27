#!/bin/bash

set -e

BACKUP_DIR="/backup/studysmart"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "📦 Starting backup at $TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "🗄️  Backing up database..."
docker exec study_smart_postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Backup Prometheus data
echo "📊 Backing up Prometheus data..."
docker run --rm -v prometheus_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/prometheus_data_$TIMESTAMP.tar.gz -C /data .

# Backup Grafana dashboards
echo "📈 Backing up Grafana dashboards..."
docker run --rm -v grafana_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/grafana_data_$TIMESTAMP.tar.gz -C /data .

# Backup application configs
echo "⚙️  Backing up configurations..."
tar czf $BACKUP_DIR/configs_$TIMESTAMP.tar.gz .env.production kubernetes/ terraform/

# Upload to S3 if configured
if [ -n "$AWS_S3_BUCKET" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 sync $BACKUP_DIR/ s3://$AWS_S3_BUCKET/backups/ --exclude "*.tmp"
fi

# Clean old backups
echo "🧹 Cleaning backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed successfully!"
