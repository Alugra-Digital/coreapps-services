#!/bin/bash
# Usage: ./scripts/setup-ssl.sh your-domain.com your@email.com
# Run from the coreapps-alugra directory.

set -e

DOMAIN=${1:?Usage: $0 domain.com email@example.com}
EMAIL=${2:?Usage: $0 domain.com email@example.com}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../nginx/certs"

echo "Installing certbot..."
apt-get update -qq && apt-get install -y -qq certbot

echo "Obtaining certificate for $DOMAIN..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN"

echo "Copying certs to nginx/certs/..."
mkdir -p "$CERT_DIR"
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$CERT_DIR/"
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$CERT_DIR/"
chmod 600 "$CERT_DIR"/*.pem

echo "Setting up auto-renewal cron..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/ && docker compose -f $SCRIPT_DIR/../docker-compose.prod.yml restart nginx") | crontab -

echo "SSL setup complete. Certs in $CERT_DIR"
