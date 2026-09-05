import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {get} from '../api/client';
import {Member} from '../app/types';
import {C} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import MemberCard from '../components/MemberCard';
import NativeIcon from '../components/NativeIcon';

export default function DiscoverScreen({notificationCount,onNotifications,onMember}:{notificationCount:number;onNotifications:()=>void;onMember:(id:number)=>void}){
 const [items,setItems]=useState<Member[]>([]);const [q,setQ]=useState('');const [verified,setVerified]=useState(false);const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState('');
 const load=useCallback(async(search=q)=>{try{setError('');setLoading(true);const path=search.trim()?`/members/search?q=${encodeURIComponent(search.trim())}&verified=${verified?1:0}&limit=60`:`/recommendations?limit=40`;const r=await get(path);setItems(r.data||[]);}catch(e:any){setError(String(e?.message||e));}finally{setLoading(false)}},[q,verified]);
 useEffect(()=>{const t=setTimeout(()=>load(q),q?350:0);return()=>clearTimeout(t)},[q,verified]);
 const refresh=async()=>{setRefreshing(true);await load(q);setRefreshing(false)};
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}> 
   <ScreenHeader title="Discover" subtitle="Find people you'd actually like to meet" onNotifications={onNotifications} notificationCount={notificationCount}/>
   <View style={s.search}><NativeIcon ios="magnifyingglass" android="search" size={21} color={C.faint}/><TextInput value={q} onChangeText={setQ} placeholder="Search members" placeholderTextColor={C.faint} style={s.input}/><Pressable accessibilityLabel="Verified only" onPress={()=>setVerified(v=>!v)} style={[s.filterButton,verified&&s.filterOn]}><NativeIcon ios={verified?'checkmark.seal.fill':'line.3.horizontal.decrease.circle'} android={verified?'verified':'filter_list'} size={20} color={verified?C.pink:C.cyan2}/></Pressable></View>
   {verified?<Text style={s.filterNote}>Showing verified members only</Text>:null}
   {error?<Text style={s.error}>{error}</Text>:null}
   {loading?<ActivityIndicator color={C.pink} style={{marginTop:50}}/>:<View style={s.grid}>{items.map(m=><MemberCard key={m.id} member={m} onPress={()=>onMember(m.id)}/>)}</View>}
   {!loading&&items.length===0&&<Text style={s.empty}>No members matched this search.</Text>}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingBottom:28},search:{height:50,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center',paddingLeft:14,marginTop:8,gap:9},input:{flex:1,color:C.text,fontSize:14},filterButton:{width:48,height:48,alignItems:'center',justifyContent:'center',borderLeftWidth:1,borderLeftColor:C.line},filterOn:{backgroundColor:'rgba(255,53,211,.08)'},filterNote:{color:C.pink,fontSize:9.5,fontWeight:'800',marginTop:8,marginLeft:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between',marginTop:13},error:{color:'#ff8d8d',marginTop:8},empty:{color:C.muted,textAlign:'center',marginTop:50}});
