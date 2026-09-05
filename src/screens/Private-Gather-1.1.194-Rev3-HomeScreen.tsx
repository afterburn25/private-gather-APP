import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,FlatList,Linking,Pressable,RefreshControl,StyleSheet,Text,TextInput,View} from 'react-native';
import {get,post} from '../api/client';
import {C} from '../theme';
import BrandLogo from '../components/BrandLogo';
import NativeIcon from '../components/NativeIcon';
import ProtectedImage from '../components/ProtectedImage';

type FeedPhoto={id:number;url:string;nude?:boolean;locked?:boolean;verification_url?:string|null};
type FeedPost={
 id:number;body?:string|null;created:string;mine?:boolean;
 author:{id:number;display_name:string;username:string;avatar_url?:string;verified?:boolean};
 speaker_name?:string;photos?:FeedPhoto[];reaction_count?:number;comment_count?:number;
};

export default function HomeScreen({me,notificationCount,onNotifications,onMember,onMessages}:{me:any;notificationCount:number;onNotifications:()=>void;onMember:(id:number)=>void;onEvent:(id:number)=>void;onDiscover:()=>void;onEvents:()=>void;onMessages:()=>void}){
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [refreshing,setRefreshing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [draft,setDraft]=useState('');
 const [sending,setSending]=useState(false);

 const load=useCallback(async()=>{try{setError('');const r=await get('/feed');setPosts(Array.isArray(r.data)?r.data:[]);}catch(e:any){setError(String(e?.message||e));}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false)};
 const submit=async()=>{const body=draft.trim();if(!body||sending)return;try{setSending(true);setError('');await post('/feed',{body});setDraft('');await load();}catch(e:any){setError(String(e?.message||e));}finally{setSending(false)}};

 const header=<>
   <View style={s.topbar}>
     <BrandLogo compact/>
     <View style={{flex:1}}/>
     <Pressable accessibilityLabel="Messages" style={s.iconButton} onPress={onMessages}><NativeIcon ios="message.fill" android="chat_bubble" size={20} color={C.cyan2}/></Pressable>
     <Pressable accessibilityLabel="Notifications" style={s.iconButton} onPress={onNotifications}><NativeIcon ios="bell.fill" android="notifications" size={20} color={C.cyan2}/>{notificationCount>0&&<View style={s.badge}><Text style={s.badgeText}>{notificationCount>99?'99+':notificationCount}</Text></View>}</Pressable>
   </View>
   <View style={s.wallTitleRow}><View><Text style={s.wallTitle}>Community</Text><Text style={s.wallSub}>Public wall</Text></View></View>
   <View style={s.composer}>
     <ProtectedImage uri={me?.avatar_url} fallback={me?.display_name||'PG'} style={s.meAvatar}/>
     <TextInput value={draft} onChangeText={setDraft} multiline maxLength={3000} placeholder="Share something with the community…" placeholderTextColor={C.faint} style={s.input}/>
     <Pressable disabled={!draft.trim()||sending} onPress={submit} style={[s.postButton,(!draft.trim()||sending)&&{opacity:.4}]}><NativeIcon ios="arrow.up" android="arrow_upward" size={20} color="#fff"/></Pressable>
   </View>
   {error?<Text style={s.error}>{error}</Text>:null}
 </>;

 if(loading)return <View style={s.page}>{header}<ActivityIndicator color={C.pink} style={{marginTop:70}}/></View>;
 return <FlatList
   style={s.page}
   contentContainerStyle={s.content}
   data={posts}
   keyExtractor={x=>String(x.id)}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}
   ListHeaderComponent={header}
   ListEmptyComponent={<View style={s.empty}><NativeIcon ios="bubble.left.and.bubble.right.fill" android="forum" size={28} color={C.cyan2}/><Text style={s.emptyTitle}>The wall is quiet</Text><Text style={s.emptySub}>Be the first to start a conversation.</Text></View>}
   renderItem={({item})=><PostCard post={item} onMember={onMember}/>}
 />;
}

function FeedPhotoView({photo,style}:{photo:FeedPhoto;style:any}){
 const verify=()=>{if(photo.verification_url)Linking.openURL(photo.verification_url).catch(()=>{});};
 return <View style={[style,s.mediaWrap]}>
   <ProtectedImage uri={photo.url} fallback="18+" style={StyleSheet.absoluteFillObject as any}/>
   {photo.locked?<View style={s.verifyOverlay}>
     <NativeIcon ios="lock.shield.fill" android="verified_user" size={24} color={C.gold}/>
     <Text style={s.verifyTitle}>18+ verified content</Text>
     <Text style={s.verifyCopy}>Complete identity and age verification to reveal this photo.</Text>
     <Pressable onPress={verify} style={s.verifyButton}><Text style={s.verifyButtonText}>Verify to view</Text></Pressable>
   </View>:null}
 </View>;
}

function PostCard({post,onMember}:{post:FeedPost;onMember:(id:number)=>void}){
 const photos=post.photos||[];
 return <View style={s.card}>
   <Pressable onPress={()=>onMember(post.author.id)} style={s.authorRow}>
     <ProtectedImage uri={post.author.avatar_url} fallback={post.author.display_name} style={s.avatar}/>
     <View style={{flex:1}}><View style={s.nameRow}><Text numberOfLines={1} style={s.name}>{post.speaker_name||post.author.display_name}</Text>{post.author.verified?<NativeIcon ios="checkmark.seal.fill" android="verified" size={15} color={C.green}/>:null}</View><Text style={s.meta}>@{post.author.username} · {post.created}</Text></View>
     <NativeIcon ios="ellipsis" android="more_horiz" size={22} color={C.faint}/>
   </Pressable>
   {post.body?<Text style={s.body}>{post.body}</Text>:null}
   {photos.length===1?<FeedPhotoView photo={photos[0]} style={s.photo}/>:null}
   {photos.length>1?<View style={s.photoGrid}>{photos.slice(0,4).map(p=><FeedPhotoView key={p.id} photo={p} style={s.gridPhoto}/>)}</View>:null}
   <View style={s.actions}>
     <View style={s.action}><NativeIcon ios="heart" android="favorite_border" size={20} color={C.muted}/><Text style={s.actionText}>{post.reaction_count||0}</Text></View>
     <View style={s.action}><NativeIcon ios="bubble.left" android="chat_bubble_outline" size={19} color={C.muted}/><Text style={s.actionText}>{post.comment_count||0}</Text></View>
     <View style={{flex:1}}/>
     <NativeIcon ios="square.and.arrow.up" android="ios_share" size={19} color={C.muted}/>
   </View>
 </View>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:12,paddingBottom:18},
 topbar:{minHeight:58,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:4},
 iconButton:{width:40,height:40,borderRadius:20,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},
 badge:{position:'absolute',right:-3,top:-4,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontSize:9,fontWeight:'900'},
 wallTitleRow:{paddingTop:2,paddingBottom:8},wallTitle:{color:C.text,fontSize:22,fontWeight:'900'},wallSub:{color:C.muted,fontSize:10,marginTop:2},
 composer:{flexDirection:'row',alignItems:'flex-end',gap:8,padding:10,borderRadius:18,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,marginBottom:12},
 meAvatar:{width:38,height:38,borderRadius:12},input:{flex:1,minHeight:38,maxHeight:92,color:C.text,backgroundColor:C.panel2,borderRadius:16,paddingHorizontal:12,paddingVertical:9,fontSize:13},
 postButton:{width:38,height:38,borderRadius:19,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},
 error:{color:'#ff9aa8',fontSize:10,paddingHorizontal:4,paddingBottom:8},
 card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:20,marginBottom:10,overflow:'hidden'},
 authorRow:{flexDirection:'row',alignItems:'center',gap:10,padding:12},avatar:{width:44,height:44,borderRadius:14},nameRow:{flexDirection:'row',alignItems:'center',gap:6},name:{color:C.text,fontSize:14,fontWeight:'900',maxWidth:'88%'},meta:{color:C.muted,fontSize:9,marginTop:3},
 body:{color:C.text,fontSize:14,lineHeight:20,paddingHorizontal:12,paddingBottom:12},
 photo:{width:'100%',height:340,backgroundColor:C.panel2},photoGrid:{flexDirection:'row',flexWrap:'wrap'},gridPhoto:{width:'50%',height:190,backgroundColor:C.panel2},
 mediaWrap:{overflow:'hidden'},verifyOverlay:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',padding:18,backgroundColor:'rgba(4,7,13,.38)'},verifyTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:8},verifyCopy:{color:'#e2e7ee',fontSize:10,lineHeight:14,textAlign:'center',maxWidth:260,marginTop:5},verifyButton:{marginTop:11,paddingHorizontal:15,paddingVertical:9,borderRadius:15,backgroundColor:C.pink,borderWidth:1,borderColor:'#ff78df'},verifyButtonText:{color:'#fff',fontSize:10,fontWeight:'900'},

 actions:{height:50,flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:18,borderTopWidth:1,borderTopColor:C.line},action:{flexDirection:'row',alignItems:'center',gap:5},actionText:{color:C.muted,fontSize:10,fontWeight:'700'},
 empty:{alignItems:'center',paddingTop:70},emptyTitle:{color:C.text,fontSize:16,fontWeight:'900',marginTop:12},emptySub:{color:C.muted,fontSize:11,marginTop:5}
});
