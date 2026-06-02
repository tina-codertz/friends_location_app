# Connekta

Friends location-sharing app — Expo (React Native) + Firebase + Mapbox.

**Full developer guide:** **[APP_GUIDE.md](./APP_GUIDE.md)** — features, screens, Firebase collections, key functions, and data flows.

## What it does

- Email/password auth with username
- Map tab with live friend locations and saved places
- Circle (friends) with invite codes and friend requests
- Emergency contacts + SOS with location
- Session timeout + optional biometric re-sign-in
- Glass UI with dark/light theme

## Get started

```bash
npm install
npx expo start
```

Mapbox requires a **development build** (not Expo Go). For device installs see **[BUILD.md](./BUILD.md)**.

```bash
eas login
npm run env:push-eas      # Firebase + Mapbox secrets
npm run build:android:apk
npm run build:ios
```

## Project layout

| Path | Purpose |
|------|---------|
| `app/` | Expo Router screens |
| `connekta-firebase/` | Firebase Auth, Firestore services, security rules |
| `services/` | API facade (`api.ts`), biometrics, session timeout |
| `context/` | `AuthContext`, `ThemeContext` |
| `hooks/`, `components/`, `types/`, `utils/` | Shared app code |
| `../backend/` | Cloudflare Worker (legacy API + optional WebSocket) |

## Docs

- **[APP_GUIDE.md](./APP_GUIDE.md)** — architecture, features, Firebase, functions
- **[BUILD.md](./BUILD.md)** — EAS builds (APK / IPA)
- **[connekta-firebase/README.md](./connekta-firebase/README.md)** — Firebase folder reference
