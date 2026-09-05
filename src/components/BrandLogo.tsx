import React from 'react';
import {Image,StyleSheet,Text,View,ViewStyle} from 'react-native';
import {C} from '../theme';
const mark=require('../../assets/brand-mark.png');
export default function BrandLogo({compact=false,style}:{compact?:boolean;style?:ViewStyle}){
 return <View style={[s.row,style]}><Image source={mark} resizeMode="contain" style={[s.mark,compact&&s.markCompact]}/><View><Text style={[s.word,compact&&s.wordCompact]}><Text style={s.private}>Private </Text><Text style={s.gather}>Gather</Text></Text>{!compact?<Text style={s.tag}>REAL PEOPLE. PRIVATE MOMENTS.</Text>:null}</View></View>
}
const s=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:10},mark:{width:52,height:52},markCompact:{width:36,height:36},word:{fontSize:21,fontWeight:'900',letterSpacing:-.5},wordCompact:{fontSize:17},private:{color:C.pink},gather:{color:C.cyan2},tag:{color:'#b9c5d8',fontSize:7.5,letterSpacing:1.55,fontWeight:'700',marginTop:3}});
