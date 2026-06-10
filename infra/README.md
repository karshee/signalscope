# Tapwire infrastructure

> **This configuration is committed but NOT deployed.**

Terraform for the cheapest sane AWS hosting of the `docker-compose.prod.yml` stack: one ARM EC2 instance behind an Elastic IP, with optional nightly SQLite backups to S3.

## What it creates

| Resource | Detail |
|---|---|
| EC2 instance | `t4g.small` (2 vCPU Graviton, 2 GB RAM), Ubuntu 24.04 arm64, 20 GB gp3 encrypted root |
| Security group | 22 from `allowed_ssh_cidr`, 80/443 from anywhere, all egress |
| Elastic IP | Stable public address, associated with the instance |
| IAM role + instance profile | `AmazonSSMManagedInstanceCore` (browser shell, no SSH key needed) + scoped `s3:PutObject` to the backup bucket |
| S3 bucket (optional) | Versioned, SSE-S3, public access blocked, 30-day noncurrent-version expiry. `enable_backups = false` skips it |
| User data | Installs Docker + compose v2, clones the repo to `/opt/tapwire`, writes a placeholder `.env`, starts the prod compose stack, installs a nightly backup cron |

The Docker images (`python:3.12-slim`, `node:20-alpine`, `nginx:1.27-alpine`) are multi-arch, so the stack builds and runs natively on ARM.

## Monthly cost (eu-west-2, on-demand)

| Item | ~Cost/mo |
|---|---|
| t4g.small on-demand (730 h) | ~$12.30 |
| EBS 20 GB gp3 | ~$1.90 |
| Elastic IP (attached to running instance) | $0.00 (detached: ~$3.65) |
| S3 backups (a few hundred MB, versioned) | pennies |
| **Total** | **≈ $15/mo** |

Cheaper alternatives if $15 matters: a t4g.small **spot** instance (~70% off, but can be reclaimed) or **Lightsail** ($10/mo for 2 GB, simpler but no Terraform-native IAM/S3 integration).

## Prerequisites

- Terraform >= 1.6
- AWS credentials with rights to create EC2/IAM/S3 (e.g. `AWS_PROFILE` or env vars)
- A default VPC in the target region (this config uses it)
- Optional: an existing EC2 key pair if you want plain SSH (`key_name`)

## Usage

```bash
cd infra
terraform init
terraform plan
terraform apply
```

Variables you will likely override:

```bash
terraform apply \
  -var 'allowed_ssh_cidr=YOUR.IP.HERE.0/32' \
  -var 'key_name=my-keypair'
```

## Secrets — getting them onto the box

Secrets are **not** in Terraform state. User data writes an empty `/opt/tapwire/.env` with comments; the app will not be usable until you fill it:

1. Connect without SSH via SSM: `aws ssm start-session --target <instance-id>` (or EC2 console → Connect → Session Manager).
2. Edit `/opt/tapwire/.env` — set `SECRET_KEY` (`openssl rand -hex 32`) and, if you want channel watching, `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` / `TELEGRAM_SESSION` (see `docs/setup-telegram.md`).
3. Restart: `cd /opt/tapwire && docker compose -f docker-compose.prod.yml up -d`.

Per-user bot tokens (the WRITE credential) are entered in the app's Settings page, not in `.env`.

## TLS

Out of scope for v1. Point your domain's A record at the EIP, then either swap the nginx container for [Caddy](https://caddyserver.com/) (automatic Let's Encrypt) or run certbot on the host and mount the certs into nginx. Port 443 is already open in the security group.

## Backups

When `enable_backups = true` (default), a root cron at 03:15 UTC takes a consistent snapshot with `sqlite3 .backup` and uploads it to the S3 bucket (`terraform output backup_bucket`). Old object versions expire after 30 days. Restore: `aws s3 cp s3://<bucket>/<file>.db /opt/tapwire/data/tapwire.db` while the stack is stopped.
