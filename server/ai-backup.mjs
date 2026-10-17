// Optional secondary provider. Kept OFF until the user confirms vendor/model
// and installs a newly rotated credential as a Cloudflare secret.
// Never echo secrets, provider responses, prompts or source content into logs.
export function backupConfigured(env){
 return env.AI_BACKUP_ENABLED==='true'&&env.SECONDARY_AI_PROVIDER==='xkiro'&&
  typeof env.SECONDARY_AI_API_KEY==='string'&&env.SECONDARY_AI_API_KEY.length>=20&&
  typeof env.SECONDARY_AI_MODEL==='string'&&/^[a-z0-9][a-z0-9./_:-]{1,120}$/i.test(env.SECONDARY_AI_MODEL);
}
export async function requestBackupJSON({fetchFn,env,signal,instruction,prompt,maxTokens=3200}){
 if(!backupConfigured(env))return null;
 const response=await fetchFn('https://api.xkiro.com/v1/chat/completions',{
  method:'POST',signal,
  headers:{Authorization:'Bearer '+env.SECONDARY_AI_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({model:env.SECONDARY_AI_MODEL,temperature:0.55,max_tokens:Math.max(120,Math.min(3200,Number(maxTokens)||3200)),
   response_format:{type:'json_object'},
   messages:[{role:'system',content:instruction},{role:'user',content:JSON.stringify(prompt)}]})
 });
 if(!response.ok)return {ok:false,status:response.status};
 const payload=await response.json();
 const content=payload?.choices?.[0]?.message?.content;
 if(typeof content!=='string'||content.length>50000)return {ok:false,status:502};
 try{return {ok:true,data:JSON.parse(content)}}catch{return {ok:false,status:502}}
}

// One sequential failover, never a parallel paid request. Authentication/source fetches
// bypass this adapter. A caller abort cancels both stages and never starts a backup.
export function createAiFailoverFetch(fetchFn,env,{timeoutMs=15000,backupTimeoutMs=25000}={}){
 if(fetchFn.hskFailover)return fetchFn;
 const wrapped=async(url,init={})=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/')||!backupConfigured(env))return fetchFn(url,init);
  let body;try{body=JSON.parse(init.body)}catch{return fetchFn(url,init)}
  const contents=body.contents||[];
  if(contents.some(c=>c.parts?.some(p=>p.inlineData||p.fileData)))return fetchFn(url,init);
  const parent=init.signal;
  const stage=async(fn,ms)=>{
   const controller=new AbortController(),abort=()=>controller.abort();
   if(parent?.aborted)throw new DOMException('Canceled','AbortError');
   parent?.addEventListener('abort',abort,{once:true});
   let timer,listener;
   try{return await Promise.race([
    Promise.resolve().then(()=>fn(controller.signal)),
    new Promise((_,reject)=>{listener=()=>reject(new DOMException('Canceled','AbortError'));controller.signal.addEventListener('abort',listener,{once:true});timer=setTimeout(()=>controller.abort(),ms);})
   ])}finally{clearTimeout(timer);controller.signal.removeEventListener('abort',listener);parent?.removeEventListener('abort',abort);}
  };
  let original;
  try{
   const result=await stage(async signal=>{
    const response=await fetchFn(url,{...init,signal});
    if(!response.ok)return {response,retry:[401,403,404,408,429,500,502,503,504].includes(response.status)};
    let json;try{json=await response.clone().json()}catch{return {response,retry:true}}
    const candidate=json.candidates?.[0];
    if(json.promptFeedback?.blockReason||candidate?.finishReason&&!['STOP','MAX_TOKENS'].includes(candidate.finishReason))return {response,retry:false};
    try{
     const text=(candidate?.content?.parts||[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
     const parsed=JSON.parse(text);
     const shape=(value,s)=>{
      if(!s)return !!value&&typeof value==='object';
      if(s.type==='OBJECT')return !!value&&typeof value==='object'&&!Array.isArray(value)&&(s.required||[]).every(k=>Object.hasOwn(value,k))&&Object.entries(s.properties||{}).every(([k,v])=>!Object.hasOwn(value,k)||shape(value[k],v));
      if(s.type==='ARRAY')return Array.isArray(value)&&value.every(v=>shape(v,s.items));
      if(s.type==='STRING')return typeof value==='string';
      if(s.type==='INTEGER')return Number.isInteger(value);
      if(s.type==='NUMBER')return Number.isFinite(value);
      if(s.type==='BOOLEAN')return typeof value==='boolean';
      return true;
     };
     return {response,retry:!shape(parsed,body.generationConfig?.responseSchema)||(candidate?.finishReason&&candidate.finishReason!=='STOP')};
    }catch{return {response,retry:true}}
   },timeoutMs);
   original=result.response;if(!result.retry)return original;
  }catch(error){if(parent?.aborted)throw error;}
  if(parent?.aborted)throw new DOMException('Canceled','AbortError');
  try{
   const instruction=(body.systemInstruction?.parts||[]).map(p=>p.text||'').join('\n')+'\nReturn JSON only matching this response schema: '+JSON.stringify(body.generationConfig?.responseSchema||{});
   const result=await stage(signal=>requestBackupJSON({fetchFn,env,signal,instruction,prompt:{contents},maxTokens:body.generationConfig?.maxOutputTokens}),backupTimeoutMs);
   if(result?.ok)return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result.data)}]}}]});
  }catch(error){if(parent?.aborted)throw error;}
  return original||Response.json({error:{status:'UNAVAILABLE'}},{status:503});
 };
 wrapped.hskFailover=true;return wrapped;
}
