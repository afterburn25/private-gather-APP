import React,{memo,useState} from 'react';
import {Pressable,StatusBar,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RTCView} from 'react-native-webrtc';
import {C} from '../theme';
import NativeIcon from '../components/NativeIcon';
import ProtectedImage from '../components/ProtectedImage';

const StableRTCVideo=memo(function StableRTCVideo({streamURL,style,mirror=false,zOrder=0}:{streamURL:string;style:any;mirror?:boolean;zOrder?:number}){
 return <RTCView style={style} streamURL={streamURL} objectFit="cover" mirror={mirror} zOrder={zOrder}/>;
},(a,b)=>a.streamURL===b.streamURL&&a.mirror===b.mirror&&a.zOrder===b.zOrder);

export default function CallScreen({call,onEnd,onMute,onVideo,onFlip,onAnswer,onDecline}:{call:any;onEnd:()=>void;onMute:()=>boolean;onVideo:()=>boolean;onFlip:()=>boolean;onAnswer?:()=>void;onDecline?:()=>void}){
 const insets=useSafeAreaInsets();
 const {width,height}=useWindowDimensions();
 const [muted,setMuted]=useState(false);const [videoOn,setVideoOn]=useState(call.mode==='video');
 const mute=()=>setMuted(onMute());const camera=()=>setVideoOn(onVideo());const incoming=!!call.incoming;
 const waitingVideo=call.mode==='video'&&!call.remoteUrl;
 const topOffset=Math.max(insets.top,18)+10;
 const dockOffset=Math.max(insets.bottom,14)+24;

 return <View style={[s.page,{width,height}]}><StatusBar hidden barStyle="light-content"/>
   {call.remoteUrl?<StableRTCVideo streamURL={call.remoteUrl} style={s.remoteVideo} zOrder={0}/>:
    call.photoUrl?<ProtectedImage uri={call.photoUrl} fallback={call.peer||'PG'} style={s.backgroundPhoto}/>:<View style={s.backgroundPhoto}/>}
   <View style={s.photoShade}/>

   {waitingVideo?<View style={s.previewStage}>
      {call.localUrl?<StableRTCVideo streamURL={call.localUrl} style={s.waitingLocal} mirror zOrder={2}/>:<View style={s.previewStarting}><NativeIcon ios="video.fill" android="videocam" size={34} color={C.cyan2}/><Text style={s.previewStartingText}>Starting your camera…</Text></View>}
   </View>:null}

   {call.remoteUrl&&call.localUrl?<View style={[s.pipFrame,{top:topOffset+38}]}><StableRTCVideo streamURL={call.localUrl} style={s.pip} mirror zOrder={2}/></View>:null}

   <View style={s.topScrim}/><View style={s.bottomScrim}/>
   <View style={[s.top,{top:topOffset}]}>
     <Text style={s.peer}>{call.peer}</Text>
     <Text style={s.status}>{incoming?`Incoming ${call.mode} call`:String(call.status||'Connecting')}</Text>
     {incoming&&call.mode==='video'?<Text style={s.hint}>{call.localUrl?'Preview only — your video is not sent until you answer.':'Starting your private camera preview…'}</Text>:null}
     {!incoming&&call.mode==='video'&&!call.remoteUrl?<Text style={s.hint}>{call.localUrl?'Your camera preview · Waiting for the other member…':'Opening your camera…'}</Text>:null}
   </View>

   <View style={[s.dock,{bottom:dockOffset}]}>{incoming?<View style={s.incomingRow}>
      <IncomingButton label="Decline" danger ios="phone.down.fill" android="call_end" onPress={onDecline||onEnd}/>
      <IncomingButton label={call.mode==='video'?'Answer video':'Answer'} ios={call.mode==='video'?'video.fill':'phone.fill'} android={call.mode==='video'?'videocam':'call'} onPress={onAnswer||(()=>{})}/>
   </View>:<View style={s.controlRow}>
      <ActionButton label={videoOn?'Camera':'Camera off'} ios={videoOn?'video.fill':'video.slash.fill'} android={videoOn?'videocam':'videocam_off'} onPress={camera}/>
      <ActionButton label={muted?'Unmute':'Mute'} ios={muted?'mic.slash.fill':'mic.fill'} android={muted?'mic_off':'mic'} onPress={mute}/>
      <ActionButton label="Hang up" danger large ios="phone.down.fill" android="call_end" onPress={onEnd}/>
      <ActionButton label="Flip" ios="arrow.triangle.2.circlepath.camera.fill" android="cameraswitch" onPress={onFlip}/>
      <ActionButton label="More" ios="ellipsis" android="more_horiz" onPress={()=>{}}/>
   </View>}</View>
 </View>
}

function IncomingButton({label,ios,android,onPress,danger=false}:{label:string;ios:string;android:string;onPress:()=>void;danger?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[s.incomingButton,danger?s.incomingDecline:s.incomingAnswer]}><NativeIcon ios={ios} android={android} size={24} color="#fff"/><Text style={s.incomingButtonText}>{label}</Text></Pressable>
}

function ActionButton({label,ios,android,onPress,danger=false,success=false,large=false}:{label:string;ios:string;android:string;onPress:()=>void;danger?:boolean;success?:boolean;large?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} style={s.action} onPress={onPress}>
   <View style={[s.circle,large&&s.circleLarge,danger&&s.danger,success&&s.success]}><NativeIcon ios={ios} android={android} size={large?30:23} color="#fff"/></View>
   <Text style={s.actionLabel}>{label}</Text>
 </Pressable>
}
const s=StyleSheet.create({
 page:{flex:1,width:'100%',height:'100%',backgroundColor:'#02050a',overflow:'hidden'},
 remoteVideo:{...StyleSheet.absoluteFill,width:'100%',height:'100%',backgroundColor:'#02050a'},
 backgroundPhoto:{...StyleSheet.absoluteFill,backgroundColor:'#02050a'},
 photoShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(2,5,10,.56)'},
 previewStage:{...StyleSheet.absoluteFill,width:'100%',height:'100%',overflow:'hidden',backgroundColor:'#010308',elevation:1},
 waitingLocal:{...StyleSheet.absoluteFill,width:'100%',height:'100%',backgroundColor:'#010308'},
 previewStarting:{flex:1,alignItems:'center',justifyContent:'center',gap:10},previewStartingText:{color:'#d7e1ee',fontSize:11,fontWeight:'800'},
 pipFrame:{position:'absolute',right:16,width:126,height:168,borderRadius:22,borderWidth:2,borderColor:C.cyan,backgroundColor:C.panel,overflow:'hidden',shadowColor:C.cyan,shadowOpacity:.32,shadowRadius:14,elevation:20},
 pip:{width:'100%',height:'100%',backgroundColor:'#010308'},
 topScrim:{position:'absolute',left:0,right:0,top:0,height:190,backgroundColor:'rgba(0,0,0,.25)'},
 bottomScrim:{position:'absolute',left:0,right:0,bottom:0,height:250,backgroundColor:'rgba(0,0,0,.52)'},
 top:{position:'absolute',left:20,right:20,alignItems:'center'},
 peer:{color:'#fff',fontSize:23,fontWeight:'900'},status:{color:'#d7e1ee',fontSize:11,fontWeight:'700',marginTop:7,textTransform:'capitalize'},
 hint:{color:'#c8d2df',fontSize:9.5,fontWeight:'600',marginTop:8,textAlign:'center'},
 dock:{position:'absolute',left:12,right:12,alignItems:'center'},
 controlRow:{width:'100%',flexDirection:'row',alignItems:'flex-end',justifyContent:'space-around'},incomingRow:{width:'94%',flexDirection:'row',justifyContent:'space-between',gap:14},incomingButton:{flex:1,minHeight:62,borderRadius:31,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,borderWidth:2,elevation:12},incomingDecline:{backgroundColor:'#c22d45',borderColor:'#ff6c80'},incomingAnswer:{backgroundColor:'#18a461',borderColor:'#63f0ad'},incomingButtonText:{color:'#fff',fontSize:14,fontWeight:'900'},
 action:{width:76,alignItems:'center',gap:7},circle:{width:54,height:54,borderRadius:27,backgroundColor:'rgba(20,31,48,.94)',borderWidth:1,borderColor:'#3b536f',alignItems:'center',justifyContent:'center'},
 circleLarge:{width:68,height:68,borderRadius:34},danger:{backgroundColor:'#d32f45',borderColor:'#ff6679'},success:{backgroundColor:'#18a461',borderColor:'#5af1a7'},
 actionLabel:{color:'#fff',fontSize:9.5,fontWeight:'800',textAlign:'center'}
});
