import * as SQLite from 'expo-sqlite';

export type StoredConversation={
  id:number;
  name:string;
  avatar_url?:string;
  preview?:string;
  unread:number;
  updated_at?:string;
  presence?:{online?:boolean;label?:string};
  [key:string]:any;
};

export type StoredMessage={
  id?:number;
  conversation_id?:number;
  body?:string;
  mine?:boolean;
  created?:string;
  delivery_status?:string;
  reactions?:any[];
  attachments?:any[];
  pending?:boolean;
  failed?:boolean;
  local_key?:string;
  [key:string]:any;
};

type OutboxRow={local_key:string;conversation_id:number;payload_json:string;attempts:number};

function json(value:any){try{return JSON.stringify(value??null)}catch{return 'null'}}
function parse<T=any>(value:any,fallback:T):T{try{return value?JSON.parse(String(value)):fallback}catch{return fallback}}
function sortMs(row:any){
  const raw=row?.created_at||row?.created||row?.updated_at;
  const parsed=raw?Date.parse(String(raw)):NaN;
  return Number.isFinite(parsed)?parsed:Date.now();
}

export class MessengerStore{
  private db?:SQLite.SQLiteDatabase;

  async init(){
    if(this.db)return;
    this.db=await SQLite.openDatabaseAsync('private-gather-messenger-v2.db');
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY NOT NULL,
        updated_ms INTEGER NOT NULL DEFAULT 0,
        unread INTEGER NOT NULL DEFAULT 0,
        raw_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS conversations_updated_idx ON conversations(updated_ms DESC);
      CREATE TABLE IF NOT EXISTS messages (
        row_key TEXT PRIMARY KEY NOT NULL,
        server_id INTEGER,
        conversation_id INTEGER NOT NULL,
        sort_ms INTEGER NOT NULL,
        pending INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        raw_json TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS messages_server_id_idx ON messages(server_id) WHERE server_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS messages_conversation_sort_idx ON messages(conversation_id,sort_ms ASC);
      CREATE TABLE IF NOT EXISTS outbox (
        local_key TEXT PRIMARY KEY NOT NULL,
        conversation_id INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_ms INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS outbox_retry_idx ON outbox(next_attempt_ms ASC);
      CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL,value TEXT);
    `);
  }

  private async ready(){if(!this.db)await this.init();return this.db!}

  async replaceConversations(rows:any[]){
    const db=await this.ready();
    await db.withTransactionAsync(async()=>{
      for(const row of rows){
        const id=Number(row?.id||0);if(!id)continue;
        const updated=sortMs(row);
        await db.runAsync(
          `INSERT INTO conversations(id,updated_ms,unread,raw_json) VALUES(?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET updated_ms=excluded.updated_ms,unread=excluded.unread,raw_json=excluded.raw_json`,
          id,updated,Number(row?.unread||0),json(row)
        );
      }
    });
  }

  async upsertConversation(row:any){await this.replaceConversations(row?[row]:[])}

  async conversations():Promise<StoredConversation[]>{
    const db=await this.ready();
    const rows=await db.getAllAsync<any>('SELECT raw_json FROM conversations ORDER BY updated_ms DESC,id DESC');
    return rows.map(r=>parse<StoredConversation>(r.raw_json,{id:0,name:'Conversation',unread:0}));
  }

  async mergeConversationPayload(payload:any){
    const conversation=payload?.conversation;
    if(conversation?.id)await this.upsertConversation(conversation);
    const cid=Number(conversation?.id||payload?.conversation_id||0);
    const messages=Array.isArray(payload?.messages)?payload.messages:[];
    if(cid&&messages.length)await this.upsertServerMessages(cid,messages);
  }

  async upsertServerMessages(conversationId:number,rows:any[]){
    const db=await this.ready();
    await db.withTransactionAsync(async()=>{
      for(const row of rows){
        const id=Number(row?.id||0);if(!id)continue;
        await db.runAsync(
          `INSERT INTO messages(row_key,server_id,conversation_id,sort_ms,pending,failed,raw_json) VALUES(?,?,?,?,0,0,?)
           ON CONFLICT(row_key) DO UPDATE SET conversation_id=excluded.conversation_id,sort_ms=excluded.sort_ms,pending=0,failed=0,raw_json=excluded.raw_json`,
          `s:${id}`,id,conversationId,sortMs(row),json(row)
        );
      }
    });
  }

  async removeServerMessage(messageId:number){
    const db=await this.ready();
    await db.runAsync('DELETE FROM messages WHERE server_id=?',messageId);
  }

  async messages(conversationId:number):Promise<StoredMessage[]>{
    const db=await this.ready();
    const rows=await db.getAllAsync<any>('SELECT row_key,pending,failed,raw_json FROM messages WHERE conversation_id=? ORDER BY sort_ms ASC,row_key ASC',conversationId);
    return rows.map(r=>({...parse<StoredMessage>(r.raw_json,{}),local_key:r.row_key,pending:!!r.pending,failed:!!r.failed}));
  }

  async optimisticMessage(conversationId:number,body:string,speakerId?:number|null){
    const db=await this.ready();
    const nonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const key=`l:${nonce}`;
    const raw={id:undefined,conversation_id:conversationId,body,mine:true,created:'Sending…',delivery_status:'sending',speaker_profile_identity_id:speakerId||undefined,client_nonce:nonce};
    const payload={body,speaker_profile_identity_id:speakerId||undefined,client_nonce:nonce};
    const now=Date.now();
    await db.withTransactionAsync(async()=>{
      await db.runAsync('INSERT INTO messages(row_key,server_id,conversation_id,sort_ms,pending,failed,raw_json) VALUES(?,NULL,?,?,1,0,?)',key,conversationId,now,json(raw));
      await db.runAsync('INSERT INTO outbox(local_key,conversation_id,payload_json,attempts,next_attempt_ms) VALUES(?,?,?,0,0)',key,conversationId,json(payload));
    });
    return {key,payload,message:{...raw,local_key:key,pending:true,failed:false}};
  }

  async confirmOptimistic(localKey:string,conversationId:number,server:any){
    const db=await this.ready();
    const id=Number(server?.id||0);
    await db.withTransactionAsync(async()=>{
      await db.runAsync('DELETE FROM outbox WHERE local_key=?',localKey);
      await db.runAsync('DELETE FROM messages WHERE row_key=?',localKey);
      if(id){
        await db.runAsync(
          `INSERT INTO messages(row_key,server_id,conversation_id,sort_ms,pending,failed,raw_json) VALUES(?,?,?,?,0,0,?)
           ON CONFLICT(row_key) DO UPDATE SET conversation_id=excluded.conversation_id,sort_ms=excluded.sort_ms,pending=0,failed=0,raw_json=excluded.raw_json`,
          `s:${id}`,id,conversationId,sortMs(server),json(server)
        );
      }
    });
  }

  async failOptimistic(localKey:string,attempts:number){
    const db=await this.ready();
    const retry=Math.min(30000,1000*Math.pow(2,Math.min(5,attempts)));
    await db.withTransactionAsync(async()=>{
      await db.runAsync('UPDATE messages SET pending=1,failed=1 WHERE row_key=?',localKey);
      await db.runAsync('UPDATE outbox SET attempts=?,next_attempt_ms=? WHERE local_key=?',attempts,Date.now()+retry,localKey);
    });
  }

  async retryNow(localKey:string){
    const db=await this.ready();
    await db.runAsync('UPDATE messages SET pending=1,failed=0 WHERE row_key=?',localKey);
    await db.runAsync('UPDATE outbox SET next_attempt_ms=0 WHERE local_key=?',localKey);
  }

  async removeOptimistic(localKey:string){
    const db=await this.ready();
    await db.withTransactionAsync(async()=>{await db.runAsync('DELETE FROM messages WHERE row_key=?',localKey);await db.runAsync('DELETE FROM outbox WHERE local_key=?',localKey)});
  }

  async dueOutbox():Promise<OutboxRow[]>{
    const db=await this.ready();
    return db.getAllAsync<OutboxRow>('SELECT local_key,conversation_id,payload_json,attempts FROM outbox WHERE next_attempt_ms<=? ORDER BY next_attempt_ms ASC LIMIT 20',Date.now());
  }

  async getValue(key:string):Promise<string|null>{
    const db=await this.ready();
    const row=await db.getFirstAsync<any>('SELECT value FROM kv WHERE key=?',key);
    return row?.value===null||row?.value===undefined?null:String(row.value);
  }

  async setValue(key:string,value:string|null){
    const db=await this.ready();
    if(value===null){await db.runAsync('DELETE FROM kv WHERE key=?',key);return;}
    await db.runAsync('INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,value);
  }

  async setUnread(conversationId:number,unread:number){
    const db=await this.ready();
    const row=await db.getFirstAsync<any>('SELECT raw_json FROM conversations WHERE id=?',conversationId);
    if(!row)return;
    const raw=parse<any>(row.raw_json,{});raw.unread=unread;
    await db.runAsync('UPDATE conversations SET unread=?,raw_json=? WHERE id=?',unread,json(raw),conversationId);
  }
}
