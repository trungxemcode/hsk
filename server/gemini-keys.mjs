import { controlCall } from './ai-control.mjs';

// Slot 1 accepts the existing secret. Remaining slots are optional, server-only.
export function configuredGeminiKeys(env){
 return configuredGeminiSlots(env).map(entry=>entry.key);
}
function configuredGeminiSlots(env){
 const seen=new Set(),entries=[];
 for(let slot=1;slot<=12;slot++){
  const raw=env['GEMINI_API_KEY_'+slot]||(slot===1?env.GEMINI_API_KEY:'');
  if(typeof raw!=='string'||!raw.trim()||raw.trim().length>300)continue;
  const key=raw.trim();if(seen.has(key))continue;seen.add(key);entries.push({slot,key});
 }
 return entries;
}
async function geminiKeyId(key){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function geminiCooldown(response,now){
 const status=response.status;
 if(![400,401,403,429,500,502,503,504].includes(status))return 0;
 const data=await response.clone().json().catch(()=>null),details=data?.error?.details||[];
 if(status===400&&!details.some(d=>d.reason==='API_KEY_INVALID'))return 0;
 if(status===400||status===401||status===403)return 15*60*1000;
 if(status>=500)return 15000;
 const retry=response.headers.get('Retry-After');
 let ms=retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Date.parse(retry)-now):0;
 for(const d of details){const seconds=typeof d.retryDelay==='string'?Number(d.retryDelay.replace(/s$/,'')):Number(d.retryDelay?.seconds);if(Number.isFinite(seconds))ms=Math.max(ms,seconds*1000);}
 // Daily exhaustion should not be retried once per minute. A conservative 24h
 // pause avoids assuming a UTC reset for Google's Pacific-time daily quota.
 const daily=details.some(d=>d.violations?.some(v=>/perday|daily/i.test(String(v.quotaId)+' '+String(v.quotaMetric))));
 return Math.max(daily?86400000:60000,Number.isFinite(ms)?ms:0);
}
export function createGeminiKeyFetch(fetchFn,env,{now=()=>Date.now(),state={cursor:0,blocked:new Map()},onAttempt=()=>{}}={}){
 const slots=configuredGeminiSlots(env),keys=slots.map(entry=>entry.key);
 const callKey=async(index,url,init)=>{
  const headers=new Headers(init.headers);headers.set('x-goog-api-key',keys[index]);const started=Date.now();
  const report=(status,outcome)=>{try{onAttempt({phase:'gemini-key',slot:slots[index].slot,ms:Date.now()-started,status,outcome})}catch{}};
  try{const response=await fetchFn(url,{...init,headers});report(response.status,'response');return response;}
  catch(error){report(0,init.signal?.aborted?'canceled':'network');throw error;}
 };
 let idsPromise;
 return async(url,init={})=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/'))return fetchFn(url,init);
  const canceled=()=>{if(init.signal?.aborted)throw new DOMException('Canceled','AbortError');};
  canceled();
  if(!keys.length)return Response.json({error:{status:'UNAVAILABLE'}},{status:503});
  // Legacy single-key installations retain one attempt and existing behavior.
  if(keys.length===1)return callKey(0,url,init);
  const ids=await (idsPromise||=Promise.all(keys.map(geminiKeyId))),excluded=[];
  let last;
  // Never fan out or scan the full key pool for one prompt: max two sequential calls.
  for(let attempt=0;attempt<2;attempt++){
   canceled();
   let picked=await controlCall(env,'gemini-pick',{ids,excluded});
   canceled();
   if(!picked){
    let index=-1,retryAt=Infinity;
    for(let n=0;n<ids.length;n++){const i=(state.cursor+n)%ids.length;if(excluded.includes(ids[i]))continue;const until=state.blocked.get(ids[i])||0;if(until<=now()){index=i;break;}retryAt=Math.min(retryAt,until);}
    if(index>=0)state.cursor=(index+1)%ids.length;
    picked={index,retryAfter:Math.max(1,Math.ceil((retryAt-now())/1000))};
   }
   if(!Number.isInteger(picked.index)||picked.index<0||picked.index>=keys.length){
    if(last)return last;
    return Response.json({error:{status:'RESOURCE_EXHAUSTED'}},{status:429,headers:{'Retry-After':String(Number.isFinite(picked.retryAfter)?Math.max(1,picked.retryAfter):60)}});
   }
   const index=picked.index;excluded.push(ids[index]);
   let response;
   try{response=await callKey(index,url,init);}catch(error){canceled();throw error;}
   canceled();
   const delay=await geminiCooldown(response,now());
   canceled();
   if(!delay)return response; // Includes refusals, malformed successes and bad input.
   state.blocked.set(ids[index],now()+delay);
   await controlCall(env,'gemini-report',{id:ids[index],delay});
   last=response;
  }
  return last;
 };
}
