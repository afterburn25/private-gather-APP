import React,{useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import ProtectedImage from './ProtectedImage';
import NativeIcon from './NativeIcon';
import {C} from '../theme';

export type NativeSpeaker={id:number;name:string;avatar_url?:string|null};

export default function SpeakerPicker({speakers,value,onChange,label='Speaking as'}:{speakers:NativeSpeaker[];value:number|null;onChange:(id:number)=>void;label?:string}){
  const [open,setOpen]=useState(false);
  if(!Array.isArray(speakers)||speakers.length<=1)return null;
  const selected=speakers.find(s=>Number(s.id)===Number(value))||speakers[0];

  return <View style={s.wrap}>
    <Pressable accessibilityLabel={`${label} ${selected.name}`} onPress={()=>setOpen(v=>!v)} style={s.current}>
      <ProtectedImage uri={selected.avatar_url} fallback={selected.name} style={s.avatar}/>
      <View style={{flex:1}}><Text style={s.label}>{label}</Text><Text numberOfLines={1} style={s.name}>{selected.name}</Text></View>
      <NativeIcon ios={open?'chevron.up':'chevron.down'} android={open?'expand_less':'expand_more'} size={18} color={C.cyan2}/>
    </Pressable>
    {open?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.options}>
      {speakers.map(item=>{
        const active=Number(item.id)===Number(selected.id);
        return <Pressable key={item.id} onPress={()=>{onChange(Number(item.id));setOpen(false)}} style={[s.option,active&&s.active]}>
          <ProtectedImage uri={item.avatar_url} fallback={item.name} style={s.optionAvatar}/>
          <Text numberOfLines={1} style={[s.optionText,active&&s.activeText]}>{item.name}</Text>
          {active?<NativeIcon ios="checkmark.circle.fill" android="check_circle" size={15} color={C.green}/>:null}
        </Pressable>;
      })}
    </ScrollView>:null}
  </View>;
}
const s=StyleSheet.create({
 wrap:{marginBottom:7},
 current:{minHeight:44,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:10,paddingVertical:6,borderRadius:14,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},
 avatar:{width:32,height:32,borderRadius:10},label:{color:C.faint,fontSize:8,fontWeight:'800',letterSpacing:.5,textTransform:'uppercase'},name:{color:C.text,fontSize:11,fontWeight:'900',marginTop:1},
 options:{gap:7,paddingTop:7,paddingBottom:2},
 option:{minWidth:112,maxWidth:160,height:42,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:8,borderRadius:13,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},
 active:{borderColor:C.pink,backgroundColor:'rgba(190,37,170,.14)'},optionAvatar:{width:28,height:28,borderRadius:9},optionText:{color:C.muted,fontSize:9.5,fontWeight:'800',flex:1},activeText:{color:C.text}
});
