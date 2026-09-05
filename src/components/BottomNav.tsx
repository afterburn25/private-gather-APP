import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {TabKey} from '../app/types';
import {C} from '../theme';
const tabs:{key:TabKey;icon:string;label:string}[]=[
 {key:'home',icon:'⌂',label:'Home'},{key:'discover',icon:'⌕',label:'Explore'},{key:'messages',icon:'✦',label:'Messages'},{key:'events',icon:'◇',label:'Events'},{key:'profile',icon:'○',label:'Profile'}
];
export default function BottomNav({active,onChange,messageUnread=0}:{active:TabKey;onChange:(k:TabKey)=>void;messageUnread?:number}){
 return <View style={s.bar}>{tabs.map(t=>{const a=t.key===active;return <Pressable key={t.key} style={s.item} onPress={()=>onChange(t.key)}><View style={[s.iconWrap,a&&s.iconWrapActive]}><Text style={[s.icon,a&&s.active]}>{t.icon}</Text>{t.key==='messages'&&messageUnread>0&&<View style={s.badge}><Text style={s.badgeText}>{messageUnread>99?'99+':messageUnread}</Text></View>}</View><Text style={[s.label,a&&s.active]}>{t.label}</Text></Pressable>})}</View>
}
const s=StyleSheet.create({bar:{height:74,backgroundColor:'rgba(5,9,20,.98)',borderTopWidth:1,borderTopColor:'#223553',flexDirection:'row',paddingBottom:6},item:{flex:1,alignItems:'center',justifyContent:'center',gap:3},iconWrap:{width:37,height:31,borderRadius:12,alignItems:'center',justifyContent:'center'},iconWrapActive:{backgroundColor:'rgba(255,53,211,.1)',borderWidth:1,borderColor:'rgba(255,53,211,.38)'},icon:{fontSize:23,color:C.faint,fontWeight:'700'},label:{fontSize:9.5,color:C.faint,fontWeight:'800'},active:{color:C.pink},badge:{position:'absolute',right:-5,top:-4,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:C.red,alignItems:'center',justifyContent:'center'},badgeText:{fontSize:9,color:'#fff',fontWeight:'900'}});
