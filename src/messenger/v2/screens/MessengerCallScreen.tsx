import React,{memo,useEffect,useRef,useState} from 'react';
import {NativeModules,Platform,Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RTCView} from 'react-native-webrtc';
import {C} from '../../../theme';
import NativeIcon from '../../../components/NativeIcon';
import {audioRouteLabel,CallAudioRoute,getCallAudioRoutes,setCallAudioRoute} from '../../../calls/CallAudioRoutes';

type CallView={id:number;mode:'voice'|'video';peer:string;status:string;localUrl?:string;remoteUrl?:string;photoUrl?:string;incoming?:boolean};
const Video=memo(function Video({url,style,mirror=false,zOrder=0}:{url?:string;style:any;mirror?:boolean;zOrder?:number}){if(!url)return null;return <RTCView streamURL={url} objectFit="cover" mirror={mirror} zOrder={zOrder} style={style}/>},(a,b)=>a.url===b.url&&a.mirror===b.mirror&&a.zOrder===b.zOrder);

export default function MessengerCallScreen({call,onAnswer,onDecline,onEnd,onMute,onVideo,onFlip}:{call:CallView;onAnswer:()=>void;onDecline:()=>void;onEnd:()=>void;onMute:()=>void;onVideo:()=>void;onFlip:()=>void}){
 const insets=useSafeAreaInsets();const [muted,setMuted]=useState(false);const [videoOn,setVideoOn]=useState(call.mode==='video');const [elapsed,setElapsed]=useState(0);const [audioRoutes,setAudioRoutes]=useState<CallAudioRoute[]>([]);const [audioOpen,setAudioOpen]=useState(false);const [audioBusy,setAudioBusy]=useState(false);const activeSince=useRef<number|null>(null);
 const incoming=!!call.incoming;const hasRemote=!!call.remoteUrl;const hasVideo=call.mode==='video';const selectedAudio=audioRoutes.find(r=>r.selected);

 useEffect(()=>{activeSince.current=null;setElapsed(0);setAudioRoutes([]);setAudioOpen(false)},[call.id]);
 useEffect(()=>{
   if(incoming)return;
   const status=String(call.status||'').toLowerCase();
   if(!activeSince.current&&['active','connected'].includes(status))activeSince.current=Date.now();
   if(!activeSince.current)return;
   const tick=()=>setElapsed(Math.max(0,Math.floor((Date.now()-(activeSince.current||Date.now()))/1000)));
   tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);
 },[call.id,call.status,incoming]);
 useEffect(()=>{
   if(Platform.OS!=='android')return;
   const access=(NativeModules as any).PrivateGatherCallAccess;
   access?.enterImmersiveCallMode?.().catch?.(()=>{});
   return()=>{access?.exitImmersiveCallMode?.().catch?.(()=>{})};
 },[]);

 const openAudio=async()=>{if(audioBusy||!call.id)return;setAudioBusy(true);try{const routes=await getCallAudioRoutes();setAudioRoutes(routes);setAudioOpen(true)}finally{setAudioBusy(false)}};
 const chooseAudio=async(route:CallAudioRoute)=>{if(audioBusy)return;setAudioBusy(true);try{await setCallAudioRoute(call.id,route);setAudioRoutes(rows=>rows.map(r=>({...r,selected:r.name===route.name})));setAudioOpen(false)}catch(e){console.warn('Private Gather could not change audio route',String((e as any)?.message||e))}finally{setAudioBusy(false)}};
 const statusText=incoming?`Incoming ${call.mode} call`:activeSince.current?`${prettyStatus(call.status)} · ${formatDuration(elapsed)}`:prettyStatus(call.status);
 return <View style={s.page}>
   <StatusBar hidden translucent backgroundColor="transparent"/>
   {hasVideo&&!hasRemote&&call.localUrl?<Video url={call.localUrl} style={s.fullVideo} mirror zOrder={0}/>:null}
   {hasVideo&&call.remoteUrl?<Video url={call.remoteUrl} style={s.fullVideo} zOrder={0}/>:null}
   {!hasVideo?<View style={s.voiceBackdrop}/>:null}
   <View pointerEvents="none" style={[s.top,{paddingTop:Math.max(insets.top,8)+8}]}>
     <Text style={s.brand}>PRIVATE GATHER MESSENGER</Text>
     <Text numberOfLines={1} style={s.peer}>{call.peer}</Text>
     <Text style={s.status}>{statusText}</Text>
   </View>
   {hasRemote&&hasVideo&&call.localUrl?<View style={[s.pip,{top:Math.max(insets.top,8)+88}]}><Video url={call.localUrl} mirror zOrder={2} style={s.pipVideo}/></View>:null}
   {audioOpen?<View style={s.audioBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setAudioOpen(false)}/><View style={[s.audioSheet,{paddingBottom:Math.max(insets.bottom,12)}]}><View style={s.audioHandle}/><Text style={s.audioTitle}>Call audio</Text><Text style={s.audioCopy}>Choose where Private Gather Messenger plays this call.</Text>{audioRoutes.length?audioRoutes.map(route=><Pressable disabled={audioBusy} key={`${route.name}-${route.type||''}`} onPress={()=>chooseAudio(route)} style={[s.audioRow,route.selected&&s.audioRowOn]}><View style={s.audioIcon}><NativeIcon ios={audioIos(route)} android={audioAndroid(route)} size={22} color={route.selected?C.green:C.cyan2}/></View><Text style={s.audioName}>{audioRouteLabel(route)}</Text>{route.selected?<><Text style={s.audioCurrent}>CURRENT</Text><NativeIcon ios="checkmark.circle.fill" android="check_circle" size={20} color={C.green}/></>:null}</Pressable>):<Text style={s.audioEmpty}>No selectable audio routes are available yet. Connect Bluetooth or a headset and try again.</Text>}<Pressable onPress={()=>setAudioOpen(false)} style={s.audioDone}><Text style={s.audioDoneText}>Done</Text></Pressable></View></View>:null}
   <View style={[s.controls,{paddingBottom:Math.max(insets.bottom,8)+18}]}>
     {incoming?<><Control label="Decline" icon="call_end" danger onPress={onDecline}/><Control label="Answer" icon={hasVideo?'videocam':'call'} good onPress={onAnswer}/></>:<><Control label={muted?'Unmute':'Mute'} icon={muted?'mic_off':'mic'} onPress={()=>{setMuted(v=>!v);onMute()}}/><Control label={selectedAudio?audioRouteLabel(selectedAudio):'Audio'} icon="volume_up" onPress={openAudio}/>{hasVideo?<Control label={videoOn?'Camera off':'Camera on'} icon={videoOn?'videocam_off':'videocam'} onPress={()=>{setVideoOn(v=>!v);onVideo()}}/>:null}{hasVideo?<Control label="Flip" icon="flip_camera_android" onPress={onFlip}/>:null}<Control label="End" icon="call_end" danger onPress={onEnd}/></>}
   </View>
 </View>;
}
function audioIos(route:CallAudioRoute){const value=`${route.name} ${route.type||''}`.toLowerCase();if(value.includes('bluetooth'))return'wave.3.right.circle.fill';if(value.includes('head'))return'headphones';if(value.includes('speaker'))return'speaker.wave.2.fill';return'iphone'}
function audioAndroid(route:CallAudioRoute){const value=`${route.name} ${route.type||''}`.toLowerCase();if(value.includes('bluetooth'))return'bluetooth_audio';if(value.includes('head'))return'headphones';if(value.includes('speaker'))return'volume_up';return'phone_in_talk'}
function prettyStatus(value:string){const v=String(value||'Connecting').replace(/[_-]+/g,' ');return v.charAt(0).toUpperCase()+v.slice(1)}
function formatDuration(total:number){const seconds=Math.max(0,Math.floor(total));const s=String(seconds%60).padStart(2,'0');const minutes=Math.floor(seconds/60);if(minutes<60)return `${String(minutes).padStart(2,'0')}:${s}`;const h=Math.floor(minutes/60);return `${h}:${String(minutes%60).padStart(2,'0')}:${s}`}
function Control({label,icon,onPress,danger,good}:{label:string;icon:string;onPress:()=>void;danger?:boolean;good?:boolean}){return <View style={s.controlWrap}><Pressable onPress={onPress} style={[s.control,danger&&s.danger,good&&s.good]}><NativeIcon ios={icon==='call_end'?'phone.down.fill':icon==='call'?'phone.fill':icon==='videocam'?'video.fill':icon==='mic'?'mic.fill':icon==='mic_off'?'mic.slash.fill':icon==='videocam_off'?'video.slash.fill':icon==='flip_camera_android'?'arrow.triangle.2.circlepath.camera.fill':icon==='volume_up'?'speaker.wave.2.fill':'circle'} android={icon} size={24} color="#fff"/></Pressable><Text numberOfLines={1} style={s.controlLabel}>{label}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#02050a',overflow:'hidden'},fullVideo:{position:'absolute',left:0,right:0,top:0,bottom:0,width:'100%',height:'100%'},voiceBackdrop:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#050812'},top:{position:'absolute',left:0,right:0,alignItems:'center',paddingHorizontal:20},brand:{color:C.pink,fontSize:11,fontWeight:'900',letterSpacing:1.1,textShadowColor:'rgba(0,0,0,.8)',textShadowRadius:4},peer:{color:'#fff',fontSize:24,fontWeight:'900',marginTop:9,maxWidth:'92%',textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:6},status:{color:'#fff',fontSize:11,fontWeight:'700',marginTop:5,textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:5},pip:{position:'absolute',right:14,width:112,height:168,borderRadius:17,overflow:'hidden',borderWidth:2,borderColor:'rgba(255,255,255,.75)',backgroundColor:'#111'},pipVideo:{position:'absolute',left:0,right:0,top:0,bottom:0,width:'100%',height:'100%'},controls:{position:'absolute',left:8,right:8,bottom:0,flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start',columnGap:9,rowGap:9},controlWrap:{alignItems:'center',width:61},control:{width:54,height:54,borderRadius:27,backgroundColor:'rgba(45,54,69,.78)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.16)'},danger:{backgroundColor:'#cf3749'},good:{backgroundColor:'#24a868'},controlLabel:{color:'#fff',fontSize:8.5,fontWeight:'700',marginTop:5,textAlign:'center',width:61,textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:4},audioBackdrop:{...StyleSheet.absoluteFill,zIndex:20,backgroundColor:'rgba(0,0,0,.45)',justifyContent:'flex-end'},audioSheet:{borderTopLeftRadius:26,borderTopRightRadius:26,backgroundColor:'#0b1422',borderWidth:1,borderColor:C.line,paddingHorizontal:16,paddingTop:10},audioHandle:{alignSelf:'center',width:42,height:4,borderRadius:2,backgroundColor:C.faint,marginBottom:10},audioTitle:{color:C.text,fontSize:18,fontWeight:'900'},audioCopy:{color:C.muted,fontSize:10,marginTop:3,marginBottom:10},audioRow:{minHeight:58,borderRadius:16,borderWidth:1,borderColor:C.line,backgroundColor:C.panel2,marginTop:7,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:10},audioRowOn:{borderColor:'rgba(36,229,140,.45)',backgroundColor:'rgba(36,229,140,.06)'},audioIcon:{width:38,height:38,borderRadius:13,backgroundColor:C.panel3,alignItems:'center',justifyContent:'center'},audioName:{flex:1,color:C.text,fontSize:12,fontWeight:'900'},audioCurrent:{color:C.green,fontSize:7,fontWeight:'900',letterSpacing:.8},audioEmpty:{color:C.muted,fontSize:10,lineHeight:15,paddingVertical:18},audioDone:{height:46,borderRadius:15,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',marginTop:12},audioDoneText:{color:'#fff',fontWeight:'900'}});
