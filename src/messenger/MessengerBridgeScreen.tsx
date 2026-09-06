import React,{useEffect,useRef} from 'react';
import {AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {openMessenger} from './MessengerBridge';
import {C} from '../theme';
import BrandLogo from '../components/BrandLogo';
import NativeIcon from '../components/NativeIcon';

export default function MessengerBridgeScreen(){
  const opened=useRef(false);const handoffArmed=useRef(false);const sawBackground=useRef(false);const navigation=useNavigation<any>();
  const launch=async()=>{const ok=await openMessenger();if(ok){handoffArmed.current=true;sawBackground.current=false}};
  useEffect(()=>{
    if(!opened.current){opened.current=true;launch().catch(()=>{})}
    const sub=AppState.addEventListener('change',state=>{
      if(!handoffArmed.current)return;
      if(state!=='active'){sawBackground.current=true;return}
      if(sawBackground.current){handoffArmed.current=false;sawBackground.current=false;setTimeout(()=>navigation.navigate('Home'),0)}
    });
    return()=>sub.remove();
  },[navigation]);
  return <SafeAreaView style={s.page}><View style={s.wrap}><BrandLogo/><NativeIcon ios="message.fill" android="chat_bubble" size={54} color={C.violet}/><Text style={s.title}>Messages now live in Private Gather Messenger</Text><Text style={s.copy}>The dedicated native Messenger handles conversations, realtime delivery, media, voice and video calls.</Text><Pressable onPress={()=>launch().catch(()=>{})} style={s.button}><Text style={s.buttonText}>Open Messenger</Text></Pressable></View></SafeAreaView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},wrap:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,gap:16},title:{color:C.text,fontSize:21,fontWeight:'900',textAlign:'center'},copy:{color:C.muted,fontSize:12,lineHeight:18,textAlign:'center'},button:{height:50,minWidth:190,paddingHorizontal:24,borderRadius:17,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',marginTop:4},buttonText:{color:'#fff',fontWeight:'900'}});
