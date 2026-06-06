#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/my-ai-blog}"

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo ".env.production not found. Run deploy/deploy-prod.sh first." >&2
  exit 1
fi

git pull --ff-only

COMPOSE_PARALLEL_LIMIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker image prune -f

echo "Waiting for backend health..."
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/api/health >/dev/null; then
    echo "Backend healthy."
    docker compose -f docker-compose.prod.yml --env-file .env.production ps
    exit 0
  fi
  sleep 2
done

echo "Backend health check failed. Showing backend logs:" >&2
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=120 backend >&2
exit 1
