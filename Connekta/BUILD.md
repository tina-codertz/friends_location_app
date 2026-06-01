# Building Connekta (Android APK + iOS)

Connekta uses **one Expo project** with native code for **both platforms**:

| Platform | Native stack | Install artifact |
|----------|----------------|------------------|
| **Android** | Mapbox Maps SDK 11 (`@rnmapbox/maps`) + Google Maps config | `.apk` (preview) or `.aab` (Play Store) |
| **iOS** | Mapbox Maps SDK 11 (`@rnmapbox/maps`) | `.ipa` (TestFlight / device) |

You cannot ship Mapbox on **Expo Go**; use **EAS Build** (cloud) or a **local dev build** (`expo run:android` / `expo run:ios`).

---

## 1. One-time setup

From the `Connekta` folder:

```bash
npm install
npm install -g eas-cli
eas login
```

Link the project (already has `projectId` in `app.json`):

```bash
eas whoami
```

---

## 2. Add secrets (required for map + auth)

EAS does **not** upload your local `.env`. Set these on the project (use values from your `.env`):

```bash
cd Connekta

# Mapbox (public token + downloads token for native SDK)
eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value "pk...."
eas secret:create --scope project --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --value "sk...."

# Firebase (all EXPO_PUBLIC_FIREBASE_* from .env)
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "..."
```

Optional (Android legacy map tiles fallback):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY --value "..."
```

List secrets:

```bash
eas secret:list
```

---

## 3. Build Android APK (install on phone)

```bash
npm run build:android:apk
```

Or:

```bash
eas build --platform android --profile preview-apk
```

When the build finishes, open the link from the terminal or [expo.dev](https://expo.dev) → your project → **Builds** → download the **APK** and install on a device (enable “Install unknown apps” if needed).

---

## 4. Build iOS (device / TestFlight)

Requires an **Apple Developer** account. EAS will prompt for credentials the first time.

```bash
npm run build:ios
```

Or:

```bash
eas build --platform ios --profile preview-ios
```

Install via the QR/link from EAS, or submit to TestFlight with `eas submit --platform ios`.

---

## 5. Build both platforms

```bash
npm run build:all
```

Runs Android APK + iOS builds in parallel on EAS servers.

---

## 6. Play Store / App Store (production)

| Store | Command | Output |
|-------|---------|--------|
| Google Play | `npm run build:android:store` | `.aab` |
| App Store | `npm run build:ios:store` | `.ipa` |

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

---

## 7. Local native build (optional, on your Mac)

Generates `android/` and `ios/` folders:

```bash
npx expo prebuild
npx expo run:android   # debug APK on emulator/device
npx expo run:ios       # simulator or device (Xcode required)
```

Release APK locally (after prebuild):

```bash
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## Profiles (`eas.json`)

| Profile | Android | iOS | Use |
|---------|---------|-----|-----|
| `preview-apk` | APK | — | Share APK with testers |
| `preview-ios` | — | Device IPA | iOS testers |
| `preview` | APK | Device IPA | Both (internal) |
| `production` | AAB | IPA | Store release |

---

## Troubleshooting

- **Map blank after install** → Mapbox / Firebase secrets missing on EAS; re-run build after `eas secret:create`.
- **Build fails on Mapbox** → `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` must be a Mapbox **secret** token with `DOWNLOADS:READ`.
- **iOS signing** → Run `eas credentials` or follow prompts on first `eas build -p ios`.
