#!/bin/bash
set -e

# CoreApps ERP - Database Backup Script
# Runs daily via cron: 0 2 * * * /path/to/backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-coreapps}"
DB_USER="${DB_USER:-postgres}"
MINIO_ALIAS="${MINIO_ALIAS:-minio}"
MINIO_BUCKET="${MINIO_BUCKET:-coreapps-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of $DB_NAME..."

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($FILESIZE)"

# Upload to MinIO if mc is available
if command -v mc &> /dev/null; then
  mc cp "$BACKUP_FILE" "$MINIO_ALIAS/$MINIO_BUCKET/$(basename $BACKUP_FILE)"
  echo "[$(date)] Uploaded to MinIO: $MINIO_BUCKET"
fi

# Cleanup old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days"
echo "[$(date)] Backup process complete"
