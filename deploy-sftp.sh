#!/bin/bash
# Deploy pa-media-booking to GoDaddy MWP via SFTP (incremental — does not wipe the plugin folder).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.sftp"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

HOST="${SFTP_HOST:-qnv.546.myftpupload.com}"
PORT="${SFTP_PORT:-22}"
LOCAL="$(cd "$SCRIPT_DIR/pa-media-booking" && pwd)"
REMOTE="${SFTP_REMOTE:-/html/wp-content/plugins/pa-media-booking.disabled}"
MU_REMOTE="/html/wp-content/mu-plugins"
SERVICE="${SFTP_KEYCHAIN_SERVICE:-pa-media-booking-sftp}"

if [[ -z "${SFTP_PASS:-}" && -n "${SFTP_KEYCHAIN_SERVICE:-}" ]]; then
  SFTP_PASS="$(security find-generic-password -s "$SERVICE" -w 2>/dev/null || true)"
fi

if [[ -z "${SFTP_USER:-}" || -z "${SFTP_PASS:-}" ]]; then
  echo "SFTP credentials not configured." >&2
  echo "Run: bash \"$LOCAL/bin/setup-sftp-credentials.sh\"" >&2
  exit 1
fi

command -v lftp >/dev/null || { echo "Install lftp: brew install lftp" >&2; exit 1; }

echo "Deploying PA Media Booking → ${HOST}:${REMOTE} ..."
lftp -u "$SFTP_USER","$SFTP_PASS" sftp://"$HOST":"$PORT" <<EOF
set sftp:auto-confirm yes
set cmd:fail-exit yes
mirror -R --verbose --parallel=4 --only-newer \
  --exclude-glob .DS_Store \
  --exclude-glob '.cursor/**' \
  --exclude-glob '*.mjs' \
  --exclude-glob 'deploy/*' \
  --exclude-glob 'bin/*' \
  --exclude-glob 'INSTALL.md' \
  --exclude-glob 'pa-remote-update.php' \
  --exclude-glob 'deploy-*.js' \
  --exclude-glob '.gitignore' \
  "$LOCAL" "$REMOTE"
cd $MU_REMOTE
put "$LOCAL/mu-plugins/pa-booking-godaddy-paylink.php" -o pa-booking-godaddy-paylink.php
put "$LOCAL/mu-plugins/pa-booking-cache-flush.php" -o pa-booking-cache-flush.php
bye
EOF

# Force critical PHP (mirror --only-newer can skip when remote mtimes are newer).
lftp -u "$SFTP_USER","$SFTP_PASS" sftp://"$HOST":"$PORT" <<EOF
set sftp:auto-confirm yes
set cmd:fail-exit yes
cd $REMOTE
put "$LOCAL/pa-media-booking.php" -o pa-media-booking.php
cd $REMOTE/includes
put "$LOCAL/includes/class-frontend.php" -o class-frontend.php
put "$LOCAL/includes/class-cache.php" -o class-cache.php
cd $MU_REMOTE
put "$LOCAL/mu-plugins/pa-booking-cache-flush.php" -o pa-booking-cache-flush.php
bye
EOF

# Always push brand marks (mirror --only-newer can skip refreshed PNGs).
lftp -u "$SFTP_USER","$SFTP_PASS" sftp://"$HOST":"$PORT" <<EOF
set sftp:auto-confirm yes
set cmd:fail-exit yes
cd $REMOTE/assets
put "$LOCAL/assets/pa-logo.png" -o pa-logo.png
put "$LOCAL/assets/pa-logo-dark.png" -o pa-logo-dark.png
put "$LOCAL/assets/pa-logo-white.png" -o pa-logo-white.png
put "$LOCAL/assets/booking-ive.css" -o booking-ive.css
put "$LOCAL/assets/site-ive.css" -o site-ive.css
bye
EOF

echo "Purging GoDaddy page cache via REST..."
PURGE_URL="https://pamedia.art/wp-json/pa-booking/v1/purge-cache?key=pa-deploy-flush-2026"
PURGE_BODY="$(curl -fsS -m 45 -X POST "$PURGE_URL" -H "X-PA-Deploy-Key: pa-deploy-flush-2026" 2>/dev/null || true)"
if [[ -n "$PURGE_BODY" ]]; then
  echo "$PURGE_BODY"
else
  echo "REST purge did not respond yet (mu-plugin may need one request). Flush cache in wp-admin if mobile still looks old."
fi

echo "Warming fresh HTML (mobile + desktop, cache bypass)..."
curl -fsS -m 60 "https://pamedia.art/?nocache=1" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" -o /dev/null || true
curl -fsS -m 60 "https://pamedia.art/?nocache=1" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" -o /dev/null || true
curl -fsS -m 60 "https://pamedia.art/" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" -o /dev/null || true
curl -fsS -m 60 "https://pamedia.art/book/?nocache=1" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" -o /dev/null || true
curl -fsS -m 60 "https://pamedia.art/book/" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" -o /dev/null || true

echo "Done. If CSS/JS or logo still looks stale on phone: wp-admin → GoDaddy Quick Links → Flush Cache, then hard-refresh."
