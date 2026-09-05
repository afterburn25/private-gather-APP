import {Platform} from 'react-native';
import VoipPushNotification from 'react-native-voip-push-notification';
import {post} from '../api/client';
import {installationId} from '../device/installation';
import {APP_VERSION,RUNTIME_VERSION} from '../config';

type Incoming=(payload:any)=>void;
let wired=false;
async function registerToken(token:string){
  if(!token)return;
  await post('/devices',{
    installation_id:await installationId(),platform:'ios',device_name:'Private Gather iPhone',app_version:APP_VERSION,runtime_version:RUNTIME_VERSION,
    voip_push_provider:'apns',voip_push_token:token,capabilities:{realtime:true,webrtc:true,callkeep:true,voip_push:true,ota:true}
  });
}
export function initializeVoipPush(onIncoming:Incoming){
  if(Platform.OS!=='ios'||wired)return()=>{};wired=true;
  const onRegister=(token:string)=>{registerToken(token).catch(()=>{});};
  const onNotification=(payload:any)=>{onIncoming(payload||{});const uuid=String(payload?.uuid||'');if(uuid)VoipPushNotification.onVoipNotificationCompleted(uuid);};
  const onLoaded=(events:any[])=>{for(const event of events||[]){if(event?.name==='RNVoipPushRemoteNotificationsRegisteredEvent')onRegister(String(event?.data||''));if(event?.name==='RNVoipPushRemoteNotificationReceivedEvent')onNotification(event?.data||{});}};
  VoipPushNotification.addEventListener('register',onRegister);
  VoipPushNotification.addEventListener('notification',onNotification);
  VoipPushNotification.addEventListener('didLoadWithEvents',onLoaded);
  VoipPushNotification.registerVoipToken();
  return()=>{VoipPushNotification.removeEventListener('register');VoipPushNotification.removeEventListener('notification');VoipPushNotification.removeEventListener('didLoadWithEvents');wired=false;};
}
