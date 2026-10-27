#!/usr/bin/env bash
# ==============================================================================
# XYDV E-COMMERCE PLATFORM — CONTINUOUS DEPLOYMENT SCRIPT
# Target: AWS EC2 Instance
# ==============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "===================================================================="
echo " Starting XYDV Zero-Downtime Deployment at $(date)"
echo " Working Directory: $APP_DIR"
echo "===================================================================="

# 1. Pull latest code from current branch
echo "--> Pulling latest git changes..."
git fetch origin
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git pull origin "$CURRENT_BRANCH"

# 2. Install production dependencies
echo "--> Installing dependencies..."
npm install

# 3. Compile backend and build Next.js 15 frontend
echo "--> Compiling TypeScript backend and Next.js frontend..."
npm run build

# 4. Gracefully reload PM2 processes
echo "--> Reloading processes via PM2..."
if pm2 describe xydv-api >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

# 5. Reload Nginx
echo "--> Testing and reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "===================================================================="
echo " Deployment successful!"
echo " Status summary:"
pm2 status
echo "===================================================================="
