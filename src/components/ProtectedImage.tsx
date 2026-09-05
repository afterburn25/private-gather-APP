import React,{useEffect,useMemo,useState} from 'react';
import {Image,ImageStyle,StyleProp,Text,View,ViewStyle} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {getToken} from '../auth/session';
import {API_BASE} from '../config';
import {C} from '../theme';

type Props={uri?:string|null;style?:StyleProp<ImageStyle>;fallback?:string;containerStyle?:StyleProp<ViewStyle>;resizeMode?:'cover'|'contain'};

const CACHE_DIR=`${FileSystem.cacheDirectory}private-gather-media-v200/`;
const resolved=new Map<string,string>();
const inflight=new Map<string,Promise<string>>();

function apiOrigin(){try{return new URL(API_BASE).origin}catch{return 'https://member.privategather.com'}}
function normalizeMediaUri(raw:string){
  const value=String(raw||'').trim();if(!value)return '';
  const origin=apiOrigin();
  if(value.startsWith('/'))return origin+value;
  try{
    const u=new URL(value);
    if(u.pathname.includes('/api/v1/native/'))return origin+u.pathname+u.search;
    return value;
  }catch{return value}
}
function protectedNativeMedia(uri:string){
  try{const u=new URL(uri);return u.origin===apiOrigin()&&(u.pathname.includes('/api/v1/native/media/')||u.pathname.includes('/api/v1/native/feed/photos/'))}catch{return false}
}
function keyFor(value:string){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return (hash>>>0).toString(16);
}
function header(headers:any,name:string){
  const target=name.toLowerCase();
  for(const [k,v] of Object.entries(headers||{}))if(String(k).toLowerCase()===target)return String(v||'');
  return '';
}
function extensionFor(contentType:string,uri:string){
  const type=contentType.toLowerCase();
  if(type.includes('png'))return '.png';
  if(type.includes('webp'))return '.webp';
  if(type.includes('gif'))return '.gif';
  if(type.includes('avif'))return '.avif';
  if(type.includes('svg'))return '.svg';
  if(type.includes('jpeg')||type.includes('jpg'))return '.jpg';
  try{
    const ext=(new URL(uri).pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i)||[])[1];
    if(ext)return `.${ext.toLowerCase().replace('jpeg','jpg')}`;
  }catch{}
  return '.jpg';
}
async function existingCached(base:string){
  for(const ext of ['.jpg','.png','.webp','.gif','.avif','.svg']){
    const candidate=base+ext;
    try{const info:any=await FileSystem.getInfoAsync(candidate);if(info?.exists&&Number(info?.size||0)>0)return candidate}catch{}
  }
  return '';
}
async function resolveProtected(uri:string){
  const token=await getToken();
  if(!token)throw new Error('Private Gather media token is unavailable.');
  const cacheKey=keyFor(`${uri}|${token.slice(-16)}`);
  const memoryKey=`${cacheKey}:${uri}`;
  const hit=resolved.get(memoryKey);if(hit)return hit;
  const pending=inflight.get(memoryKey);if(pending)return pending;

  const task=(async()=>{
    await FileSystem.makeDirectoryAsync(CACHE_DIR,{intermediates:true}).catch(()=>{});
    const base=`${CACHE_DIR}${cacheKey}`;
    const disk=await existingCached(base);
    if(disk){resolved.set(memoryKey,disk);return disk}

    const temp=`${base}.download`;
    await FileSystem.deleteAsync(temp,{idempotent:true}).catch(()=>{});
    const result:any=await FileSystem.downloadAsync(uri,temp,{
      headers:{Authorization:`Bearer ${token}`,Accept:'image/*'}
    });
    const status=Number(result?.status||0);
    if(status<200||status>=300){
      await FileSystem.deleteAsync(temp,{idempotent:true}).catch(()=>{});
      throw new Error(`HTTP ${status||'unknown'}`);
    }
    const type=header(result?.headers,'content-type');
    if(type&&!type.toLowerCase().startsWith('image/')){
      await FileSystem.deleteAsync(temp,{idempotent:true}).catch(()=>{});
      throw new Error(`Unexpected media type ${type}`);
    }
    const finalPath=base+extensionFor(type,uri);
    await FileSystem.deleteAsync(finalPath,{idempotent:true}).catch(()=>{});
    await FileSystem.moveAsync({from:temp,to:finalPath});
    resolved.set(memoryKey,finalPath);
    return finalPath;
  })().finally(()=>inflight.delete(memoryKey));

  inflight.set(memoryKey,task);
  return task;
}

export default function ProtectedImage({uri,style,fallback='PG',containerStyle,resizeMode='cover'}:Props){
  const normalized=useMemo(()=>uri?normalizeMediaUri(uri):'',[uri]);
  const protectedMedia=useMemo(()=>!!normalized&&protectedNativeMedia(normalized),[normalized]);
  const [source,setSource]=useState<string>(protectedMedia?'':normalized);
  const [failed,setFailed]=useState(false);

  useEffect(()=>{
    let alive=true;setFailed(false);
    if(!normalized){setSource('');return()=>{alive=false}}
    if(!protectedMedia){setSource(normalized);return()=>{alive=false}}
    setSource('');
    resolveProtected(normalized)
      .then(local=>{if(alive)setSource(local)})
      .catch(e=>{
        console.warn('Private Gather protected image failed',normalized,String((e as any)?.message||e));
        if(alive)setFailed(true);
      });
    return()=>{alive=false};
  },[normalized,protectedMedia]);

  const placeholder=<View style={[{backgroundColor:C.panel3,alignItems:'center',justifyContent:'center'},containerStyle,style as any]}><Text style={{color:C.gold,fontWeight:'900'}}>{fallback.slice(0,2).toUpperCase()}</Text></View>;
  if(!source||failed)return placeholder;

  return <Image
    source={{uri:source}}
    style={style}
    resizeMode={resizeMode}
    fadeDuration={0}
    onError={(event:any)=>{
      console.warn('Private Gather local image decode failed',source,String(event?.nativeEvent?.error||'unknown image error'));
      setFailed(true);
    }}
  />;
}
