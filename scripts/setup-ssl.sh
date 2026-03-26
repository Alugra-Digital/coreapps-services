#!/bin/bash
set -e

DOMAIN="${1:-coreapps.alugra.com}"
EMAIL="${2:-admin@alugra.com}"

echo "=== CoreApps ERP - SSL Certificate Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Warning: This script should be run as root (or with sudo)."
  echo "Some operations may fail without root privileges."
  echo ""
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  if command -v apt-get &> /dev/null; then
    apt-get update && apt-get install -y certbot python3-certbot-nginx
  elif command -v yum &> /dev/null; then
    yum install -y certbot python3-certbot-nginx
  elif command -v dnf &> /dev/null; then
    dnf install -y certbot python3-certbot-nginx
  else
    echo "Error: Could not detect package manager. Please install certbot manually."
    exit 1
  fi
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
  echo "Error: nginx is not installed. Please install nginx first."
  echo "  apt-get install -y nginx   # Debian/Ubuntu"
  echo "  yum install -y nginx       # CentOS/RHEL"
  exit 1
fi

# Verify nginx configuration
echo "Verifying nginx configuration..."
nginx -t

# Obtain certificate
echo ""
echo "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

# Set up auto-renewal cron job (skip if already exists)
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
  echo "Auto-renewal cron job already exists."
else
  echo "Setting up auto-renewal cron job..."
  (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
fi

# Test auto-renewal
echo ""
echo "Testing certificate renewal (dry run)..."
certbot renew --dry-run

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Certificate files:"
echo "  Full chain:  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/cert.pem"
echo "  Chain:       /etc/letsencrypt/live/$DOMAIN/chain.pem"
echo ""
echo "Auto-renewal configured via cron (daily at 12:00 PM)"
echo ""
echo "Nginx configuration has been updated automatically."
echo "Your site should now be accessible at: https://$DOMAIN"
