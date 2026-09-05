import React from 'react';
import {SymbolView} from 'expo-symbols';

export default function NativeIcon({ios,android,size=24,color='#fff'}:{ios:string;android:string;size?:number;color?:string}){
  return <SymbolView
    name={{ios:ios as any,android:android as any,web:android as any} as any}
    size={size}
    tintColor={color}
    fallback={null}
  />;
}
