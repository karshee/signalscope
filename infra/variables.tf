variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-west-2"
}

variable "instance_type" {
  description = "EC2 instance type. Must be ARM (Graviton) — the AMI is arm64."
  type        = string
  default     = "t4g.small"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH. Null = no key pair (use SSM Session Manager instead)."
  type        = string
  default     = null
  nullable    = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to reach port 22. Restrict this to your own IP (e.g. 1.2.3.4/32) — the default is wide open."
  type        = string
  default     = "0.0.0.0/0"
}

variable "repo_url" {
  description = "Git repository cloned onto the instance at first boot."
  type        = string
  default     = "https://github.com/karshee/signalscope.git"
}

variable "domain_name" {
  description = "Optional domain to point at the instance. Informational only — DNS and TLS are not managed here."
  type        = string
  default     = ""
}

variable "enable_backups" {
  description = "Create an S3 bucket and a daily cron that backs up the SQLite database to it."
  type        = bool
  default     = true
}
