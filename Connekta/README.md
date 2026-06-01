# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Native builds (APK + iOS)

This app uses **Mapbox native SDK** on both Android and iOS. To install on real devices, use **EAS Build** — see **[BUILD.md](./BUILD.md)**.

Quick start:

```bash
npm install
eas login
# set EAS secrets (Mapbox + Firebase) — see BUILD.md
npm run build:android:apk   # Android APK
npm run build:ios           # iOS (Apple Developer account)
```

## Project layout

- `app/` — Expo Router screens
- `connekta-firebase/` — Firebase Auth, Firestore services, security rules (see `connekta-firebase/README.md`)
- `services/` — API facade, biometrics, session timeout
- `components/`, `hooks/`, `constants/`, `types/`

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
