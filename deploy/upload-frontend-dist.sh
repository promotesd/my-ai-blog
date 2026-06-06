#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-root@47.100.86.252}"
APP_DIR="${APP_DIR:-/opt/my-ai-blog}"

cd "$(dirname "$0")/.."

cd frontend
npm ci --legacy-peer-deps
npm run build
cd ..

ssh "$SERVER" "mkdir -p '$APP_DIR/frontend/dist'"
rsync -az --delete frontend/dist/ "$SERVER:$APP_DIR/frontend/dist/"

echo "Uploaded frontend/dist to $SERVER:$APP_DIR/frontend/dist"
