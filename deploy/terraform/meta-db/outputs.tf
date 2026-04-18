output "endpoint" {
  value = aws_db_instance.meta.endpoint
}

output "db_name" {
  value = aws_db_instance.meta.db_name
}

output "port" {
  value = aws_db_instance.meta.port
}
