import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {get} from '../api/client';
import {Member} from '../app/types';
import ProtectedImage from '../components/ProtectedImage';
import NativeIcon from '../components/NativeIcon';
import {C} from '../theme';

const pretty=(v:any)=>String(v??'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export default function MemberProfileScreen({memberId,onBack,onMessage,onCall}:{memberId:number;onBack:()=>void;onMessage:(m:Member)=>void;onCall:(m:Member,mode:'voice'|'video')=>void}){
 const [m,setM]=useState<Member|null>(null);const [error,setError]=useState('');
 useEffect(()=>{get(`/members/${memberId}`).then(r=>setM(r.data)).catch(e=>setError(String(e.message||e)))},[memberId]);
 if(!m)return <View style={s.page}><View style={s.top}><Pressable onPress={onBack} style={s.backBare}><NativeIcon ios="chevron.left" android="arrow_back" size={23} color={C.cyan2}/><Text style={s.back}>Back</Text></Pressable></View>{error?<Text style={s.error}>{error}</Text>:<ActivityIndicator color={C.pink} style={{marginTop:80}}/>}</View>;
 const ages=[m.age,m.secondary_age].filter(Boolean).join(' / ');
 const primary=m.primary_person_name||'Primary';
 const secondary=m.secondary_person_name||'Partner';
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
   <View style={s.coverWrap}><ProtectedImage uri={m.cover_url} fallback={m.display_name} style={s.cover}/><View style={s.coverShade}/><Pressable onPress={onBack} style={s.backButton}><NativeIcon ios="chevron.left" android="arrow_back" size={24} color="#fff"/></Pressable></View>
   <View style={s.body}>
     <ProtectedImage uri={m.avatar_url} fallback={m.display_name} style={s.avatar}/>
     <View style={s.nameLine}><Text style={s.name}>{m.display_name}{ages?` · ${ages}`:''}</Text>{m.verified?<NativeIcon ios="checkmark.seal.fill" android="verified" size={21} color={C.green}/>:null}</View>
     <Text style={s.handle}>@{m.username}</Text>
     <Text style={s.meta}>{[m.profile_type_label,m.location].filter(Boolean).join(' · ')}</Text>
     {m.headline?<Text style={s.headline}>{m.headline}</Text>:null}
     <View style={s.actions}>
       {m.can_message?<Pressable onPress={()=>onMessage(m)} style={[s.action,s.primary]}><NativeIcon ios="message.fill" android="chat_bubble" size={19} color="#fff"/><Text style={s.primaryText}>Message</Text></Pressable>:null}
       {m.can_call?<Pressable onPress={()=>onCall(m,'voice')} style={s.roundAction}><NativeIcon ios="phone.fill" android="call" size={21} color={C.green}/></Pressable>:null}
       {m.can_call?<Pressable onPress={()=>onCall(m,'video')} style={s.roundAction}><NativeIcon ios="video.fill" android="videocam" size={22} color={C.green}/></Pressable>:null}
     </View>
     {m.online?<View style={s.presence}><View style={s.online}/><Text style={s.presenceText}>{m.presence_label||'Online now'}</Text></View>:null}

     {m.about?<Section title="About"><Text style={s.copy}>{m.about}</Text></Section>:null}
     {m.looking_for?<Section title="Looking for"><Text style={s.copy}>{m.looking_for}</Text></Section>:null}
     {m.boundaries?<Section title="Boundaries & expectations"><Text style={s.copy}>{m.boundaries}</Text></Section>:null}
     {m.interests?.length?<Section title="Interests"><Tags rows={m.interests}/></Section>:null}

     <Section title="Profile">
       <Info label="Relationship" value={m.relationship_status}/>
       <Info label="Social style" value={m.social_style}/>
       <Info label="First meet" value={m.meet_preference}/>
       <Info label="Lifestyle experience" value={m.lifestyle_experience}/>
       <Info label="Hosting" value={m.hosting_preference}/>
       <Info label="Travel" value={m.travel_preference}/>
       <Info label="Partner / group" value={m.partner_names}/>
       <Info label="Additional members" value={m.group_member_details}/>
     </Section>

     <Person title={primary} orientation={m.sexual_orientation} ethnicity={m.primary_ethnicity} hair={m.primary_hair_color} eyes={m.primary_eye_color} height={m.primary_height} weight={m.primary_weight} body={m.primary_body_type} drinking={m.primary_drinking_preference} smoking={m.primary_smoking_preference} four20={m.primary_420_preference} grooming={m.primary_grooming_style} chest={m.primary_chest_size} penis={m.primary_penis_size} bust={m.primary_bust} waist={m.primary_waist} hips={m.primary_hips}/>
     {m.secondary_person_name||m.secondary_age?<Person title={secondary} orientation={m.secondary_sexual_orientation} ethnicity={m.secondary_ethnicity} hair={m.secondary_hair_color} eyes={m.secondary_eye_color} height={m.secondary_height} weight={m.secondary_weight} body={m.secondary_body_type} drinking={m.secondary_drinking_preference} smoking={m.secondary_smoking_preference} four20={m.secondary_420_preference} grooming={m.secondary_grooming_style} chest={m.secondary_chest_size} penis={m.secondary_penis_size} bust={m.secondary_bust} waist={m.secondary_waist} hips={m.secondary_hips}/>:null}

     {(m.seeking_profile_types?.length||m.seeking_connection_types?.length||m.seeking_age_min||m.seeking_age_max||m.seeking_distance_miles)?<Section title="Seeking">
       {m.seeking_profile_types?.length?<><Text style={s.subLabel}>Profiles</Text><Tags rows={m.seeking_profile_types.map(pretty)}/></>:null}
       {m.seeking_connection_types?.length?<><Text style={s.subLabel}>Connections</Text><Tags rows={m.seeking_connection_types.map(pretty)}/></>:null}
       <Info label="Preferred ages" value={m.seeking_age_min||m.seeking_age_max?`${m.seeking_age_min||18} – ${m.seeking_age_max||99}`:null}/>
       <Info label="Distance" value={m.seeking_distance_miles?`${m.seeking_distance_miles} miles`:null}/>
     </Section>:null}
   </View>
 </ScrollView>;
}
function Person(p:any){const visible=[p.orientation,p.ethnicity,p.hair,p.eyes,p.height,p.weight,p.body,p.drinking,p.smoking,p.four20,p.grooming,p.chest,p.penis,p.bust,p.waist,p.hips].some(Boolean);if(!visible)return null;return <Section title={p.title}><Info label="Orientation" value={p.orientation}/><Info label="Ethnicity" value={p.ethnicity}/><Info label="Hair" value={p.hair}/><Info label="Eyes" value={p.eyes}/><Info label="Height" value={p.height}/><Info label="Weight" value={p.weight}/><Info label="Body type" value={p.body}/><Info label="Drinking" value={p.drinking}/><Info label="Smoking" value={p.smoking}/><Info label="420" value={p.four20}/><Info label="Grooming" value={p.grooming}/><Info label="Bust / chest" value={p.chest}/><Info label="Penis size" value={p.penis}/><Info label="Measurements" value={[p.bust&&`Bust ${p.bust}`,p.waist&&`Waist ${p.waist}`,p.hips&&`Hips ${p.hips}`].filter(Boolean).join(' · ')||null}/></Section>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>}
function Info({label,value}:{label:string;value?:any}){if(value===null||value===undefined||String(value).trim()==='')return null;return <View style={s.info}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{pretty(value)}</Text></View>}
function Tags({rows}:{rows:string[]}){return <View style={s.tags}>{rows.map((x,i)=><View key={`${x}-${i}`} style={s.tag}><Text style={s.tagText}>{pretty(x)}</Text></View>)}</View>}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},content:{paddingBottom:34},top:{height:56,paddingHorizontal:14,justifyContent:'center'},backBare:{flexDirection:'row',alignItems:'center',gap:5},back:{color:C.cyan2,fontWeight:'800'},error:{color:'#ff8d8d',padding:16},
 coverWrap:{height:210,position:'relative'},cover:{width:'100%',height:'100%'},coverShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.25)'},backButton:{position:'absolute',left:14,top:12,width:42,height:42,borderRadius:21,backgroundColor:'rgba(4,9,17,.78)',alignItems:'center',justifyContent:'center'},
 body:{paddingHorizontal:15},avatar:{width:108,height:108,borderRadius:30,borderWidth:4,borderColor:C.bg,marginTop:-48},nameLine:{flexDirection:'row',alignItems:'center',gap:7,marginTop:9},name:{color:C.text,fontWeight:'900',fontSize:22,flexShrink:1},handle:{color:C.cyan2,fontWeight:'700',fontSize:11,marginTop:2},meta:{color:C.muted,fontSize:10,marginTop:5,textTransform:'capitalize'},headline:{color:'#d8dfeb',fontSize:13,lineHeight:19,marginTop:11},
 actions:{flexDirection:'row',gap:9,marginTop:15},action:{height:46,paddingHorizontal:16,borderRadius:16,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},primary:{flex:1,backgroundColor:C.pink},primaryText:{color:'#fff',fontWeight:'900'},roundAction:{width:46,height:46,borderRadius:23,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,alignItems:'center',justifyContent:'center'},
 presence:{flexDirection:'row',alignItems:'center',gap:7,marginTop:13},online:{width:8,height:8,borderRadius:4,backgroundColor:C.green},presenceText:{color:C.green,fontWeight:'700',fontSize:10},
 section:{marginTop:22,paddingTop:14,borderTopWidth:1,borderTopColor:C.line},sectionTitle:{color:C.text,fontWeight:'900',fontSize:15,marginBottom:9},copy:{color:'#c9d2df',fontSize:13,lineHeight:20},subLabel:{color:C.muted,fontSize:9,fontWeight:'900',letterSpacing:1.2,marginTop:8,marginBottom:7},
 tags:{flexDirection:'row',flexWrap:'wrap',gap:6},tag:{paddingHorizontal:9,paddingVertical:6,borderRadius:12,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},tagText:{color:C.cyan2,fontSize:9.5,fontWeight:'700'},
 info:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:7},infoLabel:{color:C.muted,fontSize:10.5,flex:1},infoValue:{color:C.text,fontSize:10.5,fontWeight:'700',textAlign:'right',maxWidth:'62%'}
});