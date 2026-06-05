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

You should see `EXPO_PUBLIC_MAP_PROVIDER` (default `mapbox` in `eas.json`), `EXPO_PUBLIC_MAPBOX_TOKEN`, `MAPBOX_DOWNLOADS_TOKEN` (or `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`), Firebase vars, and `EXPO_PUBLIC_API_URL`.

**Mapbox on EAS (default):** `eas.json` sets `EXPO_PUBLIC_MAP_PROVIDER=mapbox`. Push tokens from `.env` with `npm run env:push-eas`, then **rebuild** the APK/AAB (provider is baked at build time).

If `env:push-eas` fails with *“cannot change a secret variable to a non-secret”* for `EXPO_PUBLIC_MAPBOX_TOKEN`, delete it first (environment is a **positional** argument, not `--environment`):

```bash
npx eas-cli env:delete preview --variable-name EXPO_PUBLIC_MAPBOX_TOKEN --non-interactive
npm run env:push-eas
```

**Optional Google Maps:** set `EXPO_PUBLIC_MAP_PROVIDER=google` in `.env` and EAS, add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, enable Maps SDK + billing + Android SHA-1 in Google Cloud, then rebuild.

Confirm **production** too if you use `npm run build:android:store`:

```bash
eas env:list --environment production | grep -E 'MAPBOX|MAP_PROVIDER'
```

### Beige map with “Google” in the corner (tiles missing)

Only applies when `EXPO_PUBLIC_MAP_PROVIDER=google`.

That means the app **is** using Google Maps, but Google **rejected tile requests** for this APK’s signature. The UI (live feed, markers logic) can work while the basemap stays blank. Fix is in **Google Cloud Console**, not another app code change.

**1. Open the key used for maps** (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — not the Firebase key unless they are the same).

**2. APIs & Services → Library** — enable:
- Maps SDK for Android
- (optional) Maps SDK for iOS

**3. Credentials → your Maps key**

- **Application restrictions** → Android apps → add **both** if you test locally and ship via EAS:
  - Package: `com.christinakimario.friendslocationsharing`
  - SHA-1: from EAS (release APK):

```bash
npx eas-cli credentials -p android
```

Pick the profile you built with (`preview-apk` for `npm run build:android:apk`). Open the keystore → copy **SHA-1 fingerprint**.

- If you also run `npx expo run:android`, add a second entry with your **debug** SHA-1:

```bash
cd android && ./gradlew signingReport
```

Look under `Variant: debug` → `SHA1`.

**4. Quick test:** set the key to **None** (unrestricted) for 5 minutes. Reopen the app (no rebuild needed). If tiles appear, the key is fine and you only need the correct SHA-1 entries — turn restrictions back on after.

**5. Billing:** the Google Cloud project must have billing enabled (Maps has a free tier).

Wait 5–10 minutes after saving key changes, then force-close and reopen Connekta. You do **not** need a new APK for Console-only fixes.

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
