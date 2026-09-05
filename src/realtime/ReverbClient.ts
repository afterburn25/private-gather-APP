import {post} from '../api/client';
type Handler=(event:any)=>void;
type Channel={name:string,handlers:Set<Handler>,auth?:string,channel_data?:string};
export class ReverbClient{
  private ws?:WebSocket;private socketId='';private channels=new Map<string,Channel>();private retry=0;private timer:any;
  constructor(private config:any){}
  subscribe(name:string,handler:Handler){let c=this.channels.get(name);if(!c){c={name,handlers:new Set()};this.channels.set(name,c);}c.handlers.add(handler);if(this.ws?.readyState===1)this.authSubscribe(c);else this.connect();return()=>{c?.handlers.delete(handler);if(c&&!c.handlers.size){this.channels.delete(name);this.send({event:'pusher:unsubscribe',data:{channel:name}});}};}
  connect(){if(!this.config?.enabled||!this.config?.key||!this.config?.host)return;if(this.ws&&[0,1].includes(this.ws.readyState))return;const tls=['https','wss'].includes(this.config.scheme);const port=Number(this.config.port||443);const standard=(tls&&port===443)||(!tls&&port===80);const prefix=this.config.path?`/${String(this.config.path).replace(/^\/+|\/+$/g,'')}`:'';const url=`${tls?'wss':'ws'}://${this.config.host}${standard?'':`:${port}`}${prefix}/app/${encodeURIComponent(this.config.key)}?protocol=7&client=js&version=8.4.0&flash=false`;this.ws=new WebSocket(url);this.ws.onmessage=e=>this.message(String(e.data||''));this.ws.onclose=()=>this.reconnect();this.ws.onerror=()=>{try{this.ws?.close();}catch{}};}
  close(){clearTimeout(this.timer);this.ws?.close();this.channels.clear();}
  private send(v:any){if(this.ws?.readyState===1)this.ws.send(JSON.stringify(v));}
  private async authSubscribe(c:Channel){if(!this.socketId)return;try{const res=await post('/realtime/auth',{socket_id:this.socketId,channel_name:c.name});c.auth=res.auth||'';c.channel_data=res.channel_data;const data:any={channel:c.name,auth:c.auth};if(c.channel_data)data.channel_data=c.channel_data;this.send({event:'pusher:subscribe',data});}catch{}}
  private message(raw:string){let p:any;try{p=JSON.parse(raw);}catch{return;}if(p.event==='pusher:connection_established'){let d=p.data;try{if(typeof d==='string')d=JSON.parse(d);}catch{}this.socketId=String(d?.socket_id||'');this.retry=0;this.channels.forEach(c=>this.authSubscribe(c));return;}if(p.event==='pusher:ping'){this.send({event:'pusher:pong',data:{}});return;}if(String(p.event||'').startsWith('pusher:'))return;const c=this.channels.get(String(p.channel||''));if(!c)return;let d=p.data;try{if(typeof d==='string')d=JSON.parse(d);}catch{}c.handlers.forEach(h=>{try{h({event:p.event,channel:p.channel,...d});}catch{}});}
  private reconnect(){this.socketId='';clearTimeout(this.timer);this.retry=Math.min(6,this.retry+1);this.timer=setTimeout(()=>this.connect(),Math.min(30000,1000*2**this.retry));}
}
