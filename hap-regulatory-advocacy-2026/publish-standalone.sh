#!/usr/bin/env bash
# Push ONLY this folder to a GitHub repo whose root = site root (GitHub Pages).
# Replaces remote `main` when GitHub already has commits (e.g. “Quick setup” README created on the web).
# Usage (from anywhere):
#   bash /path/to/hap-regulatory-advocacy-2026/publish-standalone.sh https://github.com/USER/REPO.git
set -euo pipefail
REMOTE="${1:?Pass git remote, e.g. https://github.com/USER/hap-regulatory-advocacy-2026.git}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude='.git' "$HERE/" "$TMP/site/"
cd "$TMP/site"
git init
git add -A
git commit -m "Publish: HAP Regulatory Advocacy 2026 standalone site" || { echo "Nothing to commit?"; exit 1; }
git branch -M main
git remote add origin "$REMOTE"

# If GitHub created `main` (e.g. README / “Quick setup” on the web), a normal push is rejected — replace main with this folder snapshot.
if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
  echo "Remote already has main — overwriting with this directory (solo site deploy)." >&2
  git push -u origin main --force
else
  git push -u origin main
fi
