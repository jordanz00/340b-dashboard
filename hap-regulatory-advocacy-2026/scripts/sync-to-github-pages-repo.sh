#!/usr/bin/env bash
# Sync this folder (hap-regulatory-advocacy-2026) to the standalone GitHub repo
# that powers https://jordanz00.github.io/hap-regulatory-advocacy-2026/
#
# Usage (from anywhere):
#   ./hap-regulatory-advocacy-2026/scripts/sync-to-github-pages-repo.sh
#   HAP_REG_PAGES_REPO=git@github.com:jordanz00/hap-regulatory-advocacy-2026.git ./hap-regulatory-advocacy-2026/scripts/sync-to-github-pages-repo.sh
#
# Requires: git, a clone/push credential for the target repo (HTTPS or SSH).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO="${HAP_REG_PAGES_REPO:-https://github.com/jordanz00/hap-regulatory-advocacy-2026.git}"
MSG="${HAP_REG_SYNC_MSG:-Sync from 340b-dashboard monorepo ($(date -u +%Y-%m-%dT%H:%MZ))}"

TMP="$(mktemp -d)"
cleanup() { rm -rf "${TMP}"; }
trap cleanup EXIT

echo "==> Cloning ${REPO} (shallow)"
git clone --depth 1 "${REPO}" "${TMP}/stand"

echo "==> Replacing tree (keeping .git)"
cd "${TMP}/stand"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "${SRC}/." .

echo "==> Commit + push if needed"
git add -A
if git diff --staged --quiet; then
  echo "No file changes vs standalone repo — nothing to commit."
else
  git commit -m "${MSG}"
  git push origin HEAD:main
  echo "Pushed to origin main. GitHub Actions should deploy Pages shortly."
fi
