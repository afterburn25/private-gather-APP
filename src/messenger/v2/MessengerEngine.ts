import {AppState} from 'react-native';
import {get,post} from '../../api/client';
import {ReverbClient} from '../../realtime/ReverbClient';
import {MessengerStore,StoredConversation,StoredMessage} from './MessengerStore';

type Scope='inbox'|`conversation:${number}`|`typing:${number}`;
type Listener=()=>void;

type TypingState={label:string;timer?:any;lastTrueAt:number;active:boolean;speakerId?:number|null};

export class MessengerEngine{
  readonly store=new MessengerStore();
  private rt?:ReverbClient;
  private rtConfig:any;
  private userUnsub?:()=>void;
  private presenceUnsubs=new Map<number,()=>void>();
  private listeners=new Map<Scope,Set<Listener>>();
  private typing=new Map<number,TypingState>();
  private activeConversation=0;
  private flushTimer:any;
  private appStateSub:any;
  private stopped=false;

  async boot(){
    this.stopped=false;
    await this.store.init();
    try{
      this.rtConfig=(await get('/realtime/config')).data;
      if(this.rtConfig?.enabled){
        this.rt=new ReverbClient(this.rtConfig);
        this.rt.ensureConnected();
        if(this.rtConfig.user_channel)this.userUnsub=this.rt.subscribe(this.rtConfig.user_channel,e=>this.handleUserEvent(e));
      }
    }catch(e){console.warn('Messenger V2 realtime unavailable; cache + REST recovery active.',String((e as any)?.message||e))}
    await this.flushOutbox();
    this.flushTimer=setInterval(()=>this.flushOutbox().catch(()=>{}),5000);
    this.appStateSub=AppState.addEventListener('change',state=>{
      if(state==='active'){
        this.rt?.ensureConnected();
        this.refreshInbox().catch(()=>{});
        if(this.activeConversation)this.refreshConversation(this.activeConversation).catch(()=>{});
        this.flushOutbox().catch(()=>{});
      }
    });
  }

  stop(){
    this.stopped=true;clearInterval(this.flushTimer);this.appStateSub?.remove?.();
    this.userUnsub?.();this.presenceUnsubs.forEach(fn=>fn());this.presenceUnsubs.clear();this.rt?.close();
    this.listeners.clear();this.typing.forEach(v=>clearTimeout(v.timer));this.typing.clear();
  }

  subscribe(scope:Scope,listener:Listener){let set=this.listeners.get(scope);if(!set){set=new Set();this.listeners.set(scope,set)}set.add(listener);return()=>{set?.delete(listener)}}
  private emit(scope:Scope){this.listeners.get(scope)?.forEach(fn=>{try{fn()}catch{}})}

  async conversations():Promise<StoredConversation[]>{return this.store.conversations()}
  async messages(conversationId:number):Promise<StoredMessage[]>{return this.store.messages(conversationId)}
  async conversationDraft(conversationId:number){return (await this.store.getValue(`draft:${conversationId}`))||''}
  async saveConversationDraft(conversationId:number,text:string){const value=String(text||'');await this.store.setValue(`draft:${conversationId}`,value.length?value:null)}
  typingLabel(conversationId:number){return this.typing.get(conversationId)?.label||''}

  async refreshInbox(){
    const response=await get('/conversations');
    const rows=Array.isArray(response?.conversations)?response.conversations:[];
    await this.store.replaceConversations(rows);this.emit('inbox');
    return rows;
  }

  async startConversation(userId:number){
    const r=await post(`/conversations/with/${userId}`,{});
    const id=Number(r?.conversation_id||r?.conversation?.id||0);
    if(!id)throw new Error('Private Gather could not open this conversation.');
    return id;
  }

  async openConversation(conversationId:number){
    this.activeConversation=conversationId;
    this.rt?.ensureConnected();
    this.subscribePresence(conversationId);
    return this.refreshConversation(conversationId);
  }

  leaveConversation(conversationId:number){
    if(this.activeConversation===conversationId)this.activeConversation=0;
    this.setTyping(conversationId,'',null,true).catch(()=>{});
    const un=this.presenceUnsubs.get(conversationId);un?.();this.presenceUnsubs.delete(conversationId);
  }

  async refreshConversation(conversationId:number){
    const payload=await get(`/conversations/${conversationId}`);
    await this.store.mergeConversationPayload(payload);
    this.emit(`conversation:${conversationId}`);
    const unread=Number(payload?.conversation?.unread||0);
    if(unread>0)await this.markRead(conversationId);
    return payload;
  }

  async sendMessage(conversationId:number,body:string,speakerId?:number|null){
    const text=body.trim();if(!text)return null;
    const optimistic=await this.store.optimisticMessage(conversationId,text,speakerId);
    this.emit(`conversation:${conversationId}`);
    this.setTyping(conversationId,'',speakerId,true).catch(()=>{});
    try{
      const r=await post(`/conversations/${conversationId}/messages`,optimistic.payload);
      if(!r?.message)throw new Error('Message delivery response was incomplete.');
      await this.store.confirmOptimistic(optimistic.key,conversationId,r.message);
      this.emit(`conversation:${conversationId}`);this.emit('inbox');
      return r.message;
    }catch(e){
      await this.store.failOptimistic(optimistic.key,1);this.emit(`conversation:${conversationId}`);
      return {...optimistic.message,pending:true,failed:true};
    }
  }

  async retryMessage(conversationId:number,localKey:string){await this.store.retryNow(localKey);this.emit(`conversation:${conversationId}`);this.rt?.ensureConnected();await this.flushOutbox()}
  async discardMessage(conversationId:number,localKey:string){await this.store.removeOptimistic(localKey);this.emit(`conversation:${conversationId}`)}

  async flushOutbox(){
    if(this.stopped)return;
    const rows=await this.store.dueOutbox();
    for(const row of rows){
      try{
        const payload=JSON.parse(row.payload_json||'{}');
        const r=await post(`/conversations/${row.conversation_id}/messages`,payload);
        if(!r?.message)throw new Error('Incomplete send response');
        await this.store.confirmOptimistic(row.local_key,row.conversation_id,r.message);
        this.emit(`conversation:${row.conversation_id}`);this.emit('inbox');
      }catch{
        await this.store.failOptimistic(row.local_key,Number(row.attempts||0)+1);
        this.emit(`conversation:${row.conversation_id}`);
      }
    }
  }

  async markRead(conversationId:number){
    try{await post(`/conversations/${conversationId}/read`,{});await this.store.setUnread(conversationId,0);this.emit('inbox')}catch{}
  }

  async react(messageId:number,reaction='like'){
    const r=await post(`/messages/${messageId}/reactions`,{reaction});
    if(this.activeConversation)await this.refreshConversation(this.activeConversation).catch(()=>{});
    return r;
  }

  async setTyping(conversationId:number,text:string,speakerId?:number|null,forceFalse=false){
    const now=Date.now();let state=this.typing.get(conversationId)||{label:'',lastTrueAt:0,active:false};
    clearTimeout(state.timer);
    const active=!forceFalse&&text.trim().length>0;
    state.speakerId=speakerId;
    if(active&&(!state.active||now-state.lastTrueAt>3500)){
      state.active=true;state.lastTrueAt=now;
      post(`/conversations/${conversationId}/typing`,{active:true,speaker_profile_identity_id:speakerId||undefined}).catch(()=>{});
    }
    if(!active&&state.active){state.active=false;post(`/conversations/${conversationId}/typing`,{active:false,speaker_profile_identity_id:speakerId||undefined}).catch(()=>{})}
    if(active)state.timer=setTimeout(()=>this.setTyping(conversationId,'',speakerId,true).catch(()=>{}),7000);
    this.typing.set(conversationId,state);
  }

  private subscribePresence(conversationId:number){
    if(!this.rt||this.presenceUnsubs.has(conversationId))return;
    const un=this.rt.subscribe(`presence-conversation.${conversationId}`,e=>{
      if(e.kind==='typing'){
        const state=this.typing.get(conversationId)||{label:'',lastTrueAt:0,active:false};
        state.label=e.payload?.active===true?`${e.payload?.speaker_name||'Someone'} is typing…`:'';
        this.typing.set(conversationId,state);this.emit(`typing:${conversationId}`);
      }
      if(e.kind==='messages.read')this.refreshConversation(conversationId).catch(()=>{});
    });
    this.presenceUnsubs.set(conversationId,un);
  }

  private async handleUserEvent(e:any){
    const kind=String(e?.kind||'');
    const payload=e?.payload||{};
    const message=payload?.message;
    const cid=Number(payload?.conversation_id||message?.conversation_id||0);
    if(kind==='message.created'&&message&&cid){
      await this.store.upsertServerMessages(cid,[message]);
      if(this.activeConversation===cid&&!message.mine)await this.markRead(cid);
      this.emit(`conversation:${cid}`);this.emit('inbox');return;
    }
    if(kind==='message.removed'&&cid){await this.store.removeServerMessage(Number(payload?.message_id||0));this.emit(`conversation:${cid}`);this.emit('inbox');return}
    if((kind==='reaction.changed'||kind==='messages.read')&&cid){if(this.activeConversation===cid)await this.refreshConversation(cid).catch(()=>{});this.emit('inbox');return}
    if(kind.startsWith('message.')||kind==='conversation.updated'){await this.refreshInbox().catch(()=>{})}
  }
}
