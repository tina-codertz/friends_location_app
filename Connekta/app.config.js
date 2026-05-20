/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  const mapboxDownloadsToken = (
    process.env.MAPBOX_DOWNLOADS_TOKEN ?? process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN
  )?.trim();
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim();

  return {
    ...config,
    extra: {
      ...config.extra,
      ...(mapboxToken ? { mapboxAccessToken: mapboxToken } : {}),
      ...(googleMapsKey ? { googleMapsAndroidApiKey: googleMapsKey } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
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
          // Native Mapbox SDK v11 (matches @rnmapbox/maps 10.2.10 defaults). Do not use 10.x here.
          RNMapboxMapsVersion: '11.16.2',
          ...(mapboxDownloadsToken
            ? { RNMapboxMapsDownloadToken: mapboxDownloadsToken }
            : {}),
        },
      ],
    ],
    android: {
      ...config.android,
      ...(googleMapsKey
        ? {
            config: {
              ...(config.android?.config ?? {}),
              googleMaps: { apiKey: googleMapsKey },
            },
          }
        : {}),
    },
  };
};
