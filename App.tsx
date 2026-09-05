import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,AppState,Linking,NativeModules,Platform,StatusBar,StyleSheet,Text,View} from 'react-native';
import * as Notifications from 'expo-notifications';
import {NavigationContainer,createNavigationContainerRef,DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider,SafeAreaView,initialWindowMetrics,useSafeAreaInsets} from 'react-native-safe-area-context';
import {login,get,post} from './src/api/client';
import {getToken,setToken} from './src/auth/session';
import {registerDevice,checkForControlledUpdate,startControlledUpdateLoop} from './src/updates/UpdateCoordinator';
import {ReverbClient} from './src/realtime/ReverbClient';
import {CallManager} from './src/calls/CallManager';
import {registerBackgroundNotificationTask} from './src/notifications/background';
import {PRIVATE_GATHER_CALL_ANSWER,PRIVATE_GATHER_CALL_DECLINE} from './src/notifications/register';
import {initializeVoipPush} from './src/notifications/voip';
import {C} from './src/theme';
import {Member,NotificationCard} from './src/app/types';
import NativeIcon from './src/components/NativeIcon';
import LoginScreen from './src/screens/LoginScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import HomeScreen from './src/screens/HomeScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import MessengerBridgeScreen from './src/messenger/MessengerBridgeScreen';
import {openMessenger} from './src/messenger/MessengerBridge';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import MemberProfileScreen from './src/screens/MemberProfileScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import ClubDetailScreen from './src/screens/ClubDetailScreen';
import ConversationScreen from './src/screens/ConversationScreen';
import CallScreen from './src/screens/CallScreen';
import {startCallRingtone,stopCallRingtone} from './src/calls/CallRingtone';
import * as SplashScreen from 'expo-splash-screen';
import * as IntentLauncher from 'expo-intent-launcher';

SplashScreen.preventAutoHideAsync().catch(()=>{});
SplashScreen.setOptions({duration:0,fade:false});

const callManager=new CallManager();
const Stack=createNativeStackNavigator();
const Tabs=createBottomTabNavigator();
const navRef=createNavigationContainerRef<any>();

type CallView={id:number;mode:'voice'|'video';peer:string;status:string;localUrl?:string;remoteUrl?:string;photoUrl?:string;incoming?:boolean;localRevision?:number;remoteRevision?:number};

const navTheme={...DefaultTheme,colors:{...DefaultTheme.colors,background:C.bg,card:C.bg,text:C.text,border:C.line,primary:C.pink,notification:C.pink}};

export default function App(){
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><PrivateGatherApp/></SafeAreaProvider>;
}

function PrivateGatherApp(){
  const insets=useSafeAreaInsets();
  const [ready,setReady]=useState(false);const [launchVisible,setLaunchVisible]=useState(false);const [authed,setAuthed]=useState(false);const [me,setMe]=useState<any>(null);const [notificationCount,setNotificationCount]=useState(0);const [messageUnread,setMessageUnread]=useState(0);const [messagePulse,setMessagePulse]=useState(0);const [rt,setRt]=useState<ReverbClient|null>(null);const [rtConfig,setRtConfig]=useState<any>(null);const [call,setCall]=useState<CallView|null>(null);const [fatal,setFatal]=useState('');const cleanupRef=useRef<(()=>void)|null>(null);const rtConfigRef=useRef<any>(null);const pendingIncomingLinkRef=useRef<any>(null);

  useEffect(()=>{
    let timer:any;
    (async()=>{
      const token=await getToken();
      let initialUrl:string|null=null;
      try{initialUrl=await Linking.getInitialURL()}catch{}
      const incoming=parseIncomingCallUrl(String(initialUrl||''));
      if(incoming){
        pendingIncomingLinkRef.current=incoming;
        setLaunchVisible(false);
      }else{
        setLaunchVisible(true);
        timer=setTimeout(()=>setLaunchVisible(false),2850);
      }
      setAuthed(!!token);
      setReady(true);
      await SplashScreen.hideAsync().catch(()=>{});
    })();
    return()=>clearTimeout(timer);
  },[]);
  useEffect(()=>{if(!authed){cleanupRef.current?.();cleanupRef.current=null;setMe(null);setRt(null);setRtConfig(null);rtConfigRef.current=null;return;}let cancelled=false;(async()=>{try{const cleanup=await boot();if(cancelled)cleanup();else cleanupRef.current=cleanup;}catch(e:any){if(!cancelled)setFatal(String(e?.message||e));}})();return()=>{cancelled=true;cleanupRef.current?.();cleanupRef.current=null;}},[authed]);

  const streamState=(state:any)=>{const detail=state.detail;setCall(prev=>{const localUrl=state.local?.toURL?.()||prev?.localUrl;const remoteUrl=state.remote?.toURL?.()||prev?.remoteUrl;return {id:Number(detail?.id||prev?.id||0),mode:(detail?.mode||prev?.mode||'voice') as 'voice'|'video',peer:String(detail?.peer?.display_name||detail?.peer?.name||prev?.peer||'Private Gather member'),status:String(state.status||detail?.status||prev?.status||'connecting'),localUrl,remoteUrl,localRevision:state.local?Number(prev?.localRevision||0)+1:prev?.localRevision,remoteRevision:state.remote?Number(state.remoteRevision||prev?.remoteRevision||0)+1:prev?.remoteRevision,photoUrl:String(detail?.peer?.call_photo_url||detail?.peer?.avatar_url||prev?.photoUrl||'')||undefined,incoming:prev?.incoming};})};
  const callEnded=()=>{stopCallRingtone().catch(()=>{});setCall(null)};
  const cancelNativeCallNotification=async(id:number)=>{
    if(Platform.OS!=='android'||!id)return;
    try{await (NativeModules as any).PrivateGatherCallAccess?.cancelIncomingCallNotification?.(id)}catch{}
  };

  async function showIncoming(payload:any){
    const foreground=AppState.currentState==='active';const normalized=await callManager.incoming(payload,false);if(!normalized)return;const id=Number(normalized.call_id||0);if(!id)return;
    let detail:any=null;try{detail=(await get(`/calls/${id}`)).data;}catch{}
    if(detail&&String(detail.status||'')!=='ringing'){callManager.ignoreCall(id);return;}
    const mode=(detail?.mode||normalized.mode)==='video'?'video':'voice';
    const peer=String(detail?.peer?.display_name||normalized.caller_name||'Private Gather member');
    const photoUrl=String(detail?.peer?.call_photo_url||detail?.peer?.avatar_url||normalized.caller_photo_url||normalized.caller_avatar||'')||undefined;
    setCall(prev=>prev?.id&&prev.id!==id?prev:{id,mode,peer,status:'incoming',photoUrl,incoming:true});
    if(foreground){await cancelNativeCallNotification(id);await startCallRingtone().catch(()=>false);}
    if(mode==='video'){
      try{
        const preview=await callManager.prepareIncomingPreview(id,detail||normalized);
        const localUrl=preview.local?.toURL?.();
        if(localUrl)setCall(prev=>prev&&prev.id===id?{...prev,localUrl}:prev);
      }catch(e){console.warn('Private Gather pre-answer camera preview unavailable',String((e as any)?.message||e));}
    }
  }

  function parseIncomingCallUrl(url:string){
    if(!String(url||'').startsWith('privategather://incoming-call'))return null;
    const query=String(url).split('?')[1]||'';
    const values:any={};
    for(const part of query.split('&')){
      if(!part)continue;const [k,v='']=part.split('=');values[decodeURIComponent(k)]=decodeURIComponent(v.replace(/\+/g,' '));
    }
    const id=Number(values.call_id||0);if(!id)return null;
    return {type:'incoming_call',call_id:id,mode:values.mode==='video'?'video':'voice',caller_name:values.caller_name||'Private Gather member',caller_id:Number(values.caller_id||0)||undefined,action:String(values.action||'')};
  }

  useEffect(()=>{
    const stage=(url:string|null)=>{if(!url)return;const payload:any=parseIncomingCallUrl(url);if(!payload)return;pendingIncomingLinkRef.current=payload;if(authed){
      if(payload.action==='decline'){callManager.ignoreCall(Number(payload.call_id));post(`/calls/${Number(payload.call_id)}/decline`,{}).catch(()=>{});setCall(null);return;}
      showIncoming(payload).then(()=>{if(payload.action==='answer')setTimeout(()=>answerIncomingId(Number(payload.call_id)),100)}).catch(()=>{});
    }};
    Linking.getInitialURL().then(stage).catch(()=>{});
    const sub=Linking.addEventListener('url',e=>stage(e.url));
    return()=>sub.remove();
  },[authed]);

  async function refreshCounts(){try{const h=await get('/home');setNotificationCount(Number(h.data?.counts?.notifications||0));setMessageUnread(Number(h.data?.counts?.messages||0));}catch{}}

  async function loadRealtimeConfig(){
    if(rtConfigRef.current)return rtConfigRef.current;
    try{
      const cfg=(await get('/realtime/config')).data;
      rtConfigRef.current=cfg;setRtConfig(cfg);return cfg;
    }catch{return null}
  }

  async function offerFullScreenCallAccess(){
    if(Platform.OS!=='android'||Number(Platform.Version)<34||pendingIncomingLinkRef.current)return;
    try{
      const access=(NativeModules as any).PrivateGatherCallAccess;
      const allowed=access?.canUseFullScreenIntent?await access.canUseFullScreenIntent():false;
      if(allowed)return;
      setTimeout(()=>Alert.alert(
        'Enable full-screen incoming calls',
        'Private Gather has notification access, but Android is still blocking full-screen call takeovers. Turn on Allow full screen intents for Private Gather.',
        [
          {text:'Not now',style:'cancel'},
          {text:'Open setting',onPress:async()=>{try{if(access?.openFullScreenIntentSettings)await access.openFullScreenIntentSettings();else await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_APP_USE_FULL_SCREEN_INTENT,{data:'package:com.privoralabs.privategather'});}catch(e){console.warn('Private Gather full-screen call settings unavailable',String((e as any)?.message||e));}}},
        ]
      ),650);
    }catch(e){console.warn('Private Gather full-screen call access check failed',String((e as any)?.message||e));}
  }

  async function boot(){
    setFatal('');

    let cfg:any=rtConfigRef.current;
    loadRealtimeConfig().then(value=>{if(value)cfg=value}).catch(()=>{});

    callManager.configure(async callId=>{
      try{
        await stopCallRingtone();
        setCall(prev=>prev&&prev.id===callId?{...prev,status:'answering'}:{id:callId,mode:'voice',peer:'Private Gather member',status:'answering',incoming:true});
        await callManager.answer();
        setCall(prev=>prev?{...prev,status:'connecting',incoming:false}:prev);
        const opened=await callManager.open(callId,rtConfigRef.current,streamState,callEnded);
        setCall(prev=>prev?{...prev,mode:opened.detail?.mode||prev.mode,peer:opened.detail?.peer?.display_name||prev.peer,status:'active',incoming:false}:prev);
      }catch(e:any){
        setFatal(String(e?.message||e));
        await callManager.end().catch(()=>{});
        setCall(null);
      }
    },()=>{callManager.end().catch(()=>{})}).catch(()=>{});

    const stopIncomingPoll=callManager.watchIncoming((payload:any)=>showIncoming(payload).catch(()=>{}),1200);

    const launchedForIncomingCall=!!pendingIncomingLinkRef.current;
    if(pendingIncomingLinkRef.current){
      const pending:any=pendingIncomingLinkRef.current;pendingIncomingLinkRef.current=null;
      if(pending.action==='decline'){
        callManager.ignoreCall(Number(pending.call_id));post(`/calls/${Number(pending.call_id)}/decline`,{}).catch(()=>{});setCall(null);
      }else{
        showIncoming(pending).then(()=>{if(pending.action==='answer')setTimeout(()=>answerIncomingId(Number(pending.call_id)),100)}).catch(()=>{});
      }
    }

    registerDevice().catch(e=>console.warn('Private Gather device registration deferred',String(e?.message||e)));
    registerBackgroundNotificationTask().catch(()=>{});
    const stopUpdates=startControlledUpdateLoop();
    const stopVoip=initializeVoipPush((payload:any)=>showIncoming(payload).catch(()=>{}));

    const self=(await get('/me')).data;setMe(self);
    if(!launchedForIncomingCall)offerFullScreenCallAccess().catch(()=>{});
    refreshCounts().catch(()=>{});

    let client:ReverbClient|null=null;
    let unsub=()=>{};
    const currentCfg=rtConfigRef.current||cfg;
    if(currentCfg){
      try{
        client=new ReverbClient(currentCfg);client.connect();setRt(client);
        unsub=client.subscribe(currentCfg.user_channel,(e:any)=>{
          if(e.kind==='incoming.call'){showIncoming(e.payload||{}).catch(()=>{});return;}
          if(e.kind==='native.update.available'){checkForControlledUpdate().catch(()=>{});return;}
          if(String(e.kind||'').startsWith('message.')||e.kind==='messages.read'||e.kind==='reaction.changed'){setMessagePulse(v=>v+1);if(e.kind==='message.created'&&!e.payload?.message?.mine)setMessageUnread(v=>v+1);}
          if(['notification.created','connection.requested','reaction.changed','message.created','event.updated'].includes(String(e.kind||'')))setNotificationCount(v=>v+1);
        });
      }catch(e){console.warn('Private Gather realtime fast path unavailable; polling remains active.',String((e as any)?.message||e));client=null;setRt(null);}
    }

    const received=Notifications.addNotificationReceivedListener(n=>{const d:any=n.request.content.data||{};if(d.type==='incoming_call')showIncoming(d).catch(()=>{});else if(d.type==='native_update_available')checkForControlledUpdate().catch(()=>{});else setNotificationCount(v=>v+1)});
    const handleNotificationResponse=async(r:any)=>{
      const d:any=r?.notification?.request?.content?.data||{};
      if(d.type==='incoming_call'&&d.call_id){
        const id=Number(d.call_id);
        if(r.actionIdentifier===PRIVATE_GATHER_CALL_DECLINE){
          callManager.ignoreCall(id);
          await post(`/calls/${id}/decline`,{}).catch(()=>{});
          await stopCallRingtone().catch(()=>{});
          setCall(null);return;
        }
        await showIncoming(d);
        if(r.actionIdentifier===PRIVATE_GATHER_CALL_ANSWER)setTimeout(()=>{answerIncoming().catch(()=>{})},60);
        return;
      }
      if(d.type==='native_update_available'){checkForControlledUpdate().catch(()=>{});return;}
      if(navRef.isReady())navRef.navigate('Notifications');
    };
    const tapped=Notifications.addNotificationResponseReceivedListener(r=>{handleNotificationResponse(r).catch(()=>{})});
    try{const last=Notifications.getLastNotificationResponse();if(last)handleNotificationResponse(last).catch(()=>{});}catch{}

    const heartbeat=()=>post('/presence/heartbeat',{state:AppState.currentState==='active'?'active':'background'}).catch(()=>{});
    heartbeat();const presenceTimer=setInterval(heartbeat,45000);
    const appState=AppState.addEventListener('change',state=>{heartbeat();if(state==='active'){refreshCounts();setMessagePulse(v=>v+1)}});

    return()=>{stopIncomingPoll();stopVoip();stopUpdates();unsub();received.remove();tapped.remove();clearInterval(presenceTimer);appState.remove();client?.close();setRt(null)};
  }

  async function signIn(email:string,password:string){const r=await login(email,password);await setToken(r.token);setMe(r.user);setAuthed(true)}
  const setUnread=useCallback((n:number)=>setMessageUnread(n),[]);
  async function startMessage(member:Member){await openMessenger({userId:Number(member.id)});}
  async function startCall(peer:any,mode:'voice'|'video'){
    await openMessenger({
      userId:Number(peer?.member_id||peer?.user_id||peer?.id||0)||undefined,
      conversationId:Number(peer?.conversation_id||0)||undefined,
      callMode:mode,
    });
  }

  async function answerIncomingId(callId:number){
    if(!callId)return;
    try{
      await stopCallRingtone();
      setCall(prev=>prev?{...prev,id:callId,status:'answering'}:{id:callId,mode:'voice',peer:'Private Gather member',status:'answering',incoming:true});
      await callManager.answer();
      setCall(prev=>prev?{...prev,status:'connecting',incoming:false}:prev);
      const opened=await callManager.open(callId,rtConfigRef.current,streamState,callEnded);
      setCall(prev=>prev?{...prev,mode:opened.detail?.mode||prev.mode,peer:opened.detail?.peer?.display_name||prev.peer,status:'active',incoming:false}:prev);
    }catch(e:any){setFatal(String(e?.message||e));await callManager.end().catch(()=>{});setCall(null);}
  }
  async function answerIncoming(){if(call?.id)await answerIncomingId(call.id)}

  async function declineIncoming(){try{await stopCallRingtone();await callManager.decline();}finally{setCall(null)}}
  function handleNotificationTarget(t:NonNullable<NotificationCard['target']>){if(!navRef.isReady())return;if(t.type==='conversation')navRef.navigate('Conversation',{id:t.id});else if(t.type==='event')navRef.navigate('Event',{id:t.id});else navRef.navigate('Member',{id:t.id});}

  if(!ready)return <View style={s.loading}/>;
  if(launchVisible&&!call)return <LaunchScreen/>;
  if(call)return <CallScreen call={call} onEnd={()=>{const id=Number(call.id||0);if(id)callManager.ignoreCall(id);stopCallRingtone().catch(()=>{});setCall(null);callManager.end().catch(()=>{})}} onMute={()=>callManager.toggleMute()} onVideo={()=>callManager.toggleVideo()} onFlip={()=>callManager.flipCamera()} onAnswer={answerIncoming} onDecline={declineIncoming}/>;
  if(!authed)return <LoginScreen onLogin={signIn}/>;

  const go=(name:string,params?:any)=>{if(navRef.isReady())(navRef as any).navigate(name,params)};
  const mainTabs=()=> <Tabs.Navigator screenOptions={({route})=>({headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.pink,tabBarInactiveTintColor:C.faint,tabBarStyle:{height:58+Math.max(insets.bottom,10),paddingTop:6,paddingBottom:Math.max(insets.bottom,10),backgroundColor:'#050914',borderTopColor:'#203149',borderTopWidth:1},tabBarLabelStyle:{fontSize:10,fontWeight:'800'},tabBarIcon:({color,size})=>{const map:any={Home:['house.fill','home'],Discover:['safari.fill','explore'],Messages:['message.fill','chat_bubble'],Events:['calendar','event'],Me:['person.fill','person']};const pair=map[route.name]||['circle','circle'];return <NativeIcon ios={pair[0]} android={pair[1]} size={Math.min(size,24)} color={color}/>;},tabBarBadge:route.name==='Messages'&&messageUnread>0?(messageUnread>99?'99+':messageUnread):undefined,tabBarBadgeStyle:{backgroundColor:C.pink,color:'#fff',fontSize:9,fontWeight:'900'}})}>
    <Tabs.Screen name="Home">{()=> <HomeScreen me={me} notificationCount={notificationCount} onNotifications={()=>go('Notifications')} onMember={id=>go('Member',{id})} onEvent={id=>go('Event',{id})} onDiscover={()=>go('MainTabs',{screen:'Discover'})} onEvents={()=>go('MainTabs',{screen:'Events'})} onMessages={()=>go('MainTabs',{screen:'Messages'})} onVerify={()=>go('Verification')}/>}</Tabs.Screen>
    <Tabs.Screen name="Discover">{()=> <DiscoverScreen notificationCount={notificationCount} onNotifications={()=>go('Notifications')} onMember={id=>go('Member',{id})}/>}</Tabs.Screen>
    <Tabs.Screen name="Messages">{()=> <MessengerBridgeScreen/>}</Tabs.Screen>
    <Tabs.Screen name="Events">{()=> <EventsScreen notificationCount={notificationCount} onNotifications={()=>go('Notifications')} onEvent={id=>go('Event',{id})}/>}</Tabs.Screen>
    <Tabs.Screen name="Me">{()=> <ProfileScreen me={me} notificationCount={notificationCount} onNotifications={()=>go('Notifications')} onClubs={()=>go('Clubs')} onLogout={()=>{setAuthed(false)}} onMember={id=>go('Member',{id})}/>}</Tabs.Screen>
  </Tabs.Navigator>;

  return <SafeAreaView style={s.shell} edges={['top','left','right']}><StatusBar barStyle="light-content" backgroundColor={C.bg}/>{fatal?<View style={s.alert}><Text numberOfLines={2} style={s.alertText}>{fatal}</Text></View>:null}<NavigationContainer ref={navRef} theme={navTheme}><Stack.Navigator screenOptions={{headerShown:false,animation:'slide_from_right',contentStyle:{backgroundColor:C.bg}}}><Stack.Screen name="MainTabs">{()=>mainTabs()}</Stack.Screen><Stack.Screen name="Verification">{()=> <VerificationScreen onBack={()=>navRef.goBack()}/>}</Stack.Screen><Stack.Screen name="Notifications">{()=> <NotificationsScreen onBack={()=>navRef.goBack()} onTarget={handleNotificationTarget} onCount={setNotificationCount}/>}</Stack.Screen><Stack.Screen name="Clubs">{()=> <ClubsScreen onBack={()=>navRef.goBack()} onClub={slug=>go('Club',{slug})}/>}</Stack.Screen><Stack.Screen name="Member">{({route}:any)=> <MemberProfileScreen memberId={Number(route.params.id)} onBack={()=>navRef.goBack()} onMessage={startMessage} onCall={startCall}/>}</Stack.Screen><Stack.Screen name="Event">{({route}:any)=> <EventDetailScreen eventId={Number(route.params.id)} onBack={()=>navRef.goBack()} onClub={slug=>go('Club',{slug})}/>}</Stack.Screen><Stack.Screen name="Club">{({route}:any)=> <ClubDetailScreen slug={String(route.params.slug)} onBack={()=>navRef.goBack()} onEvent={id=>go('Event',{id})}/>}</Stack.Screen></Stack.Navigator></NavigationContainer></SafeAreaView>;
}

const s=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.bg},shell:{flex:1,backgroundColor:C.bg},alert:{position:'absolute',left:14,right:14,top:8,zIndex:1000,paddingHorizontal:12,paddingVertical:8,borderRadius:12,backgroundColor:'#35171a',borderWidth:1,borderColor:'#72333a'},alertText:{color:'#ffb4ba',fontSize:10,fontWeight:'700'}});
