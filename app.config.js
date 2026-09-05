const fs = require('fs');
const base = require('./app.json').expo;

function optionalFileEnv(name) {
  const value = process.env[name];
  return value && fs.existsSync(value) ? value : undefined;
}
function pluginName(plugin){return Array.isArray(plugin)?plugin[0]:plugin;}

module.exports = ({ config }) => {
  const flavor=String(process.env.PG_APP_FLAVOR||process.env.EXPO_PUBLIC_PG_APP_FLAVOR||'main').toLowerCase()==='messenger'?'messenger':'main';
  const messenger=flavor==='messenger';
  const plugins=(base.plugins||[]).filter(plugin=>messenger||!['./plugins/withPrivateGatherCallLifecycleFix','./plugins/withPrivateGatherNativeCalling'].includes(pluginName(plugin)));
  const mainIntentFilters=[{action:'VIEW',data:[{scheme:'privategather'}],category:['BROWSABLE','DEFAULT']}];
  const messengerIntentFilters=[
    {action:'VIEW',autoVerify:true,data:[{scheme:'https',host:'member.privategather.com',pathPrefix:'/messenger'},{scheme:'https',host:'member.privategather.com',pathPrefix:'/calls'}],category:['BROWSABLE','DEFAULT']},
    {action:'VIEW',data:[{scheme:'privategathermessenger'}],category:['BROWSABLE','DEFAULT']},
  ];
  return {
    ...base,
    ...config,
    name: messenger?'Private Gather Messenger':'Private Gather',
    slug: messenger?'private-gather-messenger':'private-gather',
    version: '1.2.0',
    scheme: messenger?'privategathermessenger':'privategather',
    runtimeVersion: process.env.PG_NATIVE_RUNTIME_VERSION || (messenger?'pg-messenger-native-1':'pg-native-2'),
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
      bundleIdentifier: messenger?'com.privoralabs.privategather.messenger':'com.privoralabs.privategather',
      infoPlist:{
        ...((base.ios||{}).infoPlist||{}),
        ...((config.ios||{}).infoPlist||{}),
        UIBackgroundModes: messenger?['audio','voip','remote-notification']:['remote-notification'],
      },
      ...(process.env.IOS_BUILD_NUMBER ? { buildNumber: String(process.env.IOS_BUILD_NUMBER) } : {}),
    },
    android: {
      ...(base.android || {}),
      ...(config.android || {}),
      package: messenger?'com.privoralabs.privategather.messenger':'com.privoralabs.privategather',
      permissions: messenger?((base.android||{}).permissions||[]):['CAMERA','RECORD_AUDIO','POST_NOTIFICATIONS','VIBRATE'],
      intentFilters: messenger?messengerIntentFilters:mainIntentFilters,
      ...(process.env.ANDROID_VERSION_CODE ? { versionCode: Number(process.env.ANDROID_VERSION_CODE) } : {}),
      ...(optionalFileEnv('GOOGLE_SERVICES_JSON') ? { googleServicesFile: optionalFileEnv('GOOGLE_SERVICES_JSON') } : {}),
    },
    plugins,
    extra: {
      ...(base.extra || {}),
      ...(config.extra || {}),
      privateGatherApiBase: process.env.EXPO_PUBLIC_PG_API_BASE || 'https://member.privategather.com/api/v1/native',
      privateGatherPushMode: process.env.EXPO_PUBLIC_PG_PUSH_MODE || 'native',
      privateGatherAppFlavor: flavor,
      eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
    },
  };
};
