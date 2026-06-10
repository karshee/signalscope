# Versioned, encrypted, private bucket for nightly SQLite backups.
# Only created when enable_backups = true.

resource "aws_s3_bucket" "backups" {
  count = var.enable_backups ? 1 : 0

  bucket_prefix = "tapwire-backups-"

  tags = {
    Name = "tapwire-backups"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  count = var.enable_backups ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  count = var.enable_backups ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  count = var.enable_backups ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  count = var.enable_backups ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
