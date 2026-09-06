import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from 'react-native';
import {get} from '../api/client';
import {EventCard as EventType} from '../app/types';
import {C} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import EventCard from '../components/EventCard';
import NativeIcon from '../components/NativeIcon';

const tabs=['Upcoming','This week','Going'] as const;
export default function EventsScreen({notificationCount,onNotifications,onEvent}:{notificationCount:number;onNotifications:()=>void;onEvent:(id:number)=>void}){
 const [items,setItems]=useState<EventType[]>([]);const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState('');const [tab,setTab]=useState<typeof tabs[number]>('Upcoming');
 const load=useCallback(async()=>{try{setError('');setLoading(true);const r=await get('/events');setItems(Array.isArray(r.data)?r.data:[]);}catch(e:any){setError(String(e?.message||e));}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false)};
 const visible=useMemo(()=>{const now=Date.now();if(tab==='This week'){const end=now+7*86400000;return items.filter(e=>{const t=e.starts_at?Date.parse(e.starts_at):NaN;return Number.isFinite(t)&&t>=now&&t<=end})}if(tab==='Going')return items.filter(e=>['going','attending','yes','approved'].includes(String(e.rsvp_status||'').toLowerCase()));return items.filter(e=>{const t=e.ends_at?Date.parse(e.ends_at):e.starts_at?Date.parse(e.starts_at):NaN;return !Number.isFinite(t)||t>=now})},[items,tab]);
 const going=items.filter(e=>['going','attending','yes','approved'].includes(String(e.rsvp_status||'').toLowerCase())).length;
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}> 
   <ScreenHeader title="Events" subtitle="Your social calendar" onNotifications={onNotifications} notificationCount={notificationCount}/>
   <View style={s.summary}><View><Text style={s.summaryValue}>{items.length}</Text><Text style={s.summaryLabel}>Visible events</Text></View><View style={s.divider}/><View><Text style={[s.summaryValue,{color:C.green}]}>{going}</Text><Text style={s.summaryLabel}>Going</Text></View></View>
   <View style={s.tabs}>{tabs.map(t=><Pressable key={t} onPress={()=>setTab(t)} style={[s.tab,t===tab&&s.tabOn]}>{t==='Going'?<NativeIcon ios="checkmark.circle.fill" android="event_available" size={15} color={t===tab?C.white:C.green}/>:null}<Text style={[s.tabText,t===tab&&s.tabTextOn]}>{t}</Text></Pressable>)}</View>
   {error?<Text style={s.error}>{error}</Text>:null}
   {loading?<ActivityIndicator color={C.pink} style={{marginTop:50}}/>:visible.map(e=><EventCard key={e.id} event={e} onPress={()=>onEvent(e.id)}/>)}
   {!loading&&!visible.length?<View style={s.emptyWrap}><NativeIcon ios="calendar.badge.exclamationmark" android="event_busy" size={38} color={C.faint}/><Text style={s.empty}>{tab==='Going'?'You do not have any events marked Going in this list yet.':tab==='This week'?'No visible events start in the next seven days.':'No upcoming gatherings are visible right now.'}</Text></View>:null}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingBottom:28},summary:{height:72,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:8},summaryValue:{color:C.text,fontSize:20,fontWeight:'900',textAlign:'center'},summaryLabel:{color:C.muted,fontSize:9,marginTop:2},divider:{width:1,height:38,backgroundColor:C.line},tabs:{height:44,borderRadius:16,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,flexDirection:'row',padding:4,marginTop:10,marginBottom:12},tab:{flex:1,borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:5},tabOn:{backgroundColor:C.violet},tabText:{color:C.muted,fontWeight:'800',fontSize:10},tabTextOn:{color:C.white},error:{color:'#ff8d8d',marginBottom:8},emptyWrap:{alignItems:'center',paddingTop:50,paddingHorizontal:26},empty:{color:C.muted,textAlign:'center',marginTop:10,fontSize:10.5,lineHeight:16}});