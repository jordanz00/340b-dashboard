#!/usr/bin/env bash
# Upload staged optimized photos from .photo-optimize-stage/uploads → live WP uploads.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT="$(cd "$LOCAL/.." && pwd)"
ENV_FILE="$PARENT/.env.sftp"
STAGE="$LOCAL/.photo-optimize-stage/uploads"

if [[ ! -d "$STAGE" ]]; then
  echo "No staged uploads. Run: python3 bin/optimize-live-photos.py" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

HOST="${SFTP_HOST:-qnv.546.myftpupload.com}"
PORT="${SFTP_PORT:-22}"
SERVICE="${SFTP_KEYCHAIN_SERVICE:-pa-media-booking-sftp}"
REMOTE_UPLOADS="${SFTP_UPLOADS_REMOTE:-/html/wp-content/uploads}"

if [[ -z "${SFTP_PASS:-}" && -n "${SFTP_KEYCHAIN_SERVICE:-}" ]]; then
  SFTP_PASS="$(security find-generic-password -s "$SERVICE" -w 2>/dev/null || true)"
fi

if [[ -z "${SFTP_USER:-}" || -z "${SFTP_PASS:-}" ]]; then
  echo "SFTP credentials not configured." >&2
  exit 1
fi

command -v lftp >/dev/null || { echo "Install lftp: brew install lftp" >&2; exit 1; }

echo "Uploading optimized photos → ${HOST}:${REMOTE_UPLOADS} ..."
lftp -u "$SFTP_USER","$SFTP_PASS" sftp://"$HOST":"$PORT" <<EOF
set sftp:auto-confirm yes
set cmd:fail-exit yes
mirror -R --parallel=4 \
  --exclude-glob .DS_Store \
  "$STAGE" "$REMOTE_UPLOADS"
bye
EOF

echo "Done. Flush cache in wp-admin if images still look stale."
