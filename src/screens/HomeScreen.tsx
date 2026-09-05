import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,FlatList,Modal,Platform,Pressable,RefreshControl,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {get,post} from '../api/client';
import {C} from '../theme';
import BrandLogo from '../components/BrandLogo';
import NativeIcon from '../components/NativeIcon';
import ProtectedImage from '../components/ProtectedImage';
import SpeakerPicker from '../components/SpeakerPicker';

type FeedPhoto={id:number;url:string;nude?:boolean;locked?:boolean;verification_url?:string|null};
type ReactionMeta={key:string;icon:string;label:string;group:'positive'|'negative'};type PositiveReactor={id:number;name:string;username?:string;reaction?:string;icon?:string;label?:string;is_connection?:boolean};
type FeedPost={
 id:number;body?:string|null;created:string;mine?:boolean;
 author:{id:number;display_name:string;username:string;avatar_url?:string;verified?:boolean};
 speaker_name?:string;photos?:FeedPhoto[];reaction_count?:number;positive_count?:number;negative_count?:number;comment_count?:number;my_reaction?:string|null;my_reaction_icon?:string|null;my_reaction_label?:string|null;my_group?:'positive'|'negative'|null;positive_reactors?:PositiveReactor[];
};
type FeedComment={id:number;parent_comment_id?:number|null;body:string;created:string;mine?:boolean;speaker_name?:string;author:{id:number;display_name:string;username:string;avatar_url?:string}};

export default function HomeScreen({me,notificationCount,onNotifications,onMember,onMessages,onVerify}:{me:any;notificationCount:number;onNotifications:()=>void;onMember:(id:number)=>void;onEvent:(id:number)=>void;onDiscover:()=>void;onEvents:()=>void;onMessages:()=>void;onVerify:()=>void}){
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [catalog,setCatalog]=useState<ReactionMeta[]>([]);
 const [refreshing,setRefreshing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [draft,setDraft]=useState('');
 const [sending,setSending]=useState(false);
 const speakers=Array.isArray(me?.speakers)?me.speakers:[];
 const [speakerId,setSpeakerId]=useState<number|null>(null);

 useEffect(()=>{if(speakers.length&&!speakers.some((x:any)=>Number(x.id)===Number(speakerId)))setSpeakerId(Number(speakers[0].id));},[me?.id,speakers.length]);

 const load=useCallback(async()=>{
   try{
     setError('');
     const r=await get('/feed');
     setPosts(Array.isArray(r.data)?r.data:[]);
     setCatalog(Array.isArray(r.reaction_catalog)?r.reaction_catalog:[]);
   }catch(e:any){setError(String(e?.message||e))}
   finally{setLoading(false)}
 },[]);

 useEffect(()=>{load()},[load]);
 const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false)};
 const submit=async()=>{const body=draft.trim();if(!body||sending)return;try{setSending(true);setError('');await post('/feed',{body,speaker_profile_identity_id:speakerId||undefined});setDraft('');await load();}catch(e:any){setError(String(e?.message||e));}finally{setSending(false)}};

 const patchPost=(id:number,patch:Partial<FeedPost>)=>setPosts(rows=>rows.map(row=>row.id===id?{...row,...patch}:row));

 const header=<View style={s.headerWrap}>
   <View style={s.topbar}>
     <BrandLogo compact/>
     <View style={{flex:1}}/>
     <Pressable accessibilityLabel="Messages" style={s.iconButton} onPress={onMessages}><NativeIcon ios="message.fill" android="chat_bubble" size={20} color={C.cyan2}/></Pressable>
     <Pressable accessibilityLabel="Notifications" style={s.iconButton} onPress={onNotifications}><NativeIcon ios="bell.fill" android="notifications" size={20} color={C.cyan2}/>{notificationCount>0&&<View style={s.badge}><Text style={s.badgeText}>{notificationCount>99?'99+':notificationCount}</Text></View>}</Pressable>
   </View>
   <View style={s.wallTitleRow}><View><Text style={s.wallTitle}>Community</Text><Text style={s.wallSub}>Public wall</Text></View></View>
   <SpeakerPicker speakers={speakers} value={speakerId} onChange={setSpeakerId} label="Posting as"/>
   <View style={s.composer}>
     <ProtectedImage uri={me?.avatar_url} fallback={me?.display_name||'PG'} style={s.meAvatar}/>
     <TextInput value={draft} onChangeText={setDraft} multiline maxLength={3000} placeholder="Share something with the community…" placeholderTextColor={C.faint} style={s.input}/>
     <Pressable disabled={!draft.trim()||sending} onPress={submit} style={[s.postButton,(!draft.trim()||sending)&&{opacity:.4}]}><NativeIcon ios="arrow.up" android="arrow_upward" size={20} color="#fff"/></Pressable>
   </View>
   {error?<View style={s.feedError}><Text style={s.error}>Community could not refresh: {error}</Text><Pressable onPress={load} style={s.retryButton}><Text style={s.retryText}>Retry</Text></Pressable></View>:null}
 </View>;

 if(loading)return <View style={s.page}>{header}<ActivityIndicator color={C.pink} style={{marginTop:70}}/></View>;
 return <FlatList
   style={s.page}
   contentContainerStyle={s.content}
   data={posts}
   keyExtractor={x=>String(x.id)}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.pink}/>}
   ListHeaderComponent={header}
   ListEmptyComponent={<View style={s.empty}><NativeIcon ios="bubble.left.and.bubble.right.fill" android="forum" size={28} color={C.cyan2}/><Text style={s.emptyTitle}>The wall is quiet</Text><Text style={s.emptySub}>Be the first to start a conversation.</Text></View>}
   renderItem={({item})=><PostCard post={item} catalog={catalog} speakers={speakers} speakerId={speakerId} onSpeakerChange={setSpeakerId} onVerify={onVerify} onMember={onMember} onPatch={patch=>patchPost(item.id,patch)}/>} 
   initialNumToRender={4}
   maxToRenderPerBatch={4}
   updateCellsBatchingPeriod={70}
   windowSize={5}
 />;
}


function FeedPhotoView({photo,style,onVerify}:{photo:FeedPhoto;style:any;onVerify:()=>void}){
 return <View style={[style,s.mediaWrap]}>
   <ProtectedImage uri={photo.url} fallback="18+" style={StyleSheet.absoluteFill as any}/>
   {photo.locked?<View style={s.verifyOverlay}>
     <NativeIcon ios="lock.shield.fill" android="verified_user" size={24} color={C.gold}/>
     <Text style={s.verifyTitle}>18+ verified content</Text>
     <Text style={s.verifyCopy}>Complete identity and age verification to reveal this photo.</Text>
     <Pressable onPress={onVerify} style={s.verifyButton}><Text style={s.verifyButtonText}>Verify to view</Text></Pressable>
   </View>:null}
 </View>;
}

function PostCard({post,catalog,speakers,speakerId,onSpeakerChange,onVerify,onMember,onPatch}:{post:FeedPost;catalog:ReactionMeta[];speakers:any[];speakerId:number|null;onSpeakerChange:(id:number)=>void;onVerify:()=>void;onMember:(id:number)=>void;onPatch:(patch:Partial<FeedPost>)=>void}){
 const photos=post.photos||[];
 const [palette,setPalette]=useState<'positive'|'negative'|null>(null);
 const [expanded,setExpanded]=useState(false);
 const [comments,setComments]=useState<FeedComment[]>([]);
 const [commentsLoading,setCommentsLoading]=useState(false);
 const [commentDraft,setCommentDraft]=useState('');
 const [commentSending,setCommentSending]=useState(false);
 const [commentError,setCommentError]=useState('');

 const react=async(reaction='like')=>{
   try{
     const r=await postApi(`/feed/${post.id}/reaction`,{reaction});
     onPatch({
       positive_count:Number(r.positive_count||0),negative_count:Number(r.negative_count||0),reaction_count:Number(r.positive_count||0)+Number(r.negative_count||0),
       my_reaction:r.my_reaction||null,my_reaction_icon:r.my_reaction_icon||null,my_reaction_label:r.my_reaction_label||null,my_group:r.my_group||null,
       positive_reactors:Array.isArray(r.positive_reactors)?r.positive_reactors:post.positive_reactors,
     });
   }catch{}
 };

 const loadComments=async()=>{
   try{
     setCommentsLoading(true);setCommentError('');
     const r=await get(`/feed/${post.id}/comments`);
     setComments(Array.isArray(r.data)?r.data:[]);
     onPatch({comment_count:Number(r.count||0)});
   }catch(e:any){setCommentError(String(e?.message||e))}
   finally{setCommentsLoading(false)}
 };
 const toggleComments=async()=>{
   const next=!expanded;setExpanded(next);
   if(next&&comments.length===0)await loadComments();
 };
 const sendComment=async()=>{
   const body=commentDraft.trim();if(!body||commentSending)return;
   try{
     setCommentSending(true);setCommentError('');
     const r=await postApi(`/feed/${post.id}/comments`,{body,speaker_profile_identity_id:speakerId||undefined});
     setCommentDraft('');
     onPatch({comment_count:Number(r.count||Number(post.comment_count||0)+1)});
     await loadComments();
   }catch(e:any){setCommentError(String(e?.message||e))}
   finally{setCommentSending(false)}
 };

 const positive=Number(post.positive_count||0);const negative=Number(post.negative_count||0);
 const myReaction=String(post.my_reaction||'');
 const myMeta=catalog.find(x=>x.key===myReaction);
 const myGroup=(post.my_group||myMeta?.group||null) as 'positive'|'negative'|null;
 const positiveReactors=Array.isArray(post.positive_reactors)?post.positive_reactors:[];
 const previewNames=positiveReactors.slice(0,5).map(x=>x.name).filter(Boolean);
 const remainingPositive=Math.max(0,positive-previewNames.length);
 const positiveSummary=positive>0?`${previewNames.join(', ')}${remainingPositive>0?`${previewNames.length?', ':''}and ${remainingPositive} others`:''}${previewNames.length||remainingPositive?' reacted':'Reacted'}`:'';
 const commentLabel=Number(post.comment_count||0)>0?`View comments (${post.comment_count})`:'Be the first to comment';
 const openPalette=(group:'positive'|'negative')=>setPalette(group);
 const tapReaction=(group:'positive'|'negative')=>{if(myReaction){openPalette(group);return;}react(group==='positive'?'like':'dislike')};

 return <View style={s.card}>
   <View style={s.authorRow}>
     <Pressable hitSlop={10} onPress={()=>onMember(Number(post.author.id))} accessibilityLabel={`Open ${post.author.display_name} profile`}>
       <ProtectedImage uri={post.author.avatar_url} fallback={post.author.display_name} style={s.avatar}/>
     </Pressable>
     <Pressable style={{flex:1}} onPress={()=>onMember(Number(post.author.id))} accessibilityLabel={`Open ${post.author.display_name} profile`}>
       <View style={s.nameRow}><Text numberOfLines={1} style={s.name}>{post.speaker_name||post.author.display_name}</Text>{post.author.verified?<NativeIcon ios="checkmark.seal.fill" android="verified" size={15} color={C.green}/>:null}</View><Text style={s.meta}>@{post.author.username} · {post.created}</Text>
     </Pressable>
     <NativeIcon ios="ellipsis" android="more_horiz" size={22} color={C.faint}/>
   </View>

   {post.body?<Text style={s.body}>{post.body}</Text>:null}
   {photos.length===1?<FeedPhotoView photo={photos[0]} style={s.photo} onVerify={onVerify}/>:null}
   {photos.length>1?<View style={s.photoGrid}>{photos.slice(0,4).map(p=><FeedPhotoView key={p.id} photo={p} style={s.gridPhoto} onVerify={onVerify}/>)}</View>:null}

   {positive>0?<View style={s.reactedSummary}><Text style={s.reactedLabel}>Reacted</Text>{positiveSummary?<Text numberOfLines={2} style={s.reactedNames}>{positiveSummary}</Text>:null}</View>:null}
   <View style={s.actions}>
     {(!myReaction||myGroup==='positive')?<Pressable style={[s.reactionLauncher,myGroup==='positive'&&s.reactionActive]} onPress={()=>tapReaction('positive')} onLongPress={()=>openPalette('positive')} delayLongPress={430} accessibilityLabel={myGroup==='positive'?`${post.my_reaction_label||'Reaction'} reaction. Tap to change.`:'Like. Tap to react, hold for more.'}>
       {myGroup==='positive'&&myReaction!=='like'&&post.my_reaction_icon?<Text style={s.launcherEmoji}>{post.my_reaction_icon}</Text>:<NativeIcon ios="hand.thumbsup.fill" android="thumb_up" size={20} color={myGroup==='positive'?C.gold:C.muted}/>}{positive>0?<Text style={s.launcherCount}>{positive}</Text>:null}
     </Pressable>:null}
     {(!myReaction||myGroup==='negative')?<Pressable style={[s.reactionLauncher,s.negativeLauncher,myGroup==='negative'&&s.reactionActive]} onPress={()=>tapReaction('negative')} onLongPress={()=>openPalette('negative')} delayLongPress={430} accessibilityLabel={myGroup==='negative'?`${post.my_reaction_label||'Reaction'} reaction. Tap to change.`:'Dislike. Tap to react, hold for more.'}>
       {myGroup==='negative'&&myReaction!=='dislike'&&post.my_reaction_icon?<Text style={s.launcherEmoji}>{post.my_reaction_icon}</Text>:<NativeIcon ios="hand.thumbsdown.fill" android="thumb_down" size={20} color={myGroup==='negative'?'#e19a9a':C.muted}/>}{negative>0?<Text style={[s.launcherCount,s.negativeCount]}>{negative}</Text>:null}
     </Pressable>:null}
     <Pressable style={s.action} onPress={toggleComments} accessibilityLabel="Comments"><NativeIcon ios="bubble.left" android="chat_bubble_outline" size={19} color={C.muted}/><Text style={s.actionText}>{post.comment_count||0}</Text></Pressable>
     <View style={{flex:1}}/><NativeIcon ios="square.and.arrow.up" android="ios_share" size={19} color={C.muted}/>
   </View>
   {negative>0?<Text style={s.dislikePrivacy}>{negative} dislike reaction{negative===1?'':'s'} · identities private</Text>:null}

   <Pressable onPress={toggleComments} style={s.commentsLink}><Text style={s.commentsLinkText}>{commentLabel}</Text></Pressable>

   {expanded?<View style={s.commentsPanel}>
     {commentsLoading?<ActivityIndicator color={C.pink} style={{marginVertical:12}}/>:comments.map(comment=><View key={comment.id} style={[s.commentRow,comment.parent_comment_id?s.commentReply:null]}>
       <Pressable onPress={()=>onMember(comment.author.id)}><ProtectedImage uri={comment.author.avatar_url} fallback={comment.author.display_name} style={s.commentAvatar}/></Pressable>
       <View style={s.commentBubble}>
         <View style={s.commentHead}><Text style={s.commentName}>{comment.speaker_name||comment.author.display_name}</Text><Text style={s.commentTime}>{comment.created}</Text></View>
         <Text style={s.commentBody}>{comment.body}</Text>
       </View>
     </View>)}
     {commentError?<Text style={s.commentError}>{commentError}</Text>:null}
     <SpeakerPicker speakers={speakers} value={speakerId} onChange={onSpeakerChange} label="Commenting as"/>
     <View style={s.commentComposer}>
       <TextInput value={commentDraft} onChangeText={setCommentDraft} multiline maxLength={600} placeholder="Write a comment…" placeholderTextColor={C.faint} style={s.commentInput}/>
       <Pressable onPress={sendComment} disabled={!commentDraft.trim()||commentSending} style={[s.commentButton,(!commentDraft.trim()||commentSending)&&{opacity:.4}]}><Text style={s.commentButtonText}>Comment</Text></Pressable>
     </View>
   </View>:null}

   <Modal visible={!!palette} transparent animationType="fade" onRequestClose={()=>setPalette(null)}>
     <Pressable style={s.modalShade} onPress={()=>setPalette(null)}>
       <View style={s.palette}>
         <Text style={s.paletteTitle}>{palette==='negative'?'Dislike reactions':'Like reactions'}</Text>
         <ScrollView contentContainerStyle={s.paletteGrid}>
           {catalog.filter(item=>item.group===palette).map(item=><Pressable key={item.key} onPress={()=>{setPalette(null);react(item.key)}} style={[s.reactionChoice,post.my_reaction===item.key&&s.reactionChoiceActive]}>
             <Text style={s.reactionEmoji}>{item.icon}</Text><Text style={s.reactionLabel}>{item.label}</Text>
           </Pressable>)}
         </ScrollView>
       </View>
     </Pressable>
   </Modal>
 </View>;
}

async function postApi(path:string,body:any){return await post(path,body)}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:12,paddingBottom:18},headerWrap:{width:'100%'},feedError:{marginBottom:10,padding:10,borderRadius:14,backgroundColor:'#29151a',borderWidth:1,borderColor:'#70323a'},retryButton:{alignSelf:'flex-start',marginTop:7,paddingHorizontal:12,paddingVertical:6,borderRadius:12,backgroundColor:C.pink},retryText:{color:'#fff',fontSize:9,fontWeight:'900'},
 topbar:{minHeight:58,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:4},
 iconButton:{width:40,height:40,borderRadius:20,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},
 badge:{position:'absolute',right:-3,top:-4,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontSize:9,fontWeight:'900'},
 wallTitleRow:{paddingTop:2,paddingBottom:8},wallTitle:{color:C.text,fontSize:22,fontWeight:'900'},wallSub:{color:C.muted,fontSize:10,marginTop:2},
 composer:{flexDirection:'row',alignItems:'flex-end',gap:8,padding:10,borderRadius:18,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,marginBottom:12},
 meAvatar:{width:38,height:38,borderRadius:12},input:{flex:1,minHeight:38,maxHeight:92,color:C.text,backgroundColor:C.panel2,borderRadius:16,paddingHorizontal:12,paddingVertical:9,fontSize:13},
 postButton:{width:38,height:38,borderRadius:19,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},error:{color:'#ff9aa8',fontSize:10,paddingHorizontal:4,paddingBottom:8},
 card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:20,marginBottom:10,overflow:'hidden'},
 authorRow:{flexDirection:'row',alignItems:'center',gap:10,padding:12},avatar:{width:44,height:44,borderRadius:14},nameRow:{flexDirection:'row',alignItems:'center',gap:6},name:{color:C.text,fontSize:14,fontWeight:'900',maxWidth:'88%'},meta:{color:C.muted,fontSize:9,marginTop:3},
 body:{color:C.text,fontSize:14,lineHeight:20,paddingHorizontal:12,paddingBottom:12},
 photo:{width:'100%',height:340,backgroundColor:C.panel2},photoGrid:{flexDirection:'row',flexWrap:'wrap'},gridPhoto:{width:'50%',height:190,backgroundColor:C.panel2},
 mediaWrap:{overflow:'hidden'},verifyOverlay:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',padding:18,backgroundColor:'rgba(4,7,13,.16)'},verifyTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:8},verifyCopy:{color:'#e2e7ee',fontSize:10,lineHeight:14,textAlign:'center',maxWidth:260,marginTop:5},verifyButton:{marginTop:11,paddingHorizontal:15,paddingVertical:9,borderRadius:15,backgroundColor:C.pink,borderWidth:1,borderColor:'#ff78df'},verifyButtonText:{color:'#fff',fontSize:10,fontWeight:'900'},
 reactedSummary:{paddingHorizontal:13,paddingTop:9,paddingBottom:2},reactedLabel:{color:C.faint,fontSize:8,fontWeight:'900',textTransform:'uppercase',letterSpacing:.5},reactedNames:{color:C.muted,fontSize:9.5,lineHeight:13,marginTop:2},actions:{height:50,flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:10,borderTopWidth:1,borderTopColor:C.line},reactionLauncher:{minWidth:52,height:38,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingHorizontal:9,borderRadius:19,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},negativeLauncher:{backgroundColor:'#161417'},reactionActive:{borderColor:C.pink,backgroundColor:'rgba(190,37,170,.16)'},launcherEmoji:{fontSize:20},launcherCount:{color:C.gold,fontSize:9,fontWeight:'900'},negativeCount:{color:'#e19a9a'},action:{minWidth:46,height:42,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},actionText:{color:C.muted,fontSize:10,fontWeight:'700'},dislikePrivacy:{color:C.faint,fontSize:8.5,paddingHorizontal:13,paddingBottom:7},
 commentsLink:{paddingHorizontal:13,paddingBottom:11},commentsLinkText:{color:C.cyan2,fontSize:10,fontWeight:'900'},
 commentsPanel:{paddingHorizontal:10,paddingBottom:12,borderTopWidth:1,borderTopColor:C.line},commentRow:{flexDirection:'row',alignItems:'flex-start',gap:8,paddingTop:10},commentReply:{marginLeft:24},commentAvatar:{width:30,height:30,borderRadius:10},commentBubble:{flex:1,backgroundColor:C.panel2,borderRadius:13,paddingHorizontal:9,paddingVertical:7},commentHead:{flexDirection:'row',alignItems:'center',gap:7},commentName:{color:C.text,fontSize:10,fontWeight:'900',flex:1},commentTime:{color:C.faint,fontSize:8},commentBody:{color:C.text,fontSize:11.5,lineHeight:16,marginTop:3},commentError:{color:'#ff9aa8',fontSize:9,marginTop:7},
 commentComposer:{flexDirection:'row',alignItems:'flex-end',gap:7,marginTop:9},commentInput:{flex:1,minHeight:38,maxHeight:90,borderRadius:14,backgroundColor:C.panel2,color:C.text,paddingHorizontal:10,paddingVertical:8,fontSize:11},commentButton:{height:38,paddingHorizontal:12,borderRadius:14,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},commentButtonText:{color:'#fff',fontSize:9.5,fontWeight:'900'},
 modalShade:{flex:1,backgroundColor:'rgba(0,0,0,.72)',justifyContent:'flex-end'},palette:{maxHeight:'66%',backgroundColor:'#0a1220',borderTopLeftRadius:24,borderTopRightRadius:24,padding:16,borderTopWidth:1,borderColor:C.line},paletteTitle:{color:C.text,fontSize:15,fontWeight:'900',marginBottom:10},paletteGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingBottom:18},reactionChoice:{width:'31%',minHeight:66,borderRadius:14,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center',padding:7},reactionChoiceActive:{borderColor:C.pink,backgroundColor:'rgba(190,37,170,.16)'},reactionEmoji:{fontSize:25},reactionLabel:{color:C.muted,fontSize:8.5,fontWeight:'800',marginTop:4,textAlign:'center'},
 empty:{alignItems:'center',paddingTop:70},emptyTitle:{color:C.text,fontSize:16,fontWeight:'900',marginTop:12},emptySub:{color:C.muted,fontSize:11,marginTop:5}
});
