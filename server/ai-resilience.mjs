// Provider diagnostics contain no user content, keys or raw upstream messages.
export async function aiErrorKind(response){
 if(response.ok)return 'success';
 const data=await response.clone().json().catch(()=>null),message=String(data?.error?.message||'');
 if(response.status===400&&/user location.*not supported|free tier.*not available.*country/i.test(message))return 'region';
 if([400,401,403].includes(response.status)&&(data?.error?.details||[]).some(d=>d.reason==='API_KEY_INVALID'))return 'key';
 if([403,404].includes(response.status)&&/model/i.test(message)&&/not found|not available|no longer|permission|access|not supported/i.test(message))return 'model';
 if(response.status===429)return 'quota';
 if([408,500,502,503,504].includes(response.status))return 'temporary';
 if([401,403].includes(response.status))return 'key';
 return 'input';
}
const supported=new Set(['gemini-2.5-flash','gemini-2.5-flash-lite','gemini-3.1-flash-lite','gemini-3.5-flash-lite','gemini-3.6-flash','gemini-3.8-flash']);
const synthetic=kind=>Response.json({error:{status:kind==='region'?'FAILED_PRECONDITION':'NOT_FOUND',message:kind==='region'?'User location is not supported for the API use.':'Configured model is temporarily not available.'}},{status:kind==='region'?400:404});
export function createGeminiModelFallback(fetchFn,env,{state=new Map(),now=()=>Date.now(),wait=abortableWait,onResult=()=>{}}={}){
 return async function resilient(url,init={}){
  let parsed;try{parsed=new URL(String(url));}catch{return fetchFn(url,init);}
  const match=parsed.pathname.match(/^\/v1beta\/models\/(gemini-[a-z0-9.-]+):generateContent$/);
  if(env.AI_MODEL_FAILOVER_ENABLED!=='true'||parsed.origin!=='https://generativelanguage.googleapis.com'||!match||!supported.has(match[1]))return fetchFn(url,init);
  let body;try{body=JSON.parse(init.body);}catch{return fetchFn(url,init);}
  // Text and image understanding only; speech, video, audio and generation keep their original engines.
  if(body.generationConfig?.speechConfig||body.generationConfig?.responseModalities?.some(x=>x!=='TEXT')||body.contents?.some(c=>c.parts?.some(p=>/^(?:audio|video)\//.test(p.inlineData?.mimeType||p.fileData?.mimeType||''))))return fetchFn(url,init);
  const fallbacks=String(env.AI_GEMINI_FALLBACK_MODELS||'').split(',').map(s=>s.trim()).filter(m=>supported.has(m));
  const models=[...new Set([match[1],...fallbacks])].slice(0,3),header=new Headers(init.headers),key=header.get('x-goog-api-key');
  if(!key)return fetchFn(url,init);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key))),n=>n.toString(16).padStart(2,'0')).join('');
  const started=now();let attempts=0,last,reason='input',effective=match[1];
  const canceled=()=>{if(init.signal?.aborted)throw new DOMException('Canceled','AbortError');};
  for(const model of models){
   canceled();
   if(attempts>=2)break;
   const stateKey=hash+':'+model,cached=state.get(stateKey);
   if(cached?.until>now()){reason=cached.kind;last=synthetic(reason);if(reason==='region')break;continue;}
   state.delete(stateKey);
   effective=model;
   if(attempts&&reason==='temporary')await wait(200,init.signal);
   canceled();attempts++;
   const target=new URL(parsed);target.pathname=parsed.pathname.replace(match[1],model);
   // Identical credentials, payload, schema and cancellation signal; only a server-approved model may change.
   last=await fetchFn(target.href,{...init});
   canceled();reason=await aiErrorKind(last);
   if(reason==='success'||reason==='quota'||reason==='key'||reason==='input')break;
   if(reason==='model'||reason==='region'){
    if(state.size>=512){for(const [k,v] of state)if(v.until<=now())state.delete(k);if(state.size>=512)state.delete(state.keys().next().value);}
    state.set(stateKey,{kind:reason,until:now()+(reason==='model'?300000:30000)});
   }
   if(reason==='region')break; // A different model does not repair an unsupported egress region.
  }
  const event={requestedModel:match[1],effectiveModel:effective,status:last?.status||503,reason,attempts,ms:now()-started};
  try{onResult(event);}catch{}
  return last||synthetic('model');
 };
}
async function abortableWait(ms,signal){
 if(signal?.aborted)throw new DOMException('Canceled','AbortError');
 return new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(new DOMException('Canceled','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);signal?.addEventListener('abort',abort,{once:true});});
}
