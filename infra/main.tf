# Tapwire hosting — single t4g.small running docker-compose.prod.yml.
# Committed but NOT deployed. See infra/README.md.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Ubuntu 24.04 LTS (Noble) arm64, published by Canonical.
data "aws_ami" "ubuntu_arm64" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── Security group ────────────────────────────────────────────────────────────

resource "aws_security_group" "tapwire" {
  name_prefix = "tapwire-"
  description = "Tapwire app server"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tapwire"
  }
}

# ── IAM: SSM access + (optional) S3 backup writes ─────────────────────────────

data "aws_iam_policy_document" "assume_ec2" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "tapwire" {
  name_prefix        = "tapwire-"
  assume_role_policy = data.aws_iam_policy_document.assume_ec2.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.tapwire.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "backup_writes" {
  count = var.enable_backups ? 1 : 0

  statement {
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.backups[0].arn}/*",
    ]
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      aws_s3_bucket.backups[0].arn,
    ]
  }
}

resource "aws_iam_role_policy" "backup_writes" {
  count = var.enable_backups ? 1 : 0

  name_prefix = "tapwire-backup-"
  role        = aws_iam_role.tapwire.id
  policy      = data.aws_iam_policy_document.backup_writes[0].json
}

resource "aws_iam_instance_profile" "tapwire" {
  name_prefix = "tapwire-"
  role        = aws_iam_role.tapwire.name
}

# ── Instance ──────────────────────────────────────────────────────────────────

resource "aws_instance" "tapwire" {
  ami                    = data.aws_ami.ubuntu_arm64.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.tapwire.id]
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.tapwire.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    repo_url      = var.repo_url
    backup_bucket = var.enable_backups ? aws_s3_bucket.backups[0].bucket : ""
    aws_region    = var.aws_region
  })

  tags = {
    Name = "tapwire"
  }
}

resource "aws_eip" "tapwire" {
  domain = "vpc"

  tags = {
    Name = "tapwire"
  }
}

resource "aws_eip_association" "tapwire" {
  instance_id   = aws_instance.tapwire.id
  allocation_id = aws_eip.tapwire.id
}
