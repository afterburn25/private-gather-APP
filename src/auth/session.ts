import * as Keychain from 'react-native-keychain';
const SERVICE='privategather.native.session';
let cachedToken:string|null|undefined=undefined;

export async function getToken(){
  if(cachedToken!==undefined)return cachedToken;
  const c=await Keychain.getGenericPassword({service:SERVICE});
  cachedToken=c?c.password:null;
  return cachedToken;
}
export async function setToken(token:string){
  cachedToken=token;
  await Keychain.setGenericPassword('token',token,{service:SERVICE});
}
export async function clearToken(){
  cachedToken=null;
  await Keychain.resetGenericPassword({service:SERVICE});
}

const FULLSCREEN_SERVICE='privategather.native.fullscreen-call-prompt';
export async function wasFullScreenCallPromptOpened(){const c=await Keychain.getGenericPassword({service:FULLSCREEN_SERVICE});return !!c;}
export async function markFullScreenCallPromptOpened(){await Keychain.setGenericPassword('opened','1',{service:FULLSCREEN_SERVICE});}
