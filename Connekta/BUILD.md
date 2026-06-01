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

## 2. Copy `.env` to EAS (required for map + auth)

EAS does **not** upload your local `.env` automatically. Push every variable from `.env` to **preview** and **production**:

```bash
cd Connekta
npm run env:push-eas
```

Or manually:

```bash
eas env:push preview --path .env --force
```

Verify:

```bash
eas env:list --environment preview
```

You should see all `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_MAPBOX_TOKEN`, `MAPBOX_DOWNLOADS_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`, and `EXPO_PUBLIC_API_URL`.

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
