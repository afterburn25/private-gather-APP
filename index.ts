import React from 'react';
import Constants from 'expo-constants';
import {registerRootComponent} from 'expo';
import AppLockGate from './src/components/AppLockGate';

const flavor=String((Constants.expoConfig?.extra as any)?.privateGatherAppFlavor||'main');
if(flavor==='messenger')require('./src/notifications/background');
const Root=flavor==='messenger'?require('./MessengerApp').default:require('./App').default;
const ProtectedRoot=()=>React.createElement(AppLockGate,null,React.createElement(Root));
registerRootComponent(ProtectedRoot);
