/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
const mapboxDownloadsToken = process.env.MAPBOX_DOWNLOADS_TOKEN?.trim();
const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      ...(mapboxToken ? { mapboxAccessToken: mapboxToken } : {}),
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
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsVersion: '11.8.0',
          ...(mapboxDownloadsToken
            ? { RNMapboxMapsDownloadToken: mapboxDownloadsToken }
            : {}),
        },
      ],
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
