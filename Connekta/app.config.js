/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  const mapboxDownloadsToken = (
    process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN ?? process.env.MAPBOX_DOWNLOADS_TOKEN
  )?.trim();
  if (mapboxDownloadsToken) {
    process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN = mapboxDownloadsToken;
  }
  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const googleMapsIosKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY?.trim() || googleMapsKey;

  const mapProvider = process.env.EXPO_PUBLIC_MAP_PROVIDER?.trim().toLowerCase() || 'mapbox';
  const useGoogleMaps = mapProvider === 'google';

  if (process.env.EAS_BUILD === 'true') {
    if (useGoogleMaps && !googleMapsKey) {
      console.warn(
        '[Connekta] EAS Build: EXPO_PUBLIC_MAP_PROVIDER=google but no Google Maps API key. ' +
          'Run: npm run env:push-eas (sets EXPO_PUBLIC_GOOGLE_MAPS_API_KEY on preview/production).'
      );
    }
    if (!useGoogleMaps && !mapboxToken) {
      console.warn(
        '[Connekta] EAS Build: EXPO_PUBLIC_MAPBOX_TOKEN is missing. ' +
          'Add it with: eas env:create --environment preview --name EXPO_PUBLIC_MAPBOX_TOKEN --value "pk...."'
      );
    }
  }

  const plugins = [
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
        RNMapboxMapsVersion: '11.16.2',
      },
    ],
  ];

  return {
    ...config,
    extra: {
      ...config.extra,
      // Embedded for dev/production builds; also available as EXPO_PUBLIC_MAPBOX_TOKEN in JS
      ...(mapboxToken ? { mapboxAccessToken: mapboxToken } : {}),
      ...(googleMapsKey ? { googleMapsApiKey: googleMapsKey, googleMapsAndroidApiKey: googleMapsKey } : {}),
      ...(googleMapsIosKey ? { googleMapsIosApiKey: googleMapsIosKey } : {}),
    },
    plugins,
    ios: {
      ...config.ios,
      ...(googleMapsIosKey
        ? {
            config: {
              ...(config.ios?.config ?? {}),
              googleMapsApiKey: googleMapsIosKey,
            },
          }
        : {}),
    },
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
