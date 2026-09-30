#!/usr/bin/env bash
# deploy.sh — Déploiement automatisé : vérification syntaxe + CT 104 + Cloudflare Pages
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "=== [1/4] Vérification de la syntaxe JS ==="
node -c calculator.js data.js bracelet-worker.js functions/api/market/prices.js
echo "Syntaxe JS : OK"

echo "=== [2/4] Synchronisation CT 104 (Docker Nginx) ==="
scp -q *.js *.html *.css root@192.168.1.104:/opt/lostark-cp/public/
scp -rq images data root@192.168.1.104:/opt/lostark-cp/public/ 2>/dev/null || true
ssh root@192.168.1.104 "docker exec lostark-cp nginx -t && docker exec lostark-cp nginx -s reload" >/dev/null
echo "CT 104 : déployé et Nginx rechargé"

echo "=== [3/4] Déploiement Cloudflare Pages ==="
# Variables Cloudflare
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-cfut_hkuPHo1cXzigA8s0Gb3j3YoawTRU4gShlRJtZuAi5a9a580f}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-8c75c7e4c291330a382ebdb9afa62dfb}"

# Environnement Node v22 via NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp *.js *.html *.css "$WORK/"
cp -r images data "$WORK/" 2>/dev/null || true

npx -y wrangler pages deploy "$WORK" --project-name lostark-cp --commit-dirty=true --branch master

echo "=== [4/4] Vérification en ligne ==="
curl -s -L https://lostark-cp.pages.dev/ | grep -E "calculator\.js" || true
echo "✅ Déploiement terminé avec succès !"
