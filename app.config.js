const fs = require('fs');
const base = require('./app.json').expo;

function optionalFileEnv(name) {
  const value = process.env[name];
  return value && fs.existsSync(value) ? value : undefined;
}

module.exports = ({ config }) => ({
  ...base,
  ...config,
  name: 'Private Gather',
  slug: 'private-gather',
  version: '1.1.199',
  scheme: 'privategather',
  runtimeVersion: process.env.PG_NATIVE_RUNTIME_VERSION || 'pg-native-1',
  updates: {
    ...(base.updates || {}),
    ...(config.updates || {}),
    enabled: true,
    checkAutomatically: 'NEVER',
    fallbackToCacheTimeout: 0,
    ...(process.env.EXPO_UPDATES_URL ? { url: process.env.EXPO_UPDATES_URL } : {}),
  },
  ios: {
    ...(base.ios || {}),
    ...(config.ios || {}),
    ...(process.env.IOS_BUILD_NUMBER ? { buildNumber: String(process.env.IOS_BUILD_NUMBER) } : {}),
  },
  android: {
    ...(base.android || {}),
    ...(config.android || {}),
    ...(process.env.ANDROID_VERSION_CODE ? { versionCode: Number(process.env.ANDROID_VERSION_CODE) } : {}),
    ...(optionalFileEnv('GOOGLE_SERVICES_JSON') ? { googleServicesFile: optionalFileEnv('GOOGLE_SERVICES_JSON') } : {}),
  },
  extra: {
    ...(base.extra || {}),
    ...(config.extra || {}),
    privateGatherApiBase: process.env.EXPO_PUBLIC_PG_API_BASE || 'https://member.privategather.com/api/v1/native',
    privateGatherPushMode: process.env.EXPO_PUBLIC_PG_PUSH_MODE || 'native',
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
