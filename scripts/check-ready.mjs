import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const appConfigFactory = require(path.join(root, 'app.config.js'));
const resolvedConfig = appConfigFactory({ config: {} });
const configSource = fs.readFileSync(path.join(root,'src','config.ts'),'utf8');
const loginSource = fs.readFileSync(path.join(root,'src','screens','LoginScreen.tsx'),'utf8');
const homeSource = fs.readFileSync(path.join(root,'src','screens','HomeScreen.tsx'),'utf8');
const callSource = fs.readFileSync(path.join(root,'src','calls','CallManager.ts'),'utf8');
let failures = 0;
let warnings = 0;

function ok(msg) { console.log(`PASS  ${msg}`); }
function warn(msg) { warnings++; console.log(`WARN  ${msg}`); }
function fail(msg) { failures++; console.log(`FAIL  ${msg}`); }
function command(name, args=['--version']) {
  const r = spawnSync(name, args, {encoding:'utf8'});
  if (r.error || r.status !== 0) return null;
  return `${r.stdout || ''}${r.stderr || ''}`.trim() || name;
}

const [nodeMajor,nodeMinor] = process.versions.node.split('.').map(Number);
nodeMajor === 22 && nodeMinor >= 13
  ? ok(`Node ${process.versions.node}`)
  : fail(`Node ${process.versions.node}; use Node 22.13+ for Expo SDK 57`);

const expected='1.1.200';
const runtimeVersions = {
  package: String(pkg.version || ''),
  appJson: String(appJson.version || ''),
  appConfig: String(resolvedConfig.version || ''),
};
Object.values(runtimeVersions).every(v=>v===expected)
  ? ok(`native runtime version consistency ${expected}`)
  : fail(`native runtime version mismatch ${JSON.stringify(runtimeVersions)}`);

configSource.includes("APP_VERSION=String(Constants.expoConfig?.version||'1.1.200')")
  ? ok('source APP_VERSION fallback 1.1.200')
  : fail('source APP_VERSION fallback is not 1.1.200');
loginSource.includes('Private Gather · Native 1.1.200')
  ? ok('visible login version 1.1.200')
  : fail('visible login version is not 1.1.200');

const lockVersion=String(lock.version || lock.packages?.['']?.version || '');
lockVersion===expected
  ? ok(`package-lock metadata ${expected}`)
  : warn(`package-lock metadata is ${lockVersion||'unset'}; npm dependency graph remains authoritative for CI and will be normalized in the next lock refresh`);

appJson.ios?.bundleIdentifier === 'com.privoralabs.privategather' ? ok('iOS bundle identifier') : fail('iOS bundle identifier mismatch');
appJson.android?.package === 'com.privoralabs.privategather' ? ok('Android application id') : fail('Android application id mismatch');
appJson.scheme === 'privategather' ? ok('privategather deep-link scheme') : fail('deep-link scheme mismatch');

!/<Pressable[^>]*>\s*\{' '\}/.test(homeSource)
  ? ok('no raw JSX text separator in Home Pressable controls')
  : fail('raw JSX text separator found under Home Pressable');
!homeSource.includes('comment.parent_comment_id?s.commentReply:null')
  ? ok('Home comment style uses React Native-safe false branch')
  : fail('Home comment style still uses null array member');
callSource.includes("new Promise<void>(resolve=>setTimeout(()=>resolve(),delay))")
  ? ok('CallManager retry Promise typed safely')
  : fail('CallManager retry Promise regression');
callSource.includes('private syncRemoteReceivers')
  ? ok('CallManager receiver synchronization present')
  : fail('CallManager receiver synchronization missing');

const api = process.env.EXPO_PUBLIC_PG_API_BASE || 'https://member.privategather.com/api/v1/native';
api.startsWith('https://') ? ok(`HTTPS API ${api}`) : fail('EXPO_PUBLIC_PG_API_BASE must use HTTPS');

if (process.env.EXPO_PUBLIC_PG_PUSH_MODE === 'native') {
  if (process.env.GOOGLE_SERVICES_JSON && fs.existsSync(process.env.GOOGLE_SERVICES_JSON)) ok('Firebase google-services.json path exists');
  else warn('native push selected but GOOGLE_SERVICES_JSON is not available; Android FCM build will not be complete');
}

process.env.EAS_PROJECT_ID ? ok('EAS project id configured') : warn('EAS_PROJECT_ID is not set yet');
process.env.EXPO_UPDATES_URL ? ok('custom OTA update URL configured') : warn('EXPO_UPDATES_URL is not set; configure before Private Gather OTA testing');

const java = command('java', ['-version']);
java ? ok('Java runtime found') : warn('Java runtime not found');
process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ? ok('Android SDK environment configured') : warn('ANDROID_HOME/ANDROID_SDK_ROOT not set (not required for EAS cloud build)');

for (const secret of ['google-services.json','GoogleService-Info.plist']) {
  if (fs.existsSync(path.join(root, secret))) warn(`${secret} is in project root; keep credentials out of source archives/repositories`);
}

console.log(`\nReady check: ${failures} failure(s), ${warnings} warning(s).`);
process.exit(failures ? 1 : 0);
