terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  backend "s3" {
    bucket = "studysmart-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr           = var.vpc_cidr
  environment        = var.environment
  availability_zones = var.availability_zones
}

module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "studysmart-${var.environment}"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
  desired_capacity    = var.desired_capacity
  max_capacity        = var.max_capacity
  min_capacity        = var.min_capacity
}

module "rds" {
  source = "./modules/rds"
  
  database_name     = var.database_name
  database_user     = var.database_user
  database_password = var.database_password
  vpc_id           = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnet_ids
}

module "monitoring" {
  source = "./modules/monitoring"
  
  cluster_name = module.eks.cluster_name
  vpc_id       = module.vpc.vpc_id
}
