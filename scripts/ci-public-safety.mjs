import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
function pass(msg){console.log(`PASS  ${msg}`)}
function fail(msg){failures++;console.error(`FAIL  ${msg}`)}

const git = spawnSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'});
if(git.status!==0)throw new Error(git.stderr||'git ls-files failed');
const tracked=git.stdout.split('\0').filter(Boolean);

const forbiddenFilePatterns=[
  /(^|\/)\.env$/i,
  /(^|\/)google-services\.json$/i,
  /(^|\/)GoogleService-Info\.plist$/,
  /firebase-service-account.*\.json$/i,
  /\.(jks|keystore|p8|p12|mobileprovision)$/i,
  /(^|\/)(credentials|secrets)\//i,
];
const forbiddenFiles=tracked.filter(file=>forbiddenFilePatterns.some(re=>re.test(file)));
forbiddenFiles.length?fail(`tracked credential files: ${forbiddenFiles.join(', ')}`):pass('no forbidden credential files are tracked');

const textExtensions=new Set(['.js','.mjs','.cjs','.ts','.tsx','.json','.yml','.yaml','.md','.txt','.gradle','.properties','.xml','.plist','.kt','.java','.sh','.ps1']);
const contentPatterns=[
  {name:'private key',re:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/},
  {name:'Firebase service account private_key',re:/["']private_key["']\s*:\s*["']-----BEGIN PRIVATE KEY-----/},
  {name:'hard-coded gateway secret',re:/PG_GATEWAY_SECRET\s*=\s*(?!<|example|replace|change|your-|\$\{|$)[^\s#]+/i},
  {name:'hard-coded Expo token',re:/EXPO_TOKEN\s*=\s*(?!<|example|replace|change|your-|\$\{|$)[^\s#]+/i},
];

const hits=[];
for(const file of tracked){
  const ext=path.extname(file);
  if(!textExtensions.has(ext)&&!['.env.example','.env.build.example','.gitignore'].includes(file))continue;
  let text='';try{text=fs.readFileSync(path.join(root,file),'utf8')}catch{continue}
  for(const pattern of contentPatterns){if(pattern.re.test(text))hits.push(`${pattern.name}: ${file}`)}
}
hits.length?fail(`possible public-repository secrets found:\n  ${hits.join('\n  ')}`):pass('no obvious credential material found in tracked text');

const duplicateScreens=tracked.filter(file=>/^src\/screens\/Private-Gather-.*\.(ts|tsx)$/i.test(file));
duplicateScreens.length?fail(`versioned backup source files are compiled by tsconfig: ${duplicateScreens.join(', ')}`):pass('no versioned backup screens in src/');

console.log(`\nPublic safety gate: ${failures} failure(s).`);
process.exit(failures?1:0);
