import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {get} from '../api/client';
import NativeIcon from '../components/NativeIcon';
import {C} from '../theme';

export default function VerificationScreen({onBack}:{onBack:()=>void}){
  const [url,setUrl]=useState('');const [error,setError]=useState('');const web=useRef<WebView>(null);
  const load=async()=>{try{setError('');setUrl('');const r=await get('/verification/launch');const next=String(r?.url||'');if(!next)throw new Error('Verification page is unavailable.');setUrl(next);}catch(e:any){setError(String(e?.message||e))}};
  useEffect(()=>{load()},[]);
  return <View style={s.page}>
    <View style={s.header}><Pressable onPress={onBack} style={s.back}><NativeIcon ios="chevron.left" android="arrow_back" size={21} color={C.text}/></Pressable><View style={{flex:1}}><Text style={s.title}>Verification</Text><Text style={s.sub}>Private Gather identity & age verification</Text></View></View>
    {error?<View style={s.center}><Text style={s.error}>{error}</Text><Pressable onPress={load} style={s.retry}><Text style={s.retryText}>Try again</Text></Pressable></View>:null}
    {!error&&!url?<View style={s.center}><ActivityIndicator color={C.pink}/><Text style={s.loading}>Opening your secure verification page…</Text></View>:null}
    {!!url?<WebView ref={web} style={s.web} source={{uri:url}} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled setSupportMultipleWindows={false} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} startInLoadingState renderLoading={()=><View style={s.webLoading}><ActivityIndicator color={C.pink}/></View>}/>:null}
  </View>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},header:{minHeight:64,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:C.panel},back:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:C.panel2},title:{color:C.text,fontSize:16,fontWeight:'900'},sub:{color:C.muted,fontSize:9,marginTop:2},web:{flex:1,backgroundColor:'#fff'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24,gap:12},error:{color:'#ff9aa8',fontSize:12,textAlign:'center'},retry:{paddingHorizontal:18,paddingVertical:10,borderRadius:16,backgroundColor:C.pink},retryText:{color:'#fff',fontWeight:'900',fontSize:10},loading:{color:C.muted,fontSize:10},webLoading:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',backgroundColor:C.bg}});