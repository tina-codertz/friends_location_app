#!/usr/bin/env bash
# Push Connekta/.env to EAS preview + production (run from Connekta folder).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

run_eas() {
  if [[ -x node_modules/.bin/eas ]]; then
    node_modules/.bin/eas "$@"
  else
    npx --yes eas-cli "$@"
  fi
}

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
  # New EXPO_PUBLIC_* vars must not use visibility=secret. Existing secret vars cannot
  # be changed to sensitive (EAS error) — keep MAPBOX as secret if already uploaded.
  if [[ "$NAME" == EXPO_PUBLIC_* && "$VIS" == "secret" ]]; then
    case "$NAME" in
      EXPO_PUBLIC_MAPBOX_TOKEN) ;;
      *)
        VIS="sensitive"
        ;;
    esac
  fi
  echo "→ $ENV / $NAME ($VIS)"
  run_eas env:create "$ENV" --name "$NAME" --value "$VAL" --visibility "$VIS" --force --non-interactive
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
  push_one EXPO_PUBLIC_MAP_PROVIDER plaintext "${EXPO_PUBLIC_MAP_PROVIDER:-mapbox}" "$ENV"
  push_one EXPO_PUBLIC_GOOGLE_MAPS_API_KEY sensitive "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-}" "$ENV"
  push_one EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY sensitive "${EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY:-${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-}}" "$ENV"
  push_one EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY sensitive "${EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY:-${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:-}}" "$ENV"
done

echo ""
echo "Preview variables:"
run_eas env:list --environment preview

echo ""
echo "Done. Rebuild APK: npm run build:android:apk"
