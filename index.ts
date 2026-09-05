import Constants from 'expo-constants';
import {registerRootComponent} from 'expo';
const flavor=String((Constants.expoConfig?.extra as any)?.privateGatherAppFlavor||'main');
if(flavor==='messenger')require('./src/notifications/background');
const Root=flavor==='messenger'?require('./MessengerApp').default:require('./App').default;
registerRootComponent(Root);
