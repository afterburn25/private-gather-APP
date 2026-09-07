import * as Keychain from 'react-native-keychain';

const CONFIG_SERVICE='privategather.native.app-lock.config';
const PIN_SERVICE='privategather.native.app-lock.pin';
const BIO_SERVICE='privategather.native.app-lock.biometric';

export type AppLockConfig={enabled:boolean;biometric:boolean;timeoutSeconds:number};
export type AppLockStatus=AppLockConfig&{biometryType:string|null;hasPin:boolean};

const DEFAULT_CONFIG:AppLockConfig={enabled:false,biometric:false,timeoutSeconds:15};
function normalizeTimeout(value:any){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.min(3600,Math.floor(n)):15}

async function readConfig():Promise<AppLockConfig>{
  try{
    const row=await Keychain.getGenericPassword({service:CONFIG_SERVICE});
    if(!row)return DEFAULT_CONFIG;
    const parsed=JSON.parse(row.password||'{}');
    return {enabled:parsed?.enabled===true,biometric:parsed?.biometric===true,timeoutSeconds:normalizeTimeout(parsed?.timeoutSeconds)};
  }catch{return DEFAULT_CONFIG}
}

async function writeConfig(config:AppLockConfig){
  await Keychain.setGenericPassword('config',JSON.stringify(config),{service:CONFIG_SERVICE});
}

export async function appLockStatus():Promise<AppLockStatus>{
  const config=await readConfig();
  let biometryType:string|null=null;try{biometryType=(await Keychain.getSupportedBiometryType())||null}catch{}
  let hasPin=false;try{hasPin=!!(await Keychain.getGenericPassword({service:PIN_SERVICE}))}catch{}
  return {...config,biometryType,hasPin};
}

export async function enableAppLock(pin:string,useBiometric:boolean,timeoutSeconds=15){
  const normalized=String(pin||'').trim();
  if(!/^\d{4,8}$/.test(normalized))throw new Error('Choose a 4–8 digit Private Gather PIN.');
  await Keychain.setGenericPassword('pin',normalized,{service:PIN_SERVICE,accessible:Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  let biometric=false;
  if(useBiometric){
    const supported=await Keychain.getSupportedBiometryType();
    if(!supported)throw new Error('Biometric authentication is not enrolled on this device.');
    await Keychain.setGenericPassword('unlock','private-gather-app-lock',{service:BIO_SERVICE,accessible:Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,accessControl:Keychain.ACCESS_CONTROL.BIOMETRY_ANY});
    biometric=true;
  }else{
    await Keychain.resetGenericPassword({service:BIO_SERVICE}).catch(()=>{});
  }
  const config={enabled:true,biometric,timeoutSeconds:normalizeTimeout(timeoutSeconds)};
  await writeConfig(config);return config;
}

export async function updateAppLockBiometric(enabled:boolean){
  const current=await readConfig();
  if(!current.enabled)throw new Error('Enable App Lock first.');
  if(enabled){
    const supported=await Keychain.getSupportedBiometryType();
    if(!supported)throw new Error('Biometric authentication is not enrolled on this device.');
    await Keychain.setGenericPassword('unlock','private-gather-app-lock',{service:BIO_SERVICE,accessible:Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,accessControl:Keychain.ACCESS_CONTROL.BIOMETRY_ANY});
  }else await Keychain.resetGenericPassword({service:BIO_SERVICE}).catch(()=>{});
  const next={...current,biometric:enabled};await writeConfig(next);return next;
}

export async function updateAppLockTimeout(timeoutSeconds:number){
  const current=await readConfig();if(!current.enabled)throw new Error('Enable App Lock first.');
  const next={...current,timeoutSeconds:normalizeTimeout(timeoutSeconds)};await writeConfig(next);return next;
}

export async function changeAppLockPin(pin:string){
  const normalized=String(pin||'').trim();if(!/^\d{4,8}$/.test(normalized))throw new Error('Choose a 4–8 digit Private Gather PIN.');
  await Keychain.setGenericPassword('pin',normalized,{service:PIN_SERVICE,accessible:Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
}

export async function disableAppLock(){
  await Promise.allSettled([Keychain.resetGenericPassword({service:CONFIG_SERVICE}),Keychain.resetGenericPassword({service:PIN_SERVICE}),Keychain.resetGenericPassword({service:BIO_SERVICE})]);
}

export async function verifyAppLockPin(pin:string){
  try{const row=await Keychain.getGenericPassword({service:PIN_SERVICE});return !!row&&row.password===String(pin||'').trim()}catch{return false}
}

export async function unlockWithBiometric(){
  try{
    const row=await Keychain.getGenericPassword({service:BIO_SERVICE,authenticationPrompt:{title:'Unlock Private Gather',subtitle:'Use your biometric to open the app',cancel:'Use PIN'}});
    return !!row&&row.password==='private-gather-app-lock';
  }catch{return false}
}
