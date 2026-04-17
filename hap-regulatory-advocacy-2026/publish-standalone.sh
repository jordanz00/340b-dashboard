#!/usr/bin/env bash
# Push ONLY this folder to a new empty GitHub repo (standalone Pages site, no 340b-dashboard path).
# Usage (from anywhere):
#   bash /path/to/hap-regulatory-advocacy-2026/publish-standalone.sh git@github.com:USER/hap-regulatory-advocacy-2026.git
set -euo pipefail
REMOTE="${1:?Pass git remote, e.g. git@github.com:USER/hap-regulatory-advocacy-2026.git}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude='.git' "$HERE/" "$TMP/site/"
cd "$TMP/site"
git init
git add -A
git commit -m "Initial: HAP Regulatory Advocacy 2026 standalone site" || { echo "Nothing to commit?"; exit 1; }
git branch -M main
git remote add origin "$REMOTE"
git push -u origin main
