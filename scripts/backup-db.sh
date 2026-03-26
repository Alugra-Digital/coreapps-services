#!/bin/bash
# Database backup script for CoreApps ERP
# Schedule: 0 2 * * * /opt/coreapps/coreapps-alugra/scripts/backup-db.sh >> /var/log/coreapps-backup.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/coreapps}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/coreapps_${TIMESTAMP}.sql.gz"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup -> $BACKUP_FILE"

# Parse DB_URL for credentials: postgresql://user:pass@host:port/dbname
DB_USER=$(echo "$DB_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|' | python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")
DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')

PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  -Fc \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "coreapps_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Cleaned up backups older than $KEEP_DAYS days"
