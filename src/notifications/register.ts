import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';

export const PRIVATE_GATHER_CALL_CHANNEL='pg-calls-v199';
export const PRIVATE_GATHER_CALL_CATEGORY='pgincomingcall';
export const PRIVATE_GATHER_CALL_ANSWER='PGANSWER';
export const PRIVATE_GATHER_CALL_DECLINE='PGDECLINE';

type PushRegistration={provider:'expo'|'apns'|'fcm',token:string}|null;

export async function ensurePrivateGatherCallNotifications(){
  if(Platform.OS==='android'){
    await Notifications.setNotificationChannelAsync(PRIVATE_GATHER_CALL_CHANNEL,{
      name:'Private Gather incoming calls',
      description:'Incoming Private Gather voice and video calls',
      importance:Notifications.AndroidImportance.MAX,
      vibrationPattern:[0,700,300,700,300,1100],
      lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC,
      sound:'calling.wav',
      enableVibrate:true,
      showBadge:true,
    }).catch(()=>{});
  }
  await Notifications.setNotificationCategoryAsync(PRIVATE_GATHER_CALL_CATEGORY,[
    {identifier:PRIVATE_GATHER_CALL_ANSWER,buttonTitle:'Answer',options:{opensAppToForeground:true}},
    {identifier:PRIVATE_GATHER_CALL_DECLINE,buttonTitle:'Decline',options:{opensAppToForeground:true,isDestructive:true}},
  ]).catch(()=>{});
}

export async function ensureNotificationPermissions(){
  if(!Device.isDevice)return false;
  try{
    await ensurePrivateGatherCallNotifications();
    const current=await Notifications.getPermissionsAsync();
    let status=current.status;
    if(status!=='granted')status=(await Notifications.requestPermissionsAsync()).status;
    if(status!=='granted')return false;
    if(Platform.OS==='android'){
      await Notifications.setNotificationChannelAsync('messages',{name:'Messages',importance:Notifications.AndroidImportance.HIGH}).catch(()=>{});
      await Notifications.setNotificationChannelAsync('updates',{name:'App updates',importance:Notifications.AndroidImportance.DEFAULT}).catch(()=>{});
    }
    return true;
  }catch{return false}
}

export async function registerPush():Promise<PushRegistration>{
  try{
    if(!(await ensureNotificationPermissions()))return null;
    const configuredMode=String((Constants.expoConfig?.extra as any)?.privateGatherPushMode||'native').toLowerCase();
    const mode=Platform.OS==='android'?'native':configuredMode;
    if(mode==='native'){
      const native=await Notifications.getDevicePushTokenAsync();
      const token=String(native?.data||'').trim();
      return token?{provider:Platform.OS==='ios'?'apns':'fcm',token}:null;
    }
    const projectId=(Constants.easConfig as any)?.projectId || (Constants.expoConfig?.extra as any)?.eas?.projectId;
    const token=await Notifications.getExpoPushTokenAsync(projectId?{projectId}:undefined);
    return token?.data?{provider:'expo',token:token.data}:null;
  }catch(e){
    console.warn('Private Gather push registration unavailable',String((e as any)?.message||e));
    return null;
  }
}
