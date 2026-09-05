import React,{memo,useEffect,useState} from 'react';
import {NativeModules,Platform,Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RTCView} from 'react-native-webrtc';
import {C} from '../../../theme';
import NativeIcon from '../../../components/NativeIcon';

type CallView={id:number;mode:'voice'|'video';peer:string;status:string;localUrl?:string;remoteUrl?:string;photoUrl?:string;incoming?:boolean};
const Video=memo(function Video({url,style,mirror=false,zOrder=0}:{url?:string;style:any;mirror?:boolean;zOrder?:number}){if(!url)return null;return <RTCView streamURL={url} objectFit="cover" mirror={mirror} zOrder={zOrder} style={style}/>},(a,b)=>a.url===b.url&&a.mirror===b.mirror&&a.zOrder===b.zOrder);

export default function MessengerCallScreen({call,onAnswer,onDecline,onEnd,onMute,onVideo,onFlip}:{call:CallView;onAnswer:()=>void;onDecline:()=>void;onEnd:()=>void;onMute:()=>void;onVideo:()=>void;onFlip:()=>void}){
 const insets=useSafeAreaInsets();const [muted,setMuted]=useState(false);const [videoOn,setVideoOn]=useState(call.mode==='video');
 const incoming=!!call.incoming;const hasRemote=!!call.remoteUrl;const hasVideo=call.mode==='video';

 useEffect(()=>{
   if(Platform.OS!=='android')return;
   const access=(NativeModules as any).PrivateGatherCallAccess;
   access?.enterImmersiveCallMode?.().catch?.(()=>{});
   return()=>{access?.exitImmersiveCallMode?.().catch?.(()=>{})};
 },[]);

 return <View style={s.page}>
   <StatusBar hidden translucent backgroundColor="transparent"/>
   {hasVideo&&call.localUrl?<Video url={call.localUrl} style={s.fullVideo} mirror zOrder={0}/>:null}
   {hasVideo&&call.remoteUrl?<Video url={call.remoteUrl} style={s.fullVideo} zOrder={1}/>:null}
   {!hasVideo?<View style={s.voiceBackdrop}/>:null}
   <View pointerEvents="none" style={[s.top,{paddingTop:Math.max(insets.top,8)+8}]}>
     <Text style={s.brand}>PRIVATE GATHER MESSENGER</Text>
     <Text numberOfLines={1} style={s.peer}>{call.peer}</Text>
     <Text style={s.status}>{incoming?'Incoming '+call.mode+' call':call.status}</Text>
   </View>
   {hasRemote&&hasVideo&&call.localUrl?<View style={[s.pip,{top:Math.max(insets.top,8)+88}]}><Video url={call.localUrl} mirror zOrder={2} style={s.pipVideo}/></View>:null}
   <View style={[s.controls,{paddingBottom:Math.max(insets.bottom,8)+18}]}>
     {incoming?<><Control label="Decline" icon="call_end" danger onPress={onDecline}/><Control label="Answer" icon={hasVideo?'videocam':'call'} good onPress={onAnswer}/></>:<><Control label={muted?'Unmute':'Mute'} icon={muted?'mic_off':'mic'} onPress={()=>{setMuted(v=>!v);onMute()}}/>{hasVideo?<Control label={videoOn?'Camera off':'Camera on'} icon={videoOn?'videocam_off':'videocam'} onPress={()=>{setVideoOn(v=>!v);onVideo()}}/>:null}{hasVideo?<Control label="Flip" icon="flip_camera_android" onPress={onFlip}/>:null}<Control label="End" icon="call_end" danger onPress={onEnd}/></>}
   </View>
 </View>;
}
function Control({label,icon,onPress,danger,good}:{label:string;icon:string;onPress:()=>void;danger?:boolean;good?:boolean}){return <View style={s.controlWrap}><Pressable onPress={onPress} style={[s.control,danger&&s.danger,good&&s.good]}><NativeIcon ios={icon==='call_end'?'phone.down.fill':icon==='call'?'phone.fill':icon==='videocam'?'video.fill':icon==='mic'?'mic.fill':icon==='mic_off'?'mic.slash.fill':icon==='videocam_off'?'video.slash.fill':icon==='flip_camera_android'?'arrow.triangle.2.circlepath.camera.fill':'circle'} android={icon} size={25} color="#fff"/></Pressable><Text style={s.controlLabel}>{label}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#02050a',overflow:'hidden'},fullVideo:{position:'absolute',left:0,right:0,top:0,bottom:0,width:'100%',height:'100%'},voiceBackdrop:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#050812'},top:{position:'absolute',left:0,right:0,alignItems:'center',paddingHorizontal:20},brand:{color:C.pink,fontSize:11,fontWeight:'900',letterSpacing:1.1,textShadowColor:'rgba(0,0,0,.8)',textShadowRadius:4},peer:{color:'#fff',fontSize:24,fontWeight:'900',marginTop:9,maxWidth:'92%',textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:6},status:{color:'#fff',fontSize:11,fontWeight:'700',marginTop:5,textTransform:'capitalize',textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:5},pip:{position:'absolute',right:14,width:112,height:168,borderRadius:17,overflow:'hidden',borderWidth:2,borderColor:'rgba(255,255,255,.75)',backgroundColor:'#111'},pipVideo:{position:'absolute',left:0,right:0,top:0,bottom:0,width:'100%',height:'100%'},controls:{position:'absolute',left:12,right:12,bottom:0,flexDirection:'row',justifyContent:'center',alignItems:'flex-start',gap:16},controlWrap:{alignItems:'center',width:68},control:{width:58,height:58,borderRadius:29,backgroundColor:'rgba(45,54,69,.78)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.16)'},danger:{backgroundColor:'#cf3749'},good:{backgroundColor:'#24a868'},controlLabel:{color:'#fff',fontSize:9,fontWeight:'700',marginTop:6,textAlign:'center',textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:4}});
