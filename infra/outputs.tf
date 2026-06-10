output "public_ip" {
  description = "Elastic IP attached to the instance."
  value       = aws_eip.tapwire.public_ip
}

output "ssh_command" {
  description = "SSH command (requires key_name to be set and your IP in allowed_ssh_cidr)."
  value       = "ssh ubuntu@${aws_eip.tapwire.public_ip}"
}

output "app_url" {
  description = "App URL. Use the domain if you pointed one at the EIP."
  value       = var.domain_name != "" ? "http://${var.domain_name}" : "http://${aws_eip.tapwire.public_ip}"
}

output "backup_bucket" {
  description = "S3 bucket receiving nightly SQLite backups (empty if backups disabled)."
  value       = var.enable_backups ? aws_s3_bucket.backups[0].bucket : ""
}
