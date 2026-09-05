import {Vibration} from 'react-native';
import {createAudioPlayer,preload,setAudioModeAsync,setIsAudioActiveAsync} from 'expo-audio';

const source=require('../../../../assets/audio/calling.mp3');
const COMPLETE_CLIP_MS=8500;
let player:any=null;
let active=false;
let timer:any;
let generation=0;
try{preload(source)}catch{}

async function playCycle(token:number){
  if(!active||token!==generation)return;
  try{
    if(!player)player=createAudioPlayer(source,{downloadFirst:true,updateInterval:1000});
    player.loop=false;player.volume=1;
    try{await player.seekTo(0)}catch{}
    if(!active||token!==generation)return;
    player.play();
    clearTimeout(timer);
    timer=setTimeout(()=>playCycle(token).catch(()=>{}),COMPLETE_CLIP_MS);
  }catch(e){console.warn('Private Gather Messenger ringtone failed',String((e as any)?.message||e))}
}

export async function startMessengerRinger(){
  if(active)return true;
  active=true;const token=++generation;
  Vibration.vibrate([0,700,300,700,300,1100],true);
  try{await setIsAudioActiveAsync(true);await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'});await playCycle(token);return true}catch{active=false;Vibration.cancel();return false}
}

export async function stopMessengerRinger(){
  active=false;generation++;clearTimeout(timer);timer=undefined;Vibration.cancel();
  try{player?.pause?.()}catch{}
  try{await player?.seekTo?.(0)}catch{}
}

export function isMessengerRingerActive(){return active}
