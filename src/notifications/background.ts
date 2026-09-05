import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import {AppState,Platform} from 'react-native';
import {
  ensurePrivateGatherCallNotifications,
  PRIVATE_GATHER_CALL_CATEGORY,
  PRIVATE_GATHER_CALL_CHANNEL
} from './register';

export const PG_NOTIFICATION_TASK='private-gather-notification-task-v199';

Notifications.setNotificationHandler({
  handleNotification:async(notification)=>{
    const data:any=notification.request.content.data||{};
    const foregroundIncoming=data?.type==='incoming_call'&&AppState.currentState==='active';
    return {
      shouldShowBanner:!foregroundIncoming,
      shouldShowList:!foregroundIncoming,
      shouldPlaySound:!foregroundIncoming,
      shouldSetBadge:!foregroundIncoming,
      priority:Notifications.AndroidNotificationPriority.MAX,
    };
  }
});

TaskManager.defineTask(PG_NOTIFICATION_TASK,async({data,error}:any)=>{
  if(error)return;
  const payload:any=data?.data||data||{};
  if(Platform.OS==='android'&&payload?.type==='incoming_call'&&payload?.call_id){
    if(String(payload.pg_native_fullscreen||'')==='1')return;
    if(AppState.currentState==='active')return;
    await ensurePrivateGatherCallNotifications();
    const video=String(payload.mode||'voice')==='video';
    await Notifications.scheduleNotificationAsync({
      content:{
        title:video?'Incoming Private Gather video call':'Incoming Private Gather call',
        body:`${String(payload.caller_name||'A Private Gather member')} is calling you.`,
        data:payload,
        sound:'calling.wav',
        categoryIdentifier:PRIVATE_GATHER_CALL_CATEGORY,
        color:'#ff35d3',
        sticky:true,
        autoDismiss:false,
        priority:Notifications.AndroidNotificationPriority.MAX,
      },
      trigger:{channelId:PRIVATE_GATHER_CALL_CHANNEL},
    }).catch(()=>{});
  }
});

export async function registerBackgroundNotificationTask(){
  try{
    await ensurePrivateGatherCallNotifications();
    await Notifications.registerTaskAsync(PG_NOTIFICATION_TASK);
  }catch{}
}
