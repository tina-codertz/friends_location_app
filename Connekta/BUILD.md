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

You should see `EXPO_PUBLIC_MAP_PROVIDER` (set to `google` in `eas.json`), `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, Firebase, Mapbox download tokens, and `EXPO_PUBLIC_API_URL`.

**Google Maps on EAS:** `eas.json` sets `EXPO_PUBLIC_MAP_PROVIDER=google`. API keys must be in EAS (not committed in `eas.json`) — add them to `.env` then run `npm run env:push-eas`.

Confirm **production** too if you use `npm run build:android:store`:

```bash
eas env:list --environment production | grep -E 'GOOGLE|MAP_PROVIDER'
```

### Google Maps blank in APK but works in Expo Go?

Expo Go and your **release APK use different signing certificates**. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your Maps API key → **Android app restrictions**:

1. Package name: `com.christinakimario.friendslocationsharing`
2. SHA-1: get the fingerprint EAS uses for the build profile:

```bash
eas credentials -p android
```

Choose the same profile as your build (`preview-apk` or `production`), view the keystore SHA-1, and add it to the key restriction.

Also enable **Maps SDK for Android** on that API key. After changing restrictions, wait a few minutes and install a **new** EAS build (env changes require rebuild).

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
# Must use JDK 17 — Java 25 breaks Gradle with "Unsupported class file major version 69"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

`android/gradle.properties` sets `org.gradle.java.home` to Homebrew OpenJDK 17. If `brew upgrade openjdk@17` changes the path, run `brew --prefix openjdk@17` and update that line.

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
