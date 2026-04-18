variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project" {
  description = "Project name used for resource naming"
  type        = string
  default     = "giraffe"
}

variable "environment" {
  description = "Environment (dev / prod)"
  type        = string
  default     = "dev"
}

# --- Database ---

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "baas_db"
}

variable "db_username" {
  description = "Master username"
  type        = string
  default     = "baas_admin"
}

variable "db_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16"
}

# --- Network ---

variable "vpc_id" {
  description = "VPC ID. If empty, uses the default VPC."
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group. If empty, uses default VPC subnets."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to the database"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
