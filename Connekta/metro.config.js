const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const shimPath = path.resolve(__dirname, 'shims/expo-keep-awake.ts');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    moduleName === 'expo-keep-awake' &&
    !context.originModulePath?.includes(`${path.sep}shims${path.sep}`)
  ) {
    return { type: 'sourceFile', filePath: shimPath };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
