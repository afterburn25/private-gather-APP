import {Vibration} from 'react-native';
import {createAudioPlayer,preload,setAudioModeAsync,setIsAudioActiveAsync} from 'expo-audio';

const source=require('../../assets/audio/calling.mp3');
let player:any=null;
let active=false;
let generation=0;
let statusSub:any=null;
let restartTimer:any=null;
try{preload(source)}catch{}

function clearRestart(){
  if(restartTimer){clearTimeout(restartTimer);restartTimer=null;}
}
function clearStatusListener(){
  try{statusSub?.remove?.()}catch{}
  statusSub=null;
}

export async function startCallRingtone(){
  if(active)return;
  const token=++generation;
  active=true;
  clearRestart();
  Vibration.vibrate([0,700,300,700,300,1100],true);
  try{
    await setIsAudioActiveAsync(true);
    if(!active||token!==generation)return;
    await setAudioModeAsync({
      playsInSilentMode:true,
      shouldPlayInBackground:true,
      interruptionMode:'doNotMix',
    });
    if(!active||token!==generation)return;
    if(!player)player=createAudioPlayer(source,{updateInterval:200,downloadFirst:true});
    player.loop=false;
    player.volume=1;
    clearStatusListener();
    statusSub=player.addListener?.('playbackStatusUpdate',(status:any)=>{
      if(!active||token!==generation||!status?.didJustFinish||restartTimer)return;
      // Let the complete ringtone finish before beginning the next pass. A short
      // deliberate gap also prevents duplicate status events from sounding like
      // the file is being restarted in the middle.
      restartTimer=setTimeout(async()=>{
        restartTimer=null;
        if(!active||token!==generation)return;
        try{
          await player?.seekTo?.(0);
          if(active&&token===generation)player?.play?.();
        }catch{}
      },300);
    });
    try{await player.seekTo(0)}catch{}
    if(!active||token!==generation)return;
    player.play();
  }catch(e){
    if(token===generation)active=false;
    Vibration.cancel();
    clearRestart();
    clearStatusListener();
    console.warn('Private Gather ringtone audio failed',String((e as any)?.message||e));
  }
}

export async function stopCallRingtone(){
  active=false;
  generation++;
  Vibration.cancel();
  clearRestart();
  clearStatusListener();
  try{player && (player.loop=false)}catch{}
  try{player?.pause?.()}catch{}
  try{await player?.seekTo?.(0)}catch{}
}

export function isCallRingtoneActive(){return active;}
