# Production Deployment Checklist

## One-Time Server Setup

- [ ] Server has Docker + Docker Compose v2 installed (`docker compose version`)
- [ ] Domain DNS A record points to server IP
- [ ] Copy `.env.example` to `.env`, fill in all values
- [ ] Generate JWT secrets: `openssl rand -hex 64` (run twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET)
- [ ] Set `ALLOWED_ORIGINS=https://your-domain.com` in `.env`
- [ ] Set `MINIO_USE_SSL=true` in `.env`
- [ ] Verify `REDIS_HOST` in `.env` is the Redis host (not the DB host)
- [ ] Run `./scripts/setup-ssl.sh your-domain.com your@email.com`
- [ ] Run DB migrations: `npm run migrate`
- [ ] Seed master data: `npm run seed:users`
- [ ] Add GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `PROD_API_URL`
- [ ] Set up backup cron: `0 2 * * * /opt/coreapps/scripts/backup-db.sh`

## Every Deploy (via CI/CD)

Push to `main` branch triggers:
1. Backend tests
2. Integration tests
3. Docker build + push to GHCR
4. SSH deploy to VPS

Manual deploy (if CI is down):
```bash
cd /opt/coreapps/coreapps-alugra
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

## Verify Production Health

```bash
# All services healthy?
docker compose -f docker-compose.prod.yml ps

# Gateway health (via nginx HTTPS)
curl https://your-domain.com/health

# Service-level circuit breaker stats
curl https://your-domain.com/health/services

# Recent logs
docker compose -f docker-compose.prod.yml logs --tail=50 gateway
```

## Rollback

```bash
# List recent images
docker images | grep coreapps

# Stop and restart with previous image tag
docker compose -f docker-compose.prod.yml down
# Edit docker-compose.prod.yml image tags to previous SHA, then:
docker compose -f docker-compose.prod.yml up -d
```

## Secrets Rotation

When rotating JWT_SECRET (invalidates all existing tokens — all users must re-login):
1. Generate new secret: `openssl rand -hex 64`
2. Update `.env` on server
3. Restart all services: `docker compose -f docker-compose.prod.yml restart`
