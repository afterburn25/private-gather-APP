import {Alert,Linking} from 'react-native';
import {post} from '../api/client';

type Target={conversationId?:number;userId?:number;callMode?:'voice'|'video'};
function q(value:any){return encodeURIComponent(String(value??''))}
export async function openMessenger(target:Target={}){
  let token='';
  try{const r=await post('/messenger/handoff',{});token=String(r?.token||'')}catch{}
  const parts=[token&&`token=${q(token)}`,target.conversationId&&`conversation_id=${q(target.conversationId)}`,target.userId&&`user_id=${q(target.userId)}`,target.callMode&&`call_mode=${q(target.callMode)}`].filter(Boolean);
  const url=`privategathermessenger://open${parts.length?'?'+parts.join('&'):''}`;
  try{await Linking.openURL(url);return true}catch{
    Alert.alert('Private Gather Messenger','Install or open the Private Gather Messenger native app to use messages and calls. Your Private Gather account works in both apps.');
    return false;
  }
}
