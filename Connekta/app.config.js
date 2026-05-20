/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      ...(googleMapsKey ? { googleMapsAndroidApiKey: googleMapsKey } : {}),
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Connekta uses your location to show you on the map and optionally share with friends you approve.',
        },
      ],
      ...(googleMapsKey
        ? [
            [
              'react-native-maps',
              {
                googleMapsApiKey: googleMapsKey,
              },
            ],
          ]
        : []),
    ],
    android: {
      ...appJson.expo.android,
      ...(googleMapsKey
        ? {
            config: {
              ...(appJson.expo.android?.config ?? {}),
              googleMaps: { apiKey: googleMapsKey },
            },
          }
        : {}),
    },
  },
};
