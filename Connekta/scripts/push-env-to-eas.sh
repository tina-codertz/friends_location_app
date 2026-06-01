#!/usr/bin/env bash
# Push Connekta/.env to EAS preview + production (run from Connekta folder).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

EAS="./node_modules/.bin/eas"
if [[ ! -x "$EAS" ]]; then
  echo "Run: npm install"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

RNMAPBOX_VAL="${RNMAPBOX_MAPS_DOWNLOAD_TOKEN:-${MAPBOX_DOWNLOADS_TOKEN:-}}"

push_one() {
  local NAME="$1" VIS="$2" VAL="$3" ENV="$4"
  if [[ -z "$VAL" ]]; then
    echo "skip (empty): $NAME @ $ENV"
    return 0
  fi
  echo "→ $ENV / $NAME ($VIS)"
  "$EAS" env:create "$ENV" --name "$NAME" --value "$VAL" --visibility "$VIS" --force --non-interactive
}

for ENV in preview production; do
  echo "======== $ENV ========"
  push_one EXPO_PUBLIC_API_URL plaintext "$EXPO_PUBLIC_API_URL" "$ENV"
  push_one EXPO_PUBLIC_MAPBOX_TOKEN secret "$EXPO_PUBLIC_MAPBOX_TOKEN" "$ENV"
  push_one MAPBOX_DOWNLOADS_TOKEN secret "$MAPBOX_DOWNLOADS_TOKEN" "$ENV"
  push_one RNMAPBOX_MAPS_DOWNLOAD_TOKEN secret "$RNMAPBOX_VAL" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_API_KEY plaintext "$EXPO_PUBLIC_FIREBASE_API_KEY" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN plaintext "$EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_PROJECT_ID plaintext "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET plaintext "$EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID plaintext "$EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$ENV"
  push_one EXPO_PUBLIC_FIREBASE_APP_ID plaintext "$EXPO_PUBLIC_FIREBASE_APP_ID" "$ENV"
done

echo ""
echo "Preview variables:"
"$EAS" env:list --environment preview

echo ""
echo "Done. Rebuild APK: npm run build:android:apk"
