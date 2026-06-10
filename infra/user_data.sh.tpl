#!/bin/bash
# Tapwire first-boot provisioning. Rendered by Terraform (templatefile).
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y docker.io docker-compose-v2 git sqlite3 awscli

systemctl enable --now docker
usermod -aG docker ubuntu || true

# ── App checkout ──────────────────────────────────────────────────────────────
APP_DIR=/opt/tapwire
if [ ! -d "$${APP_DIR}/.git" ]; then
  git clone "${repo_url}" "$${APP_DIR}"
fi

# ── Environment file ──────────────────────────────────────────────────────────
# Secrets are deliberately NOT passed through Terraform (they would end up in
# state). The operator must fill this file in by hand after first boot.
if [ ! -f "$${APP_DIR}/.env" ]; then
  cat > "$${APP_DIR}/.env" <<'EOF'
# Tapwire production environment — FILL THIS IN before the app is usable.
# Secrets are intentionally NOT managed by Terraform and are NOT in state.
# Connect via SSM Session Manager, edit this file, then:
#   cd /opt/tapwire && docker compose -f docker-compose.prod.yml up -d

# Required — generate with: openssl rand -hex 32
SECRET_KEY=

# Optional — Telethon READ credentials (channel watching). See docs/setup-telegram.md
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION=

ALLOWED_ORIGINS=http://localhost
LOG_LEVEL=info
WATCHER_POLL_INTERVAL=5
PORT=80
EOF
  chmod 600 "$${APP_DIR}/.env"
fi

# ── Start the stack ───────────────────────────────────────────────────────────
cd "$${APP_DIR}"
docker compose -f docker-compose.prod.yml up -d --build || true

%{ if backup_bucket != "" ~}
# ── Nightly SQLite backup to S3 (03:15 UTC) ──────────────────────────────────
cat > /usr/local/bin/tapwire-backup.sh <<'EOF'
#!/bin/bash
set -euo pipefail
DB=/opt/tapwire/data/tapwire.db
[ -f "$DB" ] || exit 0
TMP=$(mktemp /tmp/tapwire-backup.XXXXXX.db)
sqlite3 "$DB" ".backup '$TMP'"
aws s3 cp "$TMP" "s3://${backup_bucket}/tapwire-$(date -u +%Y%m%d-%H%M%S).db" --region ${aws_region}
rm -f "$TMP"
EOF
chmod +x /usr/local/bin/tapwire-backup.sh
echo "15 3 * * * root /usr/local/bin/tapwire-backup.sh >> /var/log/tapwire-backup.log 2>&1" > /etc/cron.d/tapwire-backup
chmod 644 /etc/cron.d/tapwire-backup
%{ endif ~}

echo "Tapwire provisioning complete"
