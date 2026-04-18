terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket  = "superbase-tfstate"
    key     = "meta-db/terraform.tfstate"
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

# network の state から SG とサブネットを参照
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket  = "superbase-tfstate"
    key     = "network/terraform.tfstate"
    region  = "us-east-1"
    profile = "progatefinal"
  }
}

# RDS 用サブネットグループ
resource "aws_db_subnet_group" "meta" {
  name       = "superbase-meta-db"
  subnet_ids = data.terraform_remote_state.network.outputs.subnet_ids

  tags = {
    Name    = "superbase-meta-db"
    Project = "superbase"
  }
}

# メタ DB (RDS PostgreSQL)
resource "aws_db_instance" "meta" {
  identifier     = "superbase-meta-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.instance_class

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "superbase_meta"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.meta.name
  vpc_security_group_ids = [data.terraform_remote_state.network.outputs.rds_security_group_id]

  publicly_accessible = true # 開発中のみ
  skip_final_snapshot = true # ハッカソン用

  tags = {
    Name    = "superbase-meta-db"
    Project = "superbase"
  }
}
