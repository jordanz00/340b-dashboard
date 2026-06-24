#!/bin/bash
# One-time setup: saves GoDaddy SFTP user + password (Keychain) for deploy-sftp.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env.sftp"
SERVICE="pa-media-booking-sftp"

echo "GoDaddy SFTP setup for pamedia.art"
echo ""
echo "IMPORTANT: Use the SFTP username from GoDaddy — NOT your email."
echo "GoDaddy → Managed WordPress → Manage All → pamedia.art → Settings"
echo "→ Production Site → SSH/SFTP login → Create New Login"
echo "Copy the generated Username, Password, and Hostname exactly."
echo ""

read -r -p "SFTP username: " SFTP_USER
read -r -s -p "SFTP password: " SFTP_PASS
echo ""

if [[ -z "$SFTP_USER" || -z "$SFTP_PASS" ]]; then
  echo "Username and password are required." >&2
  exit 1
fi

security delete-generic-password -s "$SERVICE" >/dev/null 2>&1 || true
security add-generic-password -a "$SFTP_USER" -s "$SERVICE" -w "$SFTP_PASS" -U

cat >"$ENV_FILE" <<EOF
SFTP_HOST=qnv.546.myftpupload.com
SFTP_PORT=22
SFTP_USER=$SFTP_USER
SFTP_KEYCHAIN_SERVICE=$SERVICE
SFTP_REMOTE=/html/wp-content/plugins/pa-media-booking.disabled
EOF
chmod 600 "$ENV_FILE"

echo ""
echo "Saved credentials to Keychain ($SERVICE) and $ENV_FILE"
echo "Deploy with: bash \"$ROOT/deploy-sftp.sh\""
