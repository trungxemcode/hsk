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
 // Preserve existing numbered slots; include the distinct legacy primary as slot 0.
 const primary=env.GEMINI_API_KEY;
 if(typeof primary==='string'&&primary.trim()&&primary.trim().length<=300&&!seen.has(primary.trim())&&entries.length<13)entries.push({slot:0,key:primary.trim()});
 return entries;
}
async function geminiKeyId(key){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function geminiCooldown(response,now){
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
 const daily=details.some(d=>d.violations?.some(v=>/perday|daily/i.test(String(v.quotaId)+' '+String(v.quotaMetric))||String(v.quotaValue)==='0'));
 return Math.max(daily?86400000:60000,Number.isFinite(ms)?ms:0);
}
export function createGeminiKeyFetch(fetchFn,env,{now=()=>Date.now(),state={cursor:0,blocked:new Map()},onAttempt=()=>{},slot,namespace='global-hsk-budget-v1'}={}){
 const slots=configuredGeminiSlots(env),keys=slots.map(entry=>entry.key);
 const callKey=async(index,url,init)=>{
  const headers=new Headers(init.headers);headers.set('x-goog-api-key',keys[index]);const started=Date.now();
  const report=(status,outcome)=>{try{onAttempt({phase:'gemini-key',slot:slots[index].slot,ms:Date.now()-started,status,outcome})}catch{}};
  try{const response=await fetchFn(url,{...init,headers});report(response.status,'response');return response;}
  catch(error){report(0,init.signal?.aborted?'canceled':'network');throw error;}
 };
 let idsPromise;
 const requestWithKeys=async(url,init={})=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/')&&!(namespace.startsWith('hsk-tts-model-v1:')&&String(url)==='https://generativelanguage.googleapis.com/v1beta/interactions'))return fetchFn(url,init);
  const canceled=()=>{if(init.signal?.aborted)throw new DOMException('Canceled','AbortError');};
  canceled();
  if(!keys.length)return Response.json({error:{status:'UNAVAILABLE'}},{status:503});
  // Legacy single-key installations retain one attempt and existing behavior.
  if(slot!==undefined&&!slots.some(entry=>entry.slot===slot))return Response.json({error:{status:'UNAVAILABLE'}},{status:503});
  if(keys.length===1&&namespace==='global-hsk-budget-v1')return callKey(0,url,init);
  const ids=await (idsPromise||=Promise.all(keys.map(geminiKeyId))),excluded=ids.filter((id,i)=>slot!==undefined&&slots[i].slot!==slot);
  let last;
  // Never fan out or scan ten accounts for one prompt: max two sequential calls.
  for(let attempt=0;attempt<(slot===undefined?2:1);attempt++){
   canceled();
   let picked=await controlCall(env,'gemini-pick',{ids,excluded},namespace);
   canceled();
   if(!picked){
    let index=-1,retryAt=Infinity;
    for(let n=0;n<ids.length;n++){const i=(state.cursor+n)%ids.length;if(excluded.includes(ids[i]))continue;const until=state.blocked.get(ids[i])||0;if(until<=now()){index=i;break;}retryAt=Math.min(retryAt,until);}
    if(index>=0)state.cursor=(index+1)%ids.length;
    picked={index,retryAfter:Math.max(1,Math.ceil((retryAt-now())/1000))};
   }
   if(!Number.isInteger(picked.index)||picked.index<0||picked.index>=keys.length){
    if(last)return last;
    return Response.json({error:{status:'RESOURCE_EXHAUSTED'}},{status:429,headers:{'Retry-After':String(Number.isFinite(picked.retryAfter)?Math.max(1,picked.retryAfter):60),'X-HSK-Provider-Attempted':'0'}});
   }
   const index=picked.index;excluded.push(ids[index]);
   let response;
   try{response=await callKey(index,url,init);}catch(error){canceled();throw error;}
   canceled();
   const delay=await geminiCooldown(response,now());
   canceled();
   if(!delay)return response; // Includes refusals, malformed successes and bad input.
   state.blocked.set(ids[index],now()+delay);
   await controlCall(env,'gemini-report',{id:ids[index],delay},namespace);
   // Preserve the computed cooldown on the FIRST failure as well as later local rejections.
   const responseHeaders=new Headers(response.headers);responseHeaders.set('Retry-After',String(Math.ceil(delay/1000)));responseHeaders.set('X-HSK-Provider-Attempted','1');
   last=new Response(response.body,{status:response.status,statusText:response.statusText,headers:responseHeaders});
  }
  return last;
 };
 requestWithKeys.availability=async()=>{
  const ids=await (idsPromise||=Promise.all(keys.map(geminiKeyId)));
  const result=await controlCall(env,'gemini-status',{ids},namespace);
  if(result&&result.status!==200)throw Error('key_status_unavailable');
  return slots.map((entry,index)=>({slot:entry.slot,retryAfter:result?Number(result.slots?.find(s=>s.index===index)?.retryAfter)||0:Math.max(0,Math.ceil(((state.blocked.get(ids[index])||0)-now())/1000))}));
 };
 // Metadata probe never generates audio or changes generation cooldowns.
 requestWithKeys.inspect=async(model)=>{
  if(slot===undefined||!/^gemini-[a-z0-9.-]+-tts(?:-preview)?$/.test(model))throw Error('invalid_inspection');
  const index=slots.findIndex(entry=>entry.slot===slot);
  if(index<0)return Response.json({error:{status:'NOT_FOUND'}},{status:404});
  return callKey(index,'https://generativelanguage.googleapis.com/v1beta/models/'+model,{method:'GET'});
 };
 return requestWithKeys;
}
