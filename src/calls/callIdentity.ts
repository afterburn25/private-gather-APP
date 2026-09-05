export function callUuid(callId:number|string){
  const n=BigInt(String(callId||0));
  const tail=n.toString(16).padStart(12,'0').slice(-12);
  return `00000000-0000-4000-8000-${tail}`;
}
export function callIdFromUuid(uuid:string){
  const tail=String(uuid||'').split('-').pop()||'0';
  try{return Number(BigInt(`0x${tail}`));}catch{return Number(uuid)||0;}
}
