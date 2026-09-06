import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {get} from '../api/client';
import {Member} from '../app/types';
import {C} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import MemberCard from '../components/MemberCard';
import NativeIcon from '../components/NativeIcon';

type Mode='for_you'|'online'|'new'|'verified'|'tonight';
const modes:{key:Mode;label:string;ios:string;android:string}[]=[
 {key:'for_you',label:'For You',ios:'sparkles',android:'auto_awesome'},
 {key:'online',label:'Online',ios:'circle.fill',android:'wifi_tethering'},
 {key:'new',label:'New',ios:'person.badge.plus',android:'person_add'},
 {key:'verified',label:'Verified',ios:'checkmark.seal.fill',android:'verified'},
 {key:'tonight',label:'Tonight',ios:'moon.stars.fill',android:'nightlife'},
];
export default function DiscoverScreen({notificationCount,onNotifications,onMember}:{notificationCount:number;onNotifications:()=>void;onMember:(id:number)=>void}){
 const [items,setItems]=useState<Member[]>([]);const [q,setQ]=useState('');const [mode,setMode]=useState<Mode>('for_you');const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState('');
 const load=useCallback(async(search=q,selected=mode)=>{try{setError('');setLoading(true);let path:string;if(search.trim())path=`/members/search?q=${encodeURIComponent(search.trim())}&verified=${selected==='verified'?1:0}&limit=80`;else if(selected==='tonight')path='/tonight?limit=80';else path='/recommendations?limit=80';const r=await get(path);setItems(Array.isArray(r.data)?r.data:[]);}catch(e:any){setError(String(e?.message||e));}finally{setLoading(false)}},[q,mode]);
 useEffect(()=>{const t=setTimeout(()=>load(q,mode),q?350:0);return()=>clearTimeout(t)},[q,mode,load]);
 const shown=useMemo(()=>{if(q.trim()||mode==='for_you'||mode==='tonight')return items;if(mode==='online')return items.filter(m=>m.online);if(mode==='verified')return items.filter(m=>m.verified);if(mode==='new'){const cutoff=Date.now()-30*86400000;return [...items].filter(m=>{const t=m.joined_at?Date.parse(m.joined_at):NaN;return Number.isFinite(t)&&t>=cutoff}).sort((a,b)=>Date.parse(b.joined_at||'')-Date.parse(a.joined_at||''));}return items},[items,q,mode]);
 const refresh=async()=>{setRefreshing(true);await load(q,mode);setRefreshing(false)};
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}>
   <ScreenHeader title="Discover" subtitle="Find people you'd actually like to meet" onNotifications={onNotifications} notificationCount={notificationCount}/>
   <View style={s.search}><NativeIcon ios="magnifyingglass" android="search" size={21} color={C.faint}/><TextInput value={q} onChangeText={setQ} placeholder="Search members" placeholderTextColor={C.faint} style={s.input}/>{q?<Pressable accessibilityLabel="Clear search" onPress={()=>setQ('')} style={s.clear}><NativeIcon ios="xmark.circle.fill" android="cancel" size={19} color={C.faint}/></Pressable>:null}</View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{modes.map(x=><Pressable key={x.key} onPress={()=>{setQ('');setMode(x.key)}} style={[s.chip,mode===x.key&&s.chipOn]}><NativeIcon ios={x.ios} android={x.android} size={15} color={mode===x.key?C.white:x.key==='online'?C.green:C.cyan2}/><Text style={[s.chipText,mode===x.key&&s.chipTextOn]}>{x.label}</Text></Pressable>)}</ScrollView>
   {!q&&mode==='online'?<Text style={s.filterNote}>Members online in your current recommendation set</Text>:null}
   {!q&&mode==='new'?<Text style={s.filterNote}>New members from the last 30 days in your recommendation set</Text>:null}
   {!q&&mode==='verified'?<Text style={s.filterNote}>Verified members in your current recommendation set</Text>:null}
   {!q&&mode==='tonight'?<Text style={s.filterNote}>Members available through Private Gather Tonight</Text>:null}
   {error?<Text style={s.error}>{error}</Text>:null}
   {loading?<ActivityIndicator color={C.pink} style={{marginTop:50}}/>:<View style={s.grid}>{shown.map(m=><MemberCard key={m.id} member={m} onPress={()=>onMember(m.id)}/>)}</View>}
   {!loading&&shown.length===0?<View style={s.emptyWrap}><NativeIcon ios="magnifyingglass" android="search_off" size={34} color={C.faint}/><Text style={s.empty}>{q?'No members matched this search.':mode==='online'?'No recommended members are online right now.':mode==='new'?'No new recommended members are showing yet.':mode==='verified'?'No verified recommendations are showing yet.':mode==='tonight'?'Nobody is showing in Tonight right now.':'No recommendations are available yet.'}</Text></View>:null}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingBottom:28},search:{height:50,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center',paddingLeft:14,marginTop:8,gap:9},input:{flex:1,color:C.text,fontSize:14},clear:{width:44,height:48,alignItems:'center',justifyContent:'center'},filters:{gap:7,paddingVertical:11,paddingRight:10},chip:{height:37,paddingHorizontal:11,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center',gap:6},chipOn:{backgroundColor:C.violet,borderColor:C.violet},chipText:{color:C.text,fontSize:9.5,fontWeight:'800'},chipTextOn:{color:C.white},filterNote:{color:C.muted,fontSize:9.5,fontWeight:'700',marginBottom:3,marginLeft:3},grid:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between',marginTop:10},error:{color:'#ff8d8d',marginTop:8},emptyWrap:{alignItems:'center',paddingTop:55,paddingHorizontal:26},empty:{color:C.muted,textAlign:'center',marginTop:9,fontSize:10.5,lineHeight:16}});