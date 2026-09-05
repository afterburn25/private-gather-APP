import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {C} from '../theme';
import BrandLogo from './BrandLogo';
import NativeIcon from './NativeIcon';

export default function ScreenHeader({title,subtitle,onNotifications,notificationCount=0,left}:{title:string;subtitle?:string;onNotifications?:()=>void;notificationCount?:number;left?:React.ReactNode}){
 return <View style={s.row}>{left||<BrandLogo compact/>}<View style={s.copy}><Text style={s.title}>{title}</Text>{subtitle?<Text style={s.sub}>{subtitle}</Text>:null}</View>{onNotifications?<Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={s.bell} onPress={onNotifications}><NativeIcon ios="bell.fill" android="notifications" size={20} color={C.cyan2}/>{notificationCount>0&&<View style={s.badge}><Text style={s.badgeText}>{notificationCount>99?'99+':notificationCount}</Text></View>}</Pressable>:null}</View>
}
const s=StyleSheet.create({row:{minHeight:62,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:4},copy:{flex:1},title:{color:C.text,fontSize:17,fontWeight:'900'},sub:{color:C.muted,fontSize:10,marginTop:2},bell:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:'#263d5a',backgroundColor:'rgba(9,18,31,.94)',alignItems:'center',justifyContent:'center'},badge:{position:'absolute',right:-3,top:-4,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:C.pink,alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontWeight:'900',fontSize:9}});
