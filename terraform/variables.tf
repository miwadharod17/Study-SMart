variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "node_instance_types" {
  description = "EC2 instance types for nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "desired_capacity" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

variable "max_capacity" {
  description = "Maximum number of nodes"
  type        = number
  default     = 10
}

variable "min_capacity" {
  description = "Minimum number of nodes"
  type        = number
  default     = 2
}

variable "database_name" {
  description = "RDS database name"
  type        = string
  default     = "studysmart_prod"
}

variable "database_user" {
  description = "RDS database user"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
}
