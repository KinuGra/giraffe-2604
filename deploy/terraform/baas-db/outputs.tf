output "endpoint" {
  description = "RDS endpoint (host:port)"
  value       = aws_db_instance.baas_db.endpoint
}

output "host" {
  description = "RDS hostname"
  value       = aws_db_instance.baas_db.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.baas_db.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.baas_db.db_name
}

output "database_url" {
  description = "Full connection string for the Functions Service"
  value       = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.baas_db.endpoint}/${var.db_name}?sslmode=require"
  sensitive   = true
}

output "security_group_id" {
  description = "Security group ID for the BaaS DB"
  value       = aws_security_group.baas_db.id
}
