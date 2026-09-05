import RNCallKeep from 'react-native-callkeep';
import {PermissionsAndroid,Platform} from 'react-native';
import {callUuid,callIdFromUuid} from './callIdentity';
import {mediaDevices,RTCPeerConnection,RTCSessionDescription,RTCIceCandidate,MediaStream} from 'react-native-webrtc';
import {get,post} from '../api/client';
import {ReverbClient} from '../realtime/ReverbClient';

type Streams={local?:MediaStream,remote?:MediaStream,detail?:any,status?:string,remoteRevision?:number};
type IncomingHandler=(payload:any)=>void;

export class CallManager{
  private pc?:RTCPeerConnection;private local?:MediaStream;private remote?:MediaStream;private remoteVideo?:MediaStream;private realtime?:ReverbClient;private unsub?:()=>void;private callId=0;private isCaller=false;private remoteUserId=0;private onStreams?:(s:Streams)=>void;private onEnded?:()=>void;private closing=false;private pendingIce:any[]=[];private seenSignalIds=new Set<number>();private pollAfter=0;private pollTimer:any;private pollStopped=true;private pollBusy=false;private incomingTimer:any;private incomingStopped=true;private incomingBusy=false;private displayedIncomingId=0;private openActive=false;private configured=false;private callKeepReady=false;private systemAnswer?:(callId:number)=>void;private systemEnd?:(callId:number)=>void;private muted=false;private preview?:MediaStream;private previewCallId=0;private mode:'voice'|'video'='voice';private remoteRevision=0;private remoteVideoRecoveryTimer:any;private remoteVideoRecoveryAttempts=0;private offerBusy=false;private activeOfferStarted=false;private ignoredCalls=new Map<number,number>();

  async configure(onAnswer:(callId:number)=>void,onEnd:(callId:number)=>void){
    this.systemAnswer=onAnswer;this.systemEnd=onEnd;
    if(!this.configured){
      try{
        await RNCallKeep.setup({ios:{appName:'Private Gather',supportsVideo:true,maximumCallsPerCallGroup:1,maximumCallGroups:1,displayCallReachabilityTimeout:15000},android:{alertTitle:'Enable Private Gather calling',alertDescription:'Allow Private Gather to show and manage private voice/video calls.',cancelButton:'Not now',okButton:'Enable',additionalPermissions:[],foregroundService:{channelId:'private-gather-calls',channelName:'Private Gather calls',notificationTitle:'Private Gather call',notificationIcon:'mipmap/ic_launcher'}}});
        RNCallKeep.addEventListener('answerCall',({callUUID}:any)=>{const id=callIdFromUuid(String(callUUID));if(id&&id===this.callId){if(Platform.OS==='android')Promise.resolve(RNCallKeep.backToForeground()).catch(()=>{});this.systemAnswer?.(id);}});
        RNCallKeep.addEventListener('endCall',({callUUID}:any)=>{const id=callIdFromUuid(String(callUUID));if(id&&id===this.callId)this.systemEnd?.(id);});
        this.callKeepReady=true;
      }catch(e){console.warn('Private Gather system calling UI unavailable',String((e as any)?.message||e));}
      this.configured=true;
    }
    if(this.callKeepReady){try{RNCallKeep.setAvailable(true);RNCallKeep.setReachable();}catch{}}
  }

  async incoming(payload:any,displaySystemUi=true){
    const id=Number(payload?.call_id??payload?.id??0);this.pruneIgnoredCalls();if(!id||this.isIgnoredCall(id))return null;if(this.openActive&&this.callId&&this.callId!==id)return null;
    const normalized={...payload,call_id:id,mode:String(payload?.mode||'voice')==='video'?'video':'voice',caller_name:String(payload?.caller_name||payload?.callerName||'Private Gather member')};
    this.callId=id;
    if(this.displayedIncomingId!==id){
      this.displayedIncomingId=id;
      if(displaySystemUi&&this.callKeepReady){
        try{await Promise.resolve(RNCallKeep.displayIncomingCall(callUuid(id),String(payload?.caller_id||id),normalized.caller_name,'generic',normalized.mode==='video'));}catch{}
      }
    }
    return normalized;
  }

  ignoreCall(id:number,forMs=180000){if(id>0)this.ignoredCalls.set(id,Date.now()+forMs);}
  isIgnoredCall(id:number){const until=this.ignoredCalls.get(id)||0;if(until>Date.now())return true;if(until)this.ignoredCalls.delete(id);return false;}
  private pruneIgnoredCalls(){const now=Date.now();for(const [id,until] of this.ignoredCalls.entries())if(until<=now)this.ignoredCalls.delete(id);}
  private async finishServerCall(id:number,action:'end'|'decline'){
    if(!id)return;
    const path=`/calls/${id}/${action}`;
    let delay=250;
    for(let attempt=0;attempt<3;attempt++){
      try{await post(path,{});return}catch(e){
        if(attempt===2){console.warn('Private Gather call finalization retry exhausted',id,action,String((e as any)?.message||e));return}
        await new Promise(resolve=>setTimeout(resolve,delay));delay*=2;
      }
    }
  }

  watchIncoming(onIncoming:IncomingHandler,intervalMs=1400){
    this.stopIncomingWatch();this.incomingStopped=false;
    const tick=async()=>{
      if(this.incomingStopped)return;
      if(!this.incomingBusy){
        this.incomingBusy=true;
        try{
          if(!this.openActive){
            const response=await get('/calls/incoming');const raw=response?.incoming;const id=Number(raw?.call_id??raw?.id??0);
            if(id&&id!==this.displayedIncomingId){
              const normalized=await this.incoming(raw,false);
              if(normalized)onIncoming(normalized);
            }
          }
        }catch{}finally{this.incomingBusy=false}
      }
      if(!this.incomingStopped)this.incomingTimer=setTimeout(tick,Math.max(900,intervalMs));
    };
    tick();return()=>this.stopIncomingWatch();
  }
  private stopIncomingWatch(){this.incomingStopped=true;clearTimeout(this.incomingTimer);this.incomingTimer=undefined;this.incomingBusy=false;}

  private async ensureMediaPermissions(mode:'voice'|'video',audio=true){
    if(Platform.OS!=='android')return;
    const wanted:any[]=[];
    if(audio)wanted.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if(mode==='video')wanted.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    if(!wanted.length)return;
    const result=await PermissionsAndroid.requestMultiple(wanted);
    const denied=wanted.filter(p=>result[p]!==PermissionsAndroid.RESULTS.GRANTED);
    if(denied.length)throw new Error(mode==='video'?(audio?'Private Gather needs camera and microphone permission for video calls.':'Private Gather needs camera permission for your video preview.'):'Private Gather needs microphone permission for voice calls.');
  }

  private videoConstraints(){
    // Prefer a native portrait stream so a full-phone preview does not have to crop a
    // landscape/4:3 source heavily. Fallbacks below keep older Samsung cameras working.
    return {facingMode:'user',width:720,height:1280,aspectRatio:9/16,frameRate:24};
  }

  private async captureLocal(mode:'voice'|'video',audio=true){
    await this.ensureMediaPermissions(mode,audio);
    if(mode==='voice')return await mediaDevices.getUserMedia({audio,video:false}) as MediaStream;

    const attempts:any[]=[
      {audio,video:this.videoConstraints()},
      {audio,video:{facingMode:'user',width:540,height:960,aspectRatio:9/16}},
      {audio,video:{facingMode:'user',width:640,height:480}},
      {audio,video:{facingMode:'user'}},
      {audio,video:true},
    ];
    let last:any=null;
    for(const constraints of attempts){
      try{
        const stream=await mediaDevices.getUserMedia(constraints) as MediaStream;
        const video=stream.getVideoTracks?.()[0];
        if(video){
          try{await video.applyConstraints?.({...this.videoConstraints(),advanced:[{zoom:1}]})}catch{try{await video.applyConstraints?.(this.videoConstraints())}catch{}}
          console.log('Private Gather local video ready',String(video.id||''),JSON.stringify(video.getSettings?.()||{}));
          return stream;
        }
        stream.getTracks?.().forEach((track:any)=>track.stop());
      }catch(e){last=e}
    }
    throw last||new Error('Private Gather could not start the front camera.');
  }

  private async sendSignal(kind:string,payload:any){
    let last:any=null;
    for(let attempt=0;attempt<4;attempt++){
      try{
        return await post(`/calls/${this.callId}/signal`,{kind,payload:JSON.stringify(payload)});
      }catch(e){
        last=e;
        if(attempt<3)await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));
      }
    }
    throw last||new Error(`Could not send ${kind} call signal.`);
  }

  private async waitForIceGathering(timeoutMs=3400){
    if(!this.pc||this.pc.iceGatheringState==='complete')return;
    await new Promise<void>(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;clearTimeout(timer);try{this.pc?.removeEventListener?.('icegatheringstatechange',onState as any)}catch{}resolve()};
      const onState=()=>{if(this.pc?.iceGatheringState==='complete')finish()};
      const timer=setTimeout(finish,timeoutMs);
      try{this.pc?.addEventListener?.('icegatheringstatechange',onState as any)}catch{}
    });
  }

  private assertVideoTrack(stream?:MediaStream){
    if(this.mode!=='video')return;
    const video=stream?.getVideoTracks?.()[0];
    if(!video)throw new Error('Private Gather video call started without a camera track.');
  }

  async start(target:{userId?:number;username?:string;conversationId?:number},mode:'voice'|'video',peerName:string,realtimeConfig:any,onStreams:(s:Streams)=>void,onEnded:()=>void){
    // Start the server request and local A/V acquisition at the same time. Camera
    // startup can never hold the server call hostage, but the caller still gets an
    // immediate local preview as soon as the device camera becomes available.
    this.onStreams=onStreams;this.onEnded=onEnded;this.mode=mode;
    const mediaPromise=(async()=>{
      const local=await this.captureLocal(mode,true);
      this.local=local;
      if(mode==='video')this.assertVideoTrack(local);
      this.onStreams?.({local,status:'starting'});
      return local;
    })();

    const startPromise=post('/calls/start-native',{
      mode,
      target_user_id:Number(target?.userId||0)||undefined,
      target_username:String(target?.username||'').replace(/^@/,'')||undefined,
      conversation_id:Number(target?.conversationId||0)||undefined,
    });

    let started:any;
    try{
      started=await startPromise;
      this.callId=Number(started.call_id);this.displayedIncomingId=0;
      if(Platform.OS==='ios'&&this.callKeepReady){try{RNCallKeep.startCall(callUuid(this.callId),String(target?.userId||target?.username||this.callId),peerName||'Private Gather member','generic',mode==='video');}catch{}}
      const preparedLocal=await mediaPromise;
      const opened=await this.open(this.callId,realtimeConfig,onStreams,onEnded,preparedLocal);
      return {...started,detail:opened.detail};
    }catch(e){
      try{(await mediaPromise)?.getTracks?.().forEach((track:any)=>track.stop())}catch{}
      const id=this.callId;try{if(id)await post(`/calls/${id}/end`,{})}catch{}
      this.teardown(false);throw e;
    }
  }

  async prepareIncomingPreview(callId:number,detailHint?:any){
    const detail=detailHint||((await get(`/calls/${callId}`)).data);
    if(String(detail?.mode||'voice')!=='video')return {detail,local:undefined};
    if(this.preview&&this.previewCallId===callId)return {detail,local:this.preview};
    this.clearIncomingPreview();
    this.mode='video';
    this.preview=await this.captureLocal('video',false);
    this.assertVideoTrack(this.preview);
    this.previewCallId=callId;
    return {detail,local:this.preview};
  }

  clearIncomingPreview(){
    try{this.preview?.getTracks().forEach(t=>t.stop());}catch{}
    this.preview=undefined;this.previewCallId=0;
  }

  async open(callId:number,realtimeConfig:any,onStreams:(s:Streams)=>void,onEnded:()=>void,preparedLocal?:MediaStream){
    if(this.openActive&&this.callId&&this.callId!==callId)this.teardown(false);
    this.callId=callId;this.closing=false;this.openActive=true;this.pendingIce=[];this.seenSignalIds.clear();this.pollAfter=0;this.onStreams=onStreams;this.onEnded=onEnded;this.activeOfferStarted=false;
    const detail=(await get(`/calls/${callId}`)).data;
    this.isCaller=!!detail.caller;this.remoteUserId=Number(detail?.peer?.id||0);this.mode=detail.mode==='video'?'video':'voice';

    // Samsung and several Android camera stacks do not reliably allow a second
    // getUserMedia request while the preview stream still owns the camera.
    this.clearIncomingPreview();
    if(preparedLocal){
      this.local=preparedLocal;
    }else{
      this.local=await this.captureLocal(this.mode,true);
    }
    this.assertVideoTrack(this.local);
    this.onStreams({local:this.local,detail,status:detail.status});

    this.pc=new RTCPeerConnection({iceServers:detail.ice_servers,iceTransportPolicy:'all',bundlePolicy:'max-bundle',rtcpMuxPolicy:'require'} as any);
    this.local.getTracks().forEach(track=>this.pc?.addTrack(track,this.local!));
    try{for(const tr of this.pc.getTransceivers?.()||[]){tr.direction='sendrecv';}}catch{}

    this.pc.ontrack=e=>{
      const event:any=e as any;
      const track:any=event.track;
      if(!track)return;

      if(!this.remote)this.remote=new MediaStream();
      if(!this.remote.getTracks().some((t:any)=>String(t.id)===String(track.id))){
        try{this.remote.addTrack(track)}catch{}
      }

      if(track.kind==='video'){
        if(!this.remoteVideo)this.remoteVideo=new MediaStream();
        if(!this.remoteVideo.getVideoTracks().some((t:any)=>String(t.id)===String(track.id))){
          try{this.remoteVideo.addTrack(track)}catch{}
        }
        this.remoteVideoRecoveryAttempts=0;clearTimeout(this.remoteVideoRecoveryTimer);
      }

      const renderStream=track.kind==='video'?this.remoteVideo:this.remoteVideo||this.remote;
      this.remoteRevision++;
      console.log('Private Gather remote track',String(track.kind||'unknown'),'videoTracks',this.remoteVideo?.getVideoTracks?.().length||0,'allTracks',this.remote?.getTracks?.().length||0);
      this.onStreams?.({local:this.local,remote:renderStream,detail,status:'active',remoteRevision:this.remoteRevision});

      try{
        track.addEventListener?.('unmute',()=>{
          this.remoteRevision++;
          this.onStreams?.({local:this.local,remote:this.remoteVideo||this.remote,detail,status:'active',remoteRevision:this.remoteRevision});
        });
      }catch{}
      if(track.kind!=='video')this.armRemoteVideoRecovery();
    };

    this.pc.onicecandidate=e=>{if(e.candidate)this.sendSignal('ice',e.candidate).catch(()=>{});};
    this.pc.onconnectionstatechange=()=>{
      const state=String(this.pc?.connectionState||'');
      this.onStreams?.({local:this.local,remote:this.remote,detail,status:state,remoteRevision:this.remoteRevision});
      if(state==='connected')this.armRemoteVideoRecovery();
      if(['failed','disconnected'].includes(state)&&this.isCaller)this.createOffer(true).catch(()=>{});
    };

    if(realtimeConfig){
      try{
        this.realtime=new ReverbClient(realtimeConfig);this.realtime.connect();this.unsub=this.realtime.subscribe(`private-call.${callId}`,e=>this.handleRealtime(e));
      }catch(e){console.warn('Private Gather call realtime fast path unavailable; HTTP recovery remains active.',String((e as any)?.message||e));}
    }
    this.startCallPolling(callId);

    if(String(detail.status||'')==='active'){
      if(this.isCaller)this.ensureActiveOffer();
      else this.sendSignal('restart',{reason:'native-callee-media-ready',at:new Date().toISOString()}).catch(()=>{});
    }
    return {detail,local:this.local};
  }

  // Server answer is deliberately separate from opening camera/microphone so the
  // ringing state stops immediately when the user taps Answer.
  async answer(){
    if(!this.callId)return;
    await post(`/calls/${this.callId}/answer`,{});
    if(this.callKeepReady){try{RNCallKeep.setCurrentCallActive(callUuid(this.callId));}catch{}}
  }

  async decline(){
    const id=this.callId;if(!id)return;
    this.ignoreCall(id);this.closing=true;this.teardown();
    this.finishServerCall(id,'decline').catch(()=>this.finishServerCall(id,'end').catch(()=>{}));
  }
  async end(){
    if(this.closing)return;
    const id=this.callId;if(id)this.ignoreCall(id);
    this.closing=true;this.teardown();
    if(id)this.finishServerCall(id,'end').catch(()=>{});
  }

  toggleMute(){const track=this.local?.getAudioTracks?.()[0];if(!track)return this.muted;this.muted=!this.muted;track.enabled=!this.muted;return this.muted;}
  toggleVideo(){const track=this.local?.getVideoTracks?.()[0];if(!track)return false;track.enabled=!track.enabled;return track.enabled;}
  flipCamera(){const track:any=this.local?.getVideoTracks?.()[0];try{track?._switchCamera?.();return true}catch{return false}}

  private startCallPolling(callId:number){
    this.stopCallPolling();this.pollStopped=false;
    const tick=async()=>{
      if(this.pollStopped||this.callId!==callId)return;
      if(!this.pollBusy){
        this.pollBusy=true;
        try{
          const row=await get(`/calls/${callId}/poll?after=${this.pollAfter}`);
          for(const signal of (Array.isArray(row?.signals)?row.signals:[]))await this.handleSignal(signal,'poll');
          this.pollAfter=Math.max(this.pollAfter,Number(row?.last_id||this.pollAfter));
          this.applyStatus(String(row?.status||''));
        }catch{}finally{this.pollBusy=false}
      }
      if(!this.pollStopped&&this.callId===callId)this.pollTimer=setTimeout(tick,700);
    };tick();
  }
  private stopCallPolling(){this.pollStopped=true;clearTimeout(this.pollTimer);this.pollTimer=undefined;this.pollBusy=false;}

  private applyStatus(status:string){
    if(!status)return;
    this.onStreams?.({local:this.local,remote:this.remote,status,remoteRevision:this.remoteRevision});
    if(status==='active'){
      if(this.callKeepReady){try{RNCallKeep.setCurrentCallActive(callUuid(this.callId));}catch{}}
      if(this.isCaller)this.ensureActiveOffer();
    }
    if(['ended','declined','missed','canceled'].includes(status))this.remoteClose();
  }

  private ensureActiveOffer(){
    if(!this.isCaller||!this.pc||this.closing||this.activeOfferStarted)return;
    this.activeOfferStarted=true;
    this.createOffer(true).catch(e=>{this.activeOfferStarted=false;console.warn('Private Gather post-answer offer failed',String((e as any)?.message||e));});
  }

  private armRemoteVideoRecovery(){
    clearTimeout(this.remoteVideoRecoveryTimer);
    if(this.mode!=='video'||!this.callId||this.closing)return;
    const live=()=>this.remoteVideo?.getVideoTracks?.().some((track:any)=>String(track.readyState||'live')==='live');
    if(live()){this.remoteVideoRecoveryAttempts=0;return;}
    if(this.remoteVideoRecoveryAttempts>=3)return;
    this.remoteVideoRecoveryTimer=setTimeout(async()=>{
      if(this.closing||live())return;
      this.remoteVideoRecoveryAttempts++;
      try{
        if(this.isCaller){this.activeOfferStarted=false;this.ensureActiveOffer();}
        else await this.sendSignal('restart',{reason:'native-remote-video-missing',attempt:this.remoteVideoRecoveryAttempts,at:new Date().toISOString()});
      }catch{}
      if(!live())this.armRemoteVideoRecovery();
    },4000);
  }

  private async createOffer(iceRestart=false){
    if(!this.isCaller||!this.pc||this.closing||this.offerBusy)return;
    this.offerBusy=true;
    try{
      const offer=await this.pc.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:this.mode==='video',...(iceRestart?{iceRestart:true}:{})} as any);
      if(this.mode==='video'&&!/(^|\r?\n)m=video\s/m.test(String(offer?.sdp||'')))throw new Error('Private Gather WebRTC offer is missing the video media section.');
      await this.pc.setLocalDescription(offer);
      await this.waitForIceGathering();
      await this.sendSignal('offer',this.pc.localDescription||offer);
    }finally{this.offerBusy=false}
  }

  private async addIce(payload:any){if(!this.pc)return;if(!this.pc.remoteDescription){this.pendingIce.push(payload);return}try{await this.pc.addIceCandidate(new RTCIceCandidate(payload))}catch{}}
  private async flushIce(){if(!this.pc?.remoteDescription)return;const rows=this.pendingIce.splice(0);for(const candidate of rows)await this.addIce(candidate)}

  private async handleSignal(s:any,source:'realtime'|'poll'){
    const signalId=Number(s?.id||0);
    if(source==='realtime'&&Number(s?.user_id||0)>0&&this.remoteUserId>0&&Number(s.user_id)!==this.remoteUserId)return;
    if(signalId&&this.seenSignalIds.has(signalId))return;
    if(signalId)this.seenSignalIds.add(signalId);
    let payload:any={};try{payload=typeof s?.payload==='string'?JSON.parse(s.payload||'{}'):(s?.payload||{})}catch{payload={}}
    if(s?.kind==='restart'){
      if(this.isCaller&&this.pc){this.activeOfferStarted=true;try{await this.createOffer(true)}catch(e){this.activeOfferStarted=false;throw e}}
      return;
    }
    if(s?.kind==='offer'){
      if(this.isCaller||!this.pc)return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
      await this.flushIce();
      const answer=await this.pc.createAnswer();
      if(this.mode==='video'&&!/(^|\r?\n)m=video\s/m.test(String(answer?.sdp||'')))throw new Error('Private Gather WebRTC answer is missing the video media section.');
      await this.pc.setLocalDescription(answer);
      await this.waitForIceGathering();
      await this.sendSignal('answer',this.pc.localDescription||answer);
      this.armRemoteVideoRecovery();
      return;
    }
    if(s?.kind==='answer'){
      if(!this.isCaller||!this.pc)return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
      await this.flushIce();
      this.armRemoteVideoRecovery();
      return;
    }
    if(s?.kind==='ice'){await this.addIce(payload);return}
    if(s?.kind==='hangup')this.remoteClose();
  }

  private async handleRealtime(event:any){if(event?.kind==='status'){this.applyStatus(String(event?.payload?.status||''));return}if(event?.kind!=='signal'||!event?.payload?.signal)return;try{await this.handleSignal(event.payload.signal,'realtime')}catch{}}
  private remoteClose(){if(this.closing)return;const id=this.callId;if(id)this.ignoreCall(id,90000);this.closing=true;this.teardown()}
  private teardown(notify=true){
    const endingCallId=this.callId;
    this.stopCallPolling();clearTimeout(this.remoteVideoRecoveryTimer);this.remoteVideoRecoveryAttempts=0;this.offerBusy=false;this.activeOfferStarted=false;this.clearIncomingPreview();
    try{if(endingCallId&&this.callKeepReady)RNCallKeep.endCall(callUuid(endingCallId))}catch{}
    this.unsub?.();this.realtime?.close();this.local?.getTracks().forEach(t=>t.stop());this.remote?.getTracks().forEach(t=>t.stop());this.remoteVideo?.getTracks().forEach(t=>t.stop());this.pc?.close();
    this.unsub=undefined;this.realtime=undefined;this.pc=undefined;this.local=undefined;this.remote=undefined;this.remoteVideo=undefined;this.pendingIce=[];this.seenSignalIds.clear();this.pollAfter=0;this.remoteUserId=0;this.isCaller=false;this.openActive=false;this.callId=0;this.closing=false;this.muted=false;this.mode='voice';this.remoteRevision=0;
    const cb=this.onEnded;this.onEnded=undefined;this.onStreams=undefined;if(notify)cb?.();
  }
}
