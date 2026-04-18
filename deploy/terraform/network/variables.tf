variable "region" {
  type    = string
  default = "us-east-1"
}

variable "aws_profile" {
  type = string
}

variable "dev_ip_cidr_blocks" {
  description = "開発者 IP (開発中のみ、本番では削除)"
  type        = list(string)
}
