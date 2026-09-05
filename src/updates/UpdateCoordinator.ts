import * as Updates from 'expo-updates';
import * as Device from 'expo-device';
import * as Keychain from 'react-native-keychain';
import {Linking,Platform} from 'react-native';
import {post} from '../api/client';
import {installationId} from '../device/installation';
import {APP_FLAVOR,APP_VERSION,RUNTIME_VERSION} from '../config';
import {registerPush} from '../notifications/register';

const PENDING_SERVICE='privategather.native.pending-update';
type PendingUpdate={release_id:number,version:string,type:'ota'|'binary'};

function compareVersions(a:string,b:string){const aa=String(a||'').split('.').map(v=>Number.parseInt(v,10)||0),bb=String(b||'').split('.').map(v=>Number.parseInt(v,10)||0),n=Math.max(aa.length,bb.length);for(let i=0;i<n;i++){const d=(aa[i]||0)-(bb[i]||0);if(d!==0)return d>0?1:-1;}return 0;}
async function pending():Promise<PendingUpdate|null>{const row=await Keychain.getGenericPassword({service:PENDING_SERVICE});if(!row)return null;try{return JSON.parse(row.password) as PendingUpdate;}catch{return null;}}
async function rememberPending(value:PendingUpdate){await Keychain.setGenericPassword('pending',JSON.stringify(value),{service:PENDING_SERVICE});}
async function clearPending(){await Keychain.resetGenericPassword({service:PENDING_SERVICE});}

async function identity(){const push=await registerPush();const label=APP_FLAVOR==='messenger'?'Private Gather Messenger':'Private Gather';return {installation_id:await installationId(),platform:Platform.OS,device_name:`${label} · ${Device.deviceName||Device.modelName||'mobile'}`,app_version:APP_VERSION,runtime_version:RUNTIME_VERSION,push_provider:push?.provider,push_token:push?.token,capabilities:{app_role:APP_FLAVOR,realtime:true,webrtc:APP_FLAVOR==='messenger',callkeep:APP_FLAVOR==='messenger',voip_push:APP_FLAVOR==='messenger'&&Platform.OS==='ios',background_calls:APP_FLAVOR==='messenger',ota:true}};}

async function reportPendingApplied(request:any){const item=await pending();if(!item)return;if(item.type==='binary'&&compareVersions(APP_VERSION,item.version)<0)return;try{await post('/updates/report',{installation_id:request.installation_id,release_id:item.release_id,event:'applied',detail:item.type==='ota'?'OTA loaded after controlled restart.':'Native binary detected after store update.'});await clearPending();}catch{}}

export async function registerDevice(){const request=await identity();const result=await post('/devices',request);await reportPendingApplied(request);return result;}

export async function checkForControlledUpdate(){const request=await identity();await reportPendingApplied(request);const state=await post('/updates/check',request);if(!state.available||!state.release)return state;const r=state.release as any;if(r.type==='ota'){try{const result=await Updates.checkForUpdateAsync();if(!result.isAvailable){await post('/updates/report',{installation_id:request.installation_id,release_id:r.id,event:'skipped',detail:'Server release is eligible but the OTA service has no matching update yet.'});return state;}await Updates.fetchUpdateAsync();await post('/updates/report',{installation_id:request.installation_id,release_id:r.id,event:'downloaded',detail:'OTA package downloaded and verified by Expo Updates.'});await rememberPending({release_id:Number(r.id),version:String(r.version),type:'ota'});await Updates.reloadAsync();}catch(e:any){await post('/updates/report',{installation_id:request.installation_id,release_id:r.id,event:'failed',detail:String(e?.message||e)}).catch(()=>{});}}else if(r.store_url){await rememberPending({release_id:Number(r.id),version:String(r.version),type:'binary'});await post('/updates/report',{installation_id:request.installation_id,release_id:r.id,event:'store_opened',detail:'App Store / Play Store update page opened.'}).catch(()=>{});await Linking.openURL(r.store_url);}return state;}

export function startControlledUpdateLoop(){let stopped=false,timer:any;const run=async()=>{if(stopped)return;let next=1800;try{const state=await checkForControlledUpdate();next=Math.max(300,Number(state?.next_check_after_seconds||1800));}catch{}if(!stopped)timer=setTimeout(run,next*1000+Math.floor(Math.random()*45000));};run();return()=>{stopped=true;clearTimeout(timer);};}
