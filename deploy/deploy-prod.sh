#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/my-ai-blog}"
DOMAIN="${DOMAIN:-xiaodudu.top}"
WWW_DOMAIN="${WWW_DOMAIN:-www.xiaodudu.top}"

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  MYSQL_PASSWORD="$(openssl rand -base64 24 | tr -d '\n')"
  JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  sed -i.bak "s/change-this-mysql-root-password/${MYSQL_PASSWORD//\//\\/}/" .env.production
  sed -i.bak "s/change-this-to-a-very-long-random-secret/${JWT_SECRET//\//\\/}/" .env.production
  rm -f .env.production.bak
fi

COMPOSE_PARALLEL_LIMIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
  sudo cp deploy/nginx/xiaodudu.top.conf /etc/nginx/sites-available/xiaodudu.top
  sudo ln -sf /etc/nginx/sites-available/xiaodudu.top /etc/nginx/sites-enabled/xiaodudu.top
elif [ -d /etc/nginx/conf.d ]; then
  sudo cp deploy/nginx/xiaodudu.top.conf /etc/nginx/conf.d/xiaodudu.top.conf
else
  echo "Cannot find Nginx config directory. Expected /etc/nginx/sites-available or /etc/nginx/conf.d." >&2
  exit 1
fi

sudo nginx -t
sudo systemctl reload nginx

echo "Deployment containers are up."
echo "Check backend: curl http://127.0.0.1:8080/api/health"
echo "Check site:    http://${DOMAIN}"
echo "Enable HTTPS:  sudo certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}"
