import {API_BASE,LOGIN_URL} from '../config';
import {getToken} from '../auth/session';
async function parse(response:Response){const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{};}catch{data={message:text||`HTTP ${response.status}`};}if(!response.ok)throw new Error(data?.message||`HTTP ${response.status}`);return data;}
export async function login(email:string,password:string,deviceName='Private Gather mobile'){return parse(await fetch(LOGIN_URL,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({email,password,device_name:deviceName})}));}
export async function api(path:string,init:RequestInit={}){const token=await getToken();const headers:any={Accept:'application/json','Content-Type':'application/json',...(init.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;return parse(await fetch(`${API_BASE}${path}`,{...init,headers}));}
export const get=(path:string)=>api(path);
export const post=(path:string,body:any={})=>api(path,{method:'POST',body:JSON.stringify(body)});
