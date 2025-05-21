// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

// allow CommonJS (.cjs) modules
defaultConfig.resolver.sourceExts.push('cjs');
// disable the package-exports check so firebase/auth can register
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
