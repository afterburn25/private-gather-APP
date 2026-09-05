import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from 'react-native';
import {get} from '../api/client';
import {EventCard as EventType} from '../app/types';
import {C} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import EventCard from '../components/EventCard';

const tabs=['Nearby','This week','All'] as const;
export default function EventsScreen({notificationCount,onNotifications,onEvent}:{notificationCount:number;onNotifications:()=>void;onEvent:(id:number)=>void}){
 const [items,setItems]=useState<EventType[]>([]);const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState('');const [tab,setTab]=useState<typeof tabs[number]>('Nearby');
 const load=useCallback(async()=>{try{setError('');setLoading(true);const r=await get('/events');setItems(r.data||[]);}catch(e:any){setError(String(e?.message||e));}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false)};
 const visible=useMemo(()=>items,[items,tab]);
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}> 
   <ScreenHeader title="Events" subtitle="Your social calendar" onNotifications={onNotifications} notificationCount={notificationCount}/>
   <View style={s.tabs}>{tabs.map(t=><Pressable key={t} onPress={()=>setTab(t)} style={[s.tab,t===tab&&s.tabOn]}><Text style={[s.tabText,t===tab&&s.tabTextOn]}>{t}</Text></Pressable>)}</View>
   {error?<Text style={s.error}>{error}</Text>:null}
   {loading?<ActivityIndicator color={C.pink} style={{marginTop:50}}/>:visible.map(e=><EventCard key={e.id} event={e} onPress={()=>onEvent(e.id)}/>)}
   {!loading&&!visible.length&&<Text style={s.empty}>No upcoming gatherings are visible right now.</Text>}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingBottom:28},tabs:{height:44,borderRadius:16,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,flexDirection:'row',padding:4,marginTop:8,marginBottom:12},tab:{flex:1,borderRadius:12,alignItems:'center',justifyContent:'center'},tabOn:{backgroundColor:'rgba(255,53,211,.12)',borderWidth:1,borderColor:'rgba(255,53,211,.28)'},tabText:{color:C.muted,fontWeight:'800',fontSize:10},tabTextOn:{color:C.pink},error:{color:'#ff8d8d',marginBottom:8},empty:{color:C.muted,textAlign:'center',marginTop:50}});
