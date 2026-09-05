import {Vibration} from 'react-native';
import {createAudioPlayer,preload,setAudioModeAsync,setIsAudioActiveAsync} from 'expo-audio';

const source=require('../../assets/audio/calling.mp3');
let player:any=null;
let active=false;
let generation=0;
try{preload(source)}catch{}

export async function startCallRingtone(){
  if(active)return true;
  const token=++generation;
  active=true;
  Vibration.vibrate([0,700,300,700,300,1100],true);
  try{
    await setIsAudioActiveAsync(true);
    if(!active||token!==generation)return false;
    await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'});
    if(!active||token!==generation)return false;
    if(!player)player=createAudioPlayer(source,{updateInterval:500,downloadFirst:true});
    // Rev6: native audio looping owns the complete 8.307-second media cycle.
    // No playback-status callback is allowed to seek/restart the ringtone early.
    player.loop=true;
    player.volume=1;
    try{await player.seekTo(0)}catch{}
    if(!active||token!==generation)return false;
    player.play();
    return true;
  }catch(e){
    if(token===generation)active=false;
    Vibration.cancel();
    console.warn('Private Gather ringtone audio failed',String((e as any)?.message||e));
    return false;
  }
}

export async function stopCallRingtone(){
  active=false;
  generation++;
  Vibration.cancel();
  try{player && (player.loop=false)}catch{}
  try{player?.pause?.()}catch{}
  try{await player?.seekTo?.(0)}catch{}
}

export function isCallRingtoneActive(){return active;}
