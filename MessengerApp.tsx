import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,NativeModules,Platform,StyleSheet,View} from 'react-native';
import * as Notifications from 'expo-notifications';
import {NavigationContainer,createNavigationContainerRef,DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider,initialWindowMetrics} from 'react-native-safe-area-context';
import {login,get,post} from './src/api/client';
import {clearToken,getToken,setToken} from './src/auth/session';
import {registerDevice} from './src/updates/UpdateCoordinator';
import {registerBackgroundNotificationTask} from './src/notifications/background';
import {initializeVoipPush} from './src/notifications/voip';
import {CallManager} from './src/calls/CallManager';
import {MessengerEngine} from './src/messenger/v2/MessengerEngine';
import MessengerLoginScreen from './src/messenger/v2/screens/MessengerLoginScreen';
import MessengerInboxScreen from './src/messenger/v2/screens/MessengerInboxScreen';
import MessengerConversationScreen from './src/messenger/v2/screens/MessengerConversationScreen';
import MessengerCallScreen from './src/messenger/v2/screens/MessengerCallScreen';
import {startMessengerRinger,stopMessengerRinger} from './src/messenger/v2/calls/MessengerRinger';
import {C} from './src/theme';

const Stack=createNativeStackNavigator();const nav=createNavigationContainerRef<any>();const callManager=new CallManager();
const navTheme={...DefaultTheme,colors:{...DefaultTheme.colors,background:C.bg,card:C.bg,text:C.text,border:C.line,primary:C.pink,notification:C.pink}};
type CallView={id:number;mode:'voice'|'video';peer:string;status:string;localUrl?:string;remoteUrl?:string;photoUrl?:string;incoming?:boolean};
type Target={token?:string;conversationId?:number;userId?:number;callMode?:'voice'|'video'};

export default function MessengerApp(){return <SafeAreaProvider initialMetrics={initialWindowMetrics}><MessengerRoot/></SafeAreaProvider>}
function MessengerRoot(){
  const [ready,setReady]=useState(false);const [authed,setAuthed]=useState(false);const [engine,setEngine]=useState<MessengerEngine|null>(null);const [call,setCall]=useState<CallView|null>(null);const [rtConfig,setRtConfig]=useState<any>(null);const [fatal,setFatal]=useState('');const pendingTarget=useRef<Target|null>(null);const pendingIncoming=useRef<any>(null);const fullScreenPrompted=useRef(false);
  const streamState=(state:any)=>{const detail=state.detail;setCall(prev=>{const localUrl=state.local?.toURL?.()||prev?.localUrl;const remoteUrl=state.remote?.toURL?.()||prev?.remoteUrl;return {id:Number(detail?.id||prev?.id||0),mode:(detail?.mode||prev?.mode||'voice') as any,peer:String(detail?.peer?.display_name||detail?.peer?.name||prev?.peer||'Private Gather member'),status:String(state.status||detail?.status||prev?.status||'connecting'),localUrl,remoteUrl,photoUrl:String(detail?.peer?.call_photo_url||detail?.peer?.avatar_url||prev?.photoUrl||'')||undefined,incoming:prev?.incoming}})};
  const ended=()=>{stopMessengerRinger().catch(()=>{});setCall(null)};

  useEffect(()=>{(async()=>{
    let url:string|null=null;try{url=await Linking.getInitialURL()}catch{}
    pendingIncoming.current=parseIncomingCallUrl(url||'');
    if(!pendingIncoming.current)pendingTarget.current=parseTarget(url||'');
    if(pendingTarget.current?.token){try{const r=await post('/messenger/handoff/exchange',{token:pendingTarget.current.token});if(r?.token)await setToken(String(r.token))}catch(e:any){setFatal(String(e?.message||e))}}
    setAuthed(!!(await getToken()));setReady(true)
  })()},[]);
  useEffect(()=>{
    const sub=Linking.addEventListener('url',e=>{
      const incoming=parseIncomingCallUrl(e.url);
      if(incoming){pendingIncoming.current=incoming;if(authed){pendingIncoming.current=null;handleIncomingLink(incoming).catch(()=>{})}return}
      const target=parseTarget(e.url);if(!target)return;pendingTarget.current=target;
      if(target.token)post('/messenger/handoff/exchange',{token:target.token}).then(async r=>{if(r?.token){await setToken(String(r.token));setAuthed(true)}}).catch(()=>{});
      else if(authed&&engine)applyTarget(target,engine).catch(()=>{})
    });
    return()=>sub.remove()
  },[authed,engine]);

  useEffect(()=>{if(!authed)return;let stopped=false;let current:MessengerEngine|null=null;let stopIncoming=()=>{};let stopVoip=()=>{};let received:any;let tapped:any;(async()=>{try{setFatal('');current=new MessengerEngine();await current.boot();if(stopped){current.stop();return}setEngine(current);const cfg=(await get('/realtime/config')).data;setRtConfig(cfg);await callManager.configure((callId:number)=>answerIncomingId(callId).catch(()=>{}),()=>callManager.end().catch(()=>{}));stopIncoming=callManager.watchIncoming(p=>showIncoming(p).catch(()=>{}),1600);await registerBackgroundNotificationTask().catch(()=>{});registerDevice().catch(()=>{});offerFullScreenCallAccess().catch(()=>{});stopVoip=initializeVoipPush(p=>showIncoming(p).catch(()=>{}));received=Notifications.addNotificationReceivedListener(n=>{const d:any=n.request.content.data||{};if(d.type==='incoming_call')showIncoming(d).catch(()=>{})});tapped=Notifications.addNotificationResponseReceivedListener(r=>{const d:any=r.notification.request.content.data||{};if(d.type==='incoming_call')showIncoming(d).catch(()=>{})});const incoming=pendingIncoming.current;pendingIncoming.current=null;if(incoming)await handleIncomingLink(incoming);const target=pendingTarget.current;pendingTarget.current=null;if(target)await applyTarget(target,current);}catch(e:any){if(!stopped)setFatal(String(e?.message||e))}})();return()=>{stopped=true;stopIncoming();stopVoip();received?.remove?.();tapped?.remove?.();current?.stop();setEngine(null)}},[authed]);

  async function showIncoming(payload:any){
    const normalized=await callManager.incoming(payload,false);if(!normalized)return;const id=Number(normalized.call_id||0);if(!id)return;
    let detail:any=null;try{detail=(await get(`/calls/${id}`)).data}catch{}
    if(detail&&String(detail.status||'')!=='ringing')return;
    const mode=(detail?.mode||normalized.mode)==='video'?'video':'voice';const peer=String(detail?.peer?.display_name||normalized.caller_name||'Private Gather member');const action=String(payload?.action||'');
    setCall(prev=>prev?.id&&prev.id!==id?prev:{...prev,id,mode,peer,status:'incoming',incoming:true});
    if(Platform.OS==='android'&&AppState.currentState==='active'&&!action){
      const access=(NativeModules as any).PrivateGatherCallAccess;
      try{await access?.cancelIncomingCallNotification?.(id)}catch{}
      try{if(await access?.presentIncomingCall?.(id,mode,peer))return}catch(e){console.warn('Messenger native incoming-call activity unavailable',String((e as any)?.message||e))}
    }
    if(AppState.currentState==='active')await startMessengerRinger().catch(()=>false);
    if(mode==='video')try{const preview=await callManager.prepareIncomingPreview(id,detail||normalized);const localUrl=preview.local?.toURL?.();if(localUrl)setCall(prev=>prev&&prev.id===id?{...prev,localUrl}:prev)}catch(e){console.warn('Messenger incoming preview unavailable',String((e as any)?.message||e))}
  }

  async function handleIncomingLink(payload:any){
    const id=Number(payload?.call_id||0);if(!id)return;
    if(String(payload?.action||'')==='decline'){await stopMessengerRinger().catch(()=>{});await callManager.incoming(payload,false);await callManager.decline().catch(()=>{});setCall(null);return}
    await showIncoming(payload);
    if(String(payload?.action||'')==='answer')await answerIncomingId(id);
  }

  async function offerFullScreenCallAccess(){
    if(Platform.OS!=='android'||Number(Platform.Version)<34||fullScreenPrompted.current)return;
    fullScreenPrompted.current=true;
    try{
      const access=(NativeModules as any).PrivateGatherCallAccess;const allowed=access?.canUseFullScreenIntent?await access.canUseFullScreenIntent():true;if(allowed)return;
      Alert.alert('Enable full-screen incoming calls','Allow Private Gather Messenger to take over the screen for incoming calls, like the phone app.',[{text:'Not now',style:'cancel'},{text:'Open setting',onPress:()=>access?.openFullScreenIntentSettings?.().catch?.(()=>{})}]);
    }catch{}
  }

  async function answerIncomingId(callId:number){
    if(!callId)return;
    try{
      await stopMessengerRinger();
      setCall(prev=>prev?{...prev,id:callId,status:'answering'}:{id:callId,mode:'voice',peer:'Private Gather member',status:'answering',incoming:true});
      await callManager.answer();
      setCall(prev=>prev?{...prev,status:'connecting',incoming:false}:prev);
      const opened=await callManager.open(callId,rtConfig,streamState,ended);
      setCall(prev=>prev?{...prev,mode:opened.detail?.mode||prev.mode,peer:opened.detail?.peer?.display_name||prev.peer,status:'active',incoming:false}:prev);
    }catch(e:any){setFatal(String(e?.message||e));await callManager.end().catch(()=>{});setCall(null)}
  }
  async function answerIncoming(){if(call?.id)await answerIncomingId(call.id)}

  async function startCall(peer:any,mode:'voice'|'video'){
    const target={userId:Number(peer?.member_id||peer?.user_id||0)||undefined,username:String(peer?.username||'').replace(/^@/,'')||undefined,conversationId:Number(peer?.conversation_id||peer?.id||0)||undefined};
    try{setCall({id:0,mode,peer:String(peer?.display_name||peer?.name||'Private Gather member'),status:'starting',incoming:false});const started=await callManager.start(target,mode,String(peer?.display_name||peer?.name||'Private Gather member'),rtConfig,streamState,ended);setCall(prev=>prev?{...prev,id:Number(started.call_id),status:'ringing'}:prev)}catch(e:any){setFatal(String(e?.message||e));setCall(null)}}
  async function applyTarget(target:Target,e:MessengerEngine){
    let cid=Number(target.conversationId||0);if(!cid&&target.userId)cid=await e.startConversation(Number(target.userId));
    if(cid&&nav.isReady())nav.navigate('Conversation',{id:cid,autoCall:target.callMode||undefined});
  }
  async function signIn(email:string,password:string){const r=await login(email,password,'Private Gather Messenger');await setToken(String(r.token));setAuthed(true)}
  async function logout(){engine?.stop();await clearToken();setAuthed(false)}

  if(!ready)return <View style={s.loading}><ActivityIndicator color={C.pink}/></View>;
  if(!authed)return <MessengerLoginScreen onLogin={signIn}/>;
  if(call)return <MessengerCallScreen call={call} onAnswer={answerIncoming} onDecline={()=>{stopMessengerRinger().catch(()=>{});callManager.decline().catch(()=>{});setCall(null)}} onEnd={()=>{stopMessengerRinger().catch(()=>{});callManager.end().catch(()=>{});setCall(null)}} onMute={()=>callManager.toggleMute()} onVideo={()=>callManager.toggleVideo()} onFlip={()=>callManager.flipCamera()}/>;
  if(!engine)return <View style={s.loading}><ActivityIndicator color={C.pink}/></View>;
  return <NavigationContainer ref={nav} theme={navTheme}><Stack.Navigator screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}><Stack.Screen name="Inbox">{()=> <MessengerInboxScreen engine={engine} onConversation={id=>nav.navigate('Conversation',{id})} onLogout={logout}/>}</Stack.Screen><Stack.Screen name="Conversation">{({route}:any)=> <ConversationRoute engine={engine} route={route} onBack={()=>nav.goBack()} onCall={startCall}/>}</Stack.Screen></Stack.Navigator></NavigationContainer>;
}
function ConversationRoute({engine,route,onBack,onCall}:{engine:MessengerEngine;route:any;onBack:()=>void;onCall:(peer:any,mode:'voice'|'video')=>void}){const auto=useRef(false);const [peer,setPeer]=useState<any>(null);useEffect(()=>{if(auto.current||!route.params?.autoCall)return;auto.current=true;engine.openConversation(Number(route.params.id)).then(p=>{setPeer(p?.conversation);if(p?.conversation)onCall(p.conversation,route.params.autoCall)}).catch(()=>{})},[engine,route.params?.id,route.params?.autoCall,onCall]);return <MessengerConversationScreen engine={engine} conversationId={Number(route.params.id)} onBack={onBack} onCall={onCall}/>}
function parseIncomingCallUrl(url:string){
  if(!url||!url.startsWith('privategathermessenger://incoming-call'))return null;
  const query=url.split('?')[1]||'';const row:any={};for(const part of query.split('&')){if(!part)continue;const [k,v='']=part.split('=');row[decodeURIComponent(k)]=decodeURIComponent(v.replace(/\+/g,' '))}
  const id=Number(row.call_id||0);if(!id)return null;return {type:'incoming_call',call_id:id,mode:row.mode==='video'?'video':'voice',caller_id:Number(row.caller_id||0)||undefined,caller_name:row.caller_name||'Private Gather member',action:String(row.action||'')};
}
function parseTarget(url:string):Target|null{if(!url||!url.startsWith('privategathermessenger://'))return null;if(url.startsWith('privategathermessenger://incoming-call'))return null;const query=url.split('?')[1]||'';const row:any={};for(const part of query.split('&')){if(!part)continue;const [k,v='']=part.split('=');row[decodeURIComponent(k)]=decodeURIComponent(v.replace(/\+/g,' '))}return {token:row.token||undefined,conversationId:Number(row.conversation_id||0)||undefined,userId:Number(row.user_id||0)||undefined,callMode:row.call_mode==='video'?'video':row.call_mode==='voice'?'voice':undefined}}
const s=StyleSheet.create({loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'}});
