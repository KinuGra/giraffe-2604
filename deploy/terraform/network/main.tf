terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket  = "superbase-tfstate"
    key     = "network/terraform.tfstate"
    region  = "us-east-1"
    profile = "progatefinal"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

# デフォルト VPC を参照
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# RDS 用 Security Group (メタDB・BaaS DB 共用)
resource "aws_security_group" "rds" {
  name        = "superbase-rds"
  description = "PostgreSQL access from EKS and dev"
  vpc_id      = data.aws_vpc.default.id

  # EKS (VPC 内) からのアクセス
  ingress {
    description = "PostgreSQL from VPC (EKS)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  # 開発者 IP からのアクセス (開発中のみ、後で削除)
  ingress {
    description = "PostgreSQL from dev IP"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.dev_ip_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "superbase-rds"
    Project = "superbase"
  }
}
