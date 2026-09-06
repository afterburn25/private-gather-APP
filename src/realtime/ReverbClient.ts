import {post} from '../api/client';
type Handler=(event:any)=>void;
type Channel={name:string,handlers:Set<Handler>,auth?:string,channel_data?:string};

export class ReverbClient{
  private ws?:WebSocket;private socketId='';private channels=new Map<string,Channel>();private retry=0;private timer:any;private watchdog:any;private stopped=false;private lastActivity=0;private generation=0;
  constructor(private config:any){}

  subscribe(name:string,handler:Handler){
    let c=this.channels.get(name);if(!c){c={name,handlers:new Set()};this.channels.set(name,c)}
    c.handlers.add(handler);
    if(this.ws?.readyState===1)this.authSubscribe(c);else this.ensureConnected();
    return()=>{c?.handlers.delete(handler);if(c&&!c.handlers.size){this.channels.delete(name);this.send({event:'pusher:unsubscribe',data:{channel:name}})}};
  }

  connect(){this.ensureConnected()}
  ensureConnected(){
    if(!this.config?.enabled||!this.config?.key||!this.config?.host)return;
    this.stopped=false;
    if(this.ws&&[0,1].includes(this.ws.readyState))return;
    clearTimeout(this.timer);
    const tls=['https','wss'].includes(this.config.scheme);const port=Number(this.config.port||443);const standard=(tls&&port===443)||(!tls&&port===80);const prefix=this.config.path?`/${String(this.config.path).replace(/^\/+|\/+$/g,'')}`:'';
    const url=`${tls?'wss':'ws'}://${this.config.host}${standard?'':`:${port}`}${prefix}/app/${encodeURIComponent(this.config.key)}?protocol=7&client=js&version=8.4.0&flash=false`;
    const generation=++this.generation;const socket=new WebSocket(url);this.ws=socket;this.lastActivity=Date.now();
    socket.onopen=()=>{if(this.generation!==generation)return;this.lastActivity=Date.now();this.armWatchdog(generation)};
    socket.onmessage=e=>{if(this.generation!==generation)return;this.lastActivity=Date.now();this.armWatchdog(generation);this.message(String(e.data||''))};
    socket.onclose=()=>{if(this.generation!==generation)return;this.ws=undefined;this.socketId='';clearTimeout(this.watchdog);if(!this.stopped)this.reconnect()};
    socket.onerror=()=>{if(this.generation!==generation)return;try{socket.close()}catch{}};
  }

  close(){
    this.stopped=true;this.generation++;clearTimeout(this.timer);clearTimeout(this.watchdog);this.socketId='';const socket=this.ws;this.ws=undefined;try{socket?.close()}catch{}this.channels.clear();
  }

  private send(v:any){if(this.ws?.readyState===1){try{this.ws.send(JSON.stringify(v));this.lastActivity=Date.now()}catch{}}}

  private async authSubscribe(c:Channel){
    if(!this.socketId||this.stopped||!this.channels.has(c.name))return;
    try{
      const res=await post('/realtime/auth',{socket_id:this.socketId,channel_name:c.name});
      if(this.stopped||!this.channels.has(c.name))return;
      c.auth=res.auth||'';c.channel_data=res.channel_data;const data:any={channel:c.name,auth:c.auth};if(c.channel_data)data.channel_data=c.channel_data;this.send({event:'pusher:subscribe',data});
    }catch(e){console.warn('Private Gather realtime channel auth deferred',c.name,String((e as any)?.message||e))}
  }

  private message(raw:string){
    let p:any;try{p=JSON.parse(raw)}catch{return}
    if(p.event==='pusher:connection_established'){
      let d=p.data;try{if(typeof d==='string')d=JSON.parse(d)}catch{}
      this.socketId=String(d?.socket_id||'');this.retry=0;this.lastActivity=Date.now();this.channels.forEach(c=>this.authSubscribe(c));return;
    }
    if(p.event==='pusher:ping'){this.send({event:'pusher:pong',data:{}});return}
    if(String(p.event||'').startsWith('pusher:'))return;
    const c=this.channels.get(String(p.channel||''));if(!c)return;
    let d=p.data;try{if(typeof d==='string')d=JSON.parse(d)}catch{}
    c.handlers.forEach(h=>{try{h({event:p.event,channel:p.channel,...d})}catch{}});
  }

  private armWatchdog(generation:number){
    clearTimeout(this.watchdog);if(this.stopped)return;
    this.watchdog=setTimeout(()=>{
      if(this.stopped||this.generation!==generation)return;
      const quietFor=Date.now()-this.lastActivity;
      if(quietFor<75000){this.armWatchdog(generation);return}
      const socket=this.ws;this.ws=undefined;this.socketId='';this.generation++;try{socket?.close()}catch{}this.reconnect();
    },45000);
  }

  private reconnect(){
    if(this.stopped)return;clearTimeout(this.timer);this.retry=Math.min(7,this.retry+1);
    const base=Math.min(30000,750*Math.pow(2,this.retry));const jitter=Math.floor(Math.random()*Math.min(1200,base*.25));
    this.timer=setTimeout(()=>this.ensureConnected(),base+jitter);
  }
}
