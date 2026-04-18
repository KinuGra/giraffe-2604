locals {
  name_prefix = "${var.project}-${var.environment}"
  use_default_vpc = var.vpc_id == ""
}

# --- Default VPC (dev用。本番では network/ モジュールのVPCを使う) ---

data "aws_vpc" "default" {
  count   = local.use_default_vpc ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = local.use_default_vpc ? 1 : 0

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

locals {
  vpc_id     = local.use_default_vpc ? data.aws_vpc.default[0].id : var.vpc_id
  subnet_ids = local.use_default_vpc ? data.aws_subnets.default[0].ids : var.subnet_ids
}

# --- Security Group ---

resource "aws_security_group" "baas_db" {
  name        = "${local.name_prefix}-baas-db"
  description = "Allow PostgreSQL access to BaaS DB"
  vpc_id      = local.vpc_id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-baas-db"
  }
}

# --- DB Subnet Group ---

resource "aws_db_subnet_group" "baas_db" {
  name       = "${local.name_prefix}-baas-db"
  subnet_ids = local.subnet_ids

  tags = {
    Name = "${local.name_prefix}-baas-db"
  }
}

# --- RDS Instance ---

resource "aws_db_instance" "baas_db" {
  identifier     = "${local.name_prefix}-baas-db"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"

  db_subnet_group_name   = aws_db_subnet_group.baas_db.name
  vpc_security_group_ids = [aws_security_group.baas_db.id]

  publicly_accessible = false
  multi_az            = var.environment == "prod"
  storage_encrypted   = true

  backup_retention_period = var.environment == "prod" ? 7 : 1
  skip_final_snapshot     = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-baas-db-final" : null

  tags = {
    Name        = "${local.name_prefix}-baas-db"
    Project     = var.project
    Environment = var.environment
  }
}
