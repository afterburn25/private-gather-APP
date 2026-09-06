import RNCallKeep from 'react-native-callkeep';
import {Platform} from 'react-native';
import {callUuid} from './callIdentity';

const CallKeep:any=RNCallKeep;
export type CallAudioRoute={name:string;type?:string;selected?:boolean};

function normalize(rows:any[]):CallAudioRoute[]{
  const seen=new Set<string>();const out:CallAudioRoute[]=[];
  for(const row of Array.isArray(rows)?rows:[]){
    const name=String(row?.name||row?.type||'').trim();if(!name||seen.has(name))continue;seen.add(name);
    out.push({name,type:String(row?.type||''),selected:row?.selected===true});
  }
  return out;
}

export async function getCallAudioRoutes():Promise<CallAudioRoute[]>{
  try{return normalize(await CallKeep.getAudioRoutes())}catch(e){console.warn('Private Gather audio routes unavailable',String((e as any)?.message||e));return []}
}

export async function setCallAudioRoute(callId:number,route:CallAudioRoute|string){
  if(!callId)throw new Error('The call is not active yet.');
  const name=typeof route==='string'?route:route.name;
  if(!name)throw new Error('Choose an audio route.');
  const uuid=callUuid(callId);
  try{
    const result=await CallKeep.setAudioRoute(uuid,name);
    return result??name;
  }catch(e){
    if(Platform.OS==='android'&&typeof CallKeep.toggleAudioRouteSpeaker==='function'){
      const type=typeof route==='string'?name:String(route.type||name);
      if(/speaker/i.test(`${name} ${type}`)){CallKeep.toggleAudioRouteSpeaker(uuid,true);return name}
      if(/phone|earpiece|wired/i.test(`${name} ${type}`)){CallKeep.toggleAudioRouteSpeaker(uuid,false);return name}
    }
    throw e;
  }
}

export function audioRouteLabel(route:CallAudioRoute){
  const raw=`${route.name} ${route.type||''}`.toLowerCase();
  if(raw.includes('bluetooth'))return'Bluetooth';
  if(raw.includes('headset')||raw.includes('headphone')||raw.includes('wired'))return'Headset';
  if(raw.includes('speaker'))return'Speaker';
  if(raw.includes('phone')||raw.includes('earpiece')||raw.includes('receiver'))return'Phone';
  return route.name;
}
