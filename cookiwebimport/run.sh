#!/bin/sh
set -e

echo "=========================================================="
echo "🍕 [CookiWebImport] Start dodatku Home Assistant..."
echo "=========================================================="

mkdir -p /data

export PORT=3000
export DATA_DIR=/data

exec node src/server.js
