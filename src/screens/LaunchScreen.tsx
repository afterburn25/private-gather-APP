import React,{useEffect,useRef} from 'react';
import {Animated,Image,ImageBackground,StyleSheet,Text} from 'react-native';

const mark=require('../../assets/splash-mark.png');
const bg=require('../../assets/pwa-splash-background.jpg');

export default function LaunchScreen(){
 const opacity=useRef(new Animated.Value(0)).current;
 const scale=useRef(new Animated.Value(.965)).current;
 useEffect(()=>{
   Animated.parallel([
     Animated.sequence([
       Animated.timing(opacity,{toValue:1,duration:540,useNativeDriver:true}),
       Animated.delay(1920),
       Animated.timing(opacity,{toValue:0,duration:540,useNativeDriver:true})
     ]),
     Animated.sequence([
       Animated.timing(scale,{toValue:1,duration:540,useNativeDriver:true}),
       Animated.delay(1920),
       Animated.timing(scale,{toValue:1.018,duration:540,useNativeDriver:true})
     ])
   ]).start();
 },[opacity,scale]);
 return <ImageBackground source={bg} resizeMode="cover" style={s.page}>
   <Animated.View style={[s.brand,{opacity,transform:[{scale}]}]}>
     <Image source={mark} resizeMode="contain" style={s.logo}/>
     <Text style={s.name}>Private Gather</Text>
     <Text style={s.tag}>PRIVATE LIFESTYLE COMMUNITY</Text>
   </Animated.View>
 </ImageBackground>;
}
const s=StyleSheet.create({
 page:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#100e12'},
 brand:{alignItems:'center',justifyContent:'center'},
 logo:{width:190,height:190,marginBottom:7},
 name:{fontFamily:'serif',fontSize:40,fontWeight:'600',letterSpacing:1.4,color:'#fff9f5',textShadowColor:'rgba(0,0,0,.42)',textShadowRadius:16,textShadowOffset:{width:0,height:5}},
 tag:{marginTop:8,fontSize:10,fontWeight:'800',letterSpacing:2.2,color:'#d9b875'}
});
