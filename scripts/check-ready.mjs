import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
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

const nodeMajor = Number(process.versions.node.split('.')[0]);
nodeMajor === 22 ? ok(`Node ${process.versions.node}`) : fail(`Node ${process.versions.node}; use Node 22.13+ for Expo SDK 57`);
pkg.version === '1.1.188' ? ok('native package version 1.1.188') : fail(`unexpected package version ${pkg.version}`);
app.ios?.bundleIdentifier === 'com.privoralabs.privategather' ? ok('iOS bundle identifier') : fail('iOS bundle identifier mismatch');
app.android?.package === 'com.privoralabs.privategather' ? ok('Android application id') : fail('Android application id mismatch');
app.scheme === 'privategather' ? ok('privategather deep-link scheme') : fail('deep-link scheme mismatch');

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
