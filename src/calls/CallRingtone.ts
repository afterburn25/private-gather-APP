import {Vibration} from 'react-native';
import {createAudioPlayer,preload,setAudioModeAsync,setIsAudioActiveAsync} from 'expo-audio';

const source=require('../../assets/audio/calling.mp3');
let player:any=null;
let active=false;
try{preload(source)}catch{}

export async function startCallRingtone(){
  if(active)return;
  active=true;
  Vibration.vibrate([0,700,300,700,300,1100],true);
  try{
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      playsInSilentMode:true,
      shouldPlayInBackground:true,
      interruptionMode:'doNotMix',
    });
    if(!player)player=createAudioPlayer(source);
    player.loop=true;
    player.volume=1;
    try{await player.seekTo(0)}catch{}
    player.play();
  }catch(e){
    console.warn('Private Gather ringtone audio failed',String((e as any)?.message||e));
  }
}

export async function stopCallRingtone(){
  active=false;
  Vibration.cancel();
  try{
    player?.pause?.();
    await player?.seekTo?.(0);
  }catch{}
}

export function isCallRingtoneActive(){return active;}
