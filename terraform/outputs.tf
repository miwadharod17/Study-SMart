output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_ca_certificate" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_ca_certificate
  sensitive   = true
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.database_endpoint
}

output "database_url" {
  description = "Complete database connection URL"
  value       = "postgresql://${var.database_user}:${var.database_password}@${module.rds.database_endpoint}/${var.database_name}"
  sensitive   = true
}

output "monitoring_url" {
  description = "Grafana URL"
  value       = module.monitoring.grafana_url
}
